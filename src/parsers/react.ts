/**
 * React 组件解析器
 */

import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import fs from 'fs-extra'
import type { ComponentDoc, PropDoc, SourceLocation } from '../types'
import { logger } from '../core/logger'

/**
 * 解析 React 组件文件
 */
export async function parseReactComponent(filePath: string): Promise<ComponentDoc> {
  logger.debug(`解析 React 组件: ${filePath}`)

  if (!(await fs.pathExists(filePath))) {
    throw new Error(`文件不存在: ${filePath}`)
  }

  const content = await fs.readFile(filePath, 'utf-8')
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'decorators-legacy'],
  })

  let componentName = extractComponentName(filePath)
  let description: string | undefined
  const props: PropDoc[] = []

  traverse(ast, {
    // 函数组件
    FunctionDeclaration(path) {
      if (path.node.id && isComponentFunction(path.node)) {
        componentName = path.node.id.name
        description = extractJSDocComment(path.node)

        // 提取 props 类型
        if (path.node.params.length > 0) {
          const param = path.node.params[0]
          if (t.isIdentifier(param) && param.typeAnnotation) {
            props.push(...extractPropsFromTypeAnnotation(param.typeAnnotation))
          }
        }
      }
    },

    // 箭头函数组件
    VariableDeclarator(path) {
      if (
        t.isIdentifier(path.node.id) &&
        t.isArrowFunctionExpression(path.node.init) &&
        isComponentFunction(path.node.init)
      ) {
        componentName = path.node.id.name
        description = extractJSDocComment(path.node)

        if (path.node.init.params.length > 0) {
          const param = path.node.init.params[0]
          if (t.isIdentifier(param) && param.typeAnnotation) {
            props.push(...extractPropsFromTypeAnnotation(param.typeAnnotation))
          }
        }
      }
    },

    // 类组件
    ClassDeclaration(path) {
      if (path.node.id && isComponentClass(path.node)) {
        componentName = path.node.id.name
        description = extractJSDocComment(path.node)

        // 从泛型参数提取 props
        if (path.node.superTypeParameters) {
          const typeParams = path.node.superTypeParameters.params
          if (typeParams.length > 0) {
            props.push(...extractPropsFromTypeNode(typeParams[0]))
          }
        }
      }
    },

    // TypeScript 接口定义
    TSInterfaceDeclaration(path) {
      if (path.node.id.name.endsWith('Props')) {
        props.push(...extractPropsFromInterface(path.node))
      }
    },

    // TypeScript 类型别名
    TSTypeAliasDeclaration(path) {
      if (path.node.id.name.endsWith('Props')) {
        props.push(...extractPropsFromTypeNode(path.node.typeAnnotation))
      }
    },
  })

  return {
    name: componentName,
    description,
    props: deduplicateProps(props),
    source: {
      file: filePath,
      line: 1,
    },
  }
}

/**
 * 提取组件名称
 */
function extractComponentName(filePath: string): string {
  const basename = filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown'
  return basename.replace(/\.(tsx?|jsx?)$/, '')
}

/**
 * 判断是否为组件函数
 */
function isComponentFunction(
  node: t.FunctionDeclaration | t.ArrowFunctionExpression
): boolean {
  // 简单判断：返回 JSX 或组件名首字母大写
  if (t.isFunctionDeclaration(node) && node.id) {
    const name = node.id.name
    return /^[A-Z]/.test(name)
  }
  return false
}

/**
 * 判断是否为组件类
 */
function isComponentClass(node: t.ClassDeclaration): boolean {
  if (!node.superClass) return false

  // 检查是否继承 React.Component 或 Component
  if (t.isIdentifier(node.superClass)) {
    return node.superClass.name === 'Component' || node.superClass.name === 'PureComponent'
  }

  if (t.isMemberExpression(node.superClass)) {
    return (
      t.isIdentifier(node.superClass.object) &&
      node.superClass.object.name === 'React' &&
      t.isIdentifier(node.superClass.property) &&
      (node.superClass.property.name === 'Component' ||
        node.superClass.property.name === 'PureComponent')
    )
  }

  return false
}

/**
 * 从类型注解提取 Props
 */
function extractPropsFromTypeAnnotation(
  annotation: t.TSTypeAnnotation | t.Noop
): PropDoc[] {
  if (!t.isTSTypeAnnotation(annotation)) return []
  return extractPropsFromTypeNode(annotation.typeAnnotation)
}

/**
 * 从类型节点提取 Props
 */
function extractPropsFromTypeNode(typeNode: t.TSType): PropDoc[] {
  const props: PropDoc[] = []

  if (t.isTSTypeLiteral(typeNode)) {
    typeNode.members.forEach((member) => {
      if (t.isTSPropertySignature(member) && t.isIdentifier(member.key)) {
        props.push({
          name: member.key.name,
          type: member.typeAnnotation
            ? getTypeString(member.typeAnnotation.typeAnnotation)
            : 'any',
          required: !member.optional,
        })
      }
    })
  } else if (t.isTSTypeReference(typeNode) && t.isIdentifier(typeNode.typeName)) {
    // 处理类型引用（需要进一步解析）
  }

  return props
}

/**
 * 从接口提取 Props
 */
function extractPropsFromInterface(node: t.TSInterfaceDeclaration): PropDoc[] {
  const props: PropDoc[] = []

  node.body.body.forEach((member) => {
    if (t.isTSPropertySignature(member) && t.isIdentifier(member.key)) {
      props.push({
        name: member.key.name,
        type: member.typeAnnotation
          ? getTypeString(member.typeAnnotation.typeAnnotation)
          : 'any',
        required: !member.optional,
      })
    }
  })

  return props
}

/**
 * 获取类型字符串
 */
function getTypeString(typeNode: t.TSType): string {
  if (t.isTSStringKeyword(typeNode)) return 'string'
  if (t.isTSNumberKeyword(typeNode)) return 'number'
  if (t.isTSBooleanKeyword(typeNode)) return 'boolean'
  if (t.isTSAnyKeyword(typeNode)) return 'any'
  if (t.isTSVoidKeyword(typeNode)) return 'void'
  if (t.isTSNullKeyword(typeNode)) return 'null'
  if (t.isTSUndefinedKeyword(typeNode)) return 'undefined'

  if (t.isTSArrayType(typeNode)) {
    return `${getTypeString(typeNode.elementType)}[]`
  }

  if (t.isTSUnionType(typeNode)) {
    return typeNode.types.map(getTypeString).join(' | ')
  }

  if (t.isTSTypeReference(typeNode) && t.isIdentifier(typeNode.typeName)) {
    return typeNode.typeName.name
  }

  return 'any'
}

/**
 * 提取 JSDoc 注释
 */
function extractJSDocComment(node: any): string | undefined {
  if (node.leadingComments && node.leadingComments.length > 0) {
    const comment = node.leadingComments[node.leadingComments.length - 1]
    if (comment.type === 'CommentBlock' && comment.value.startsWith('*')) {
      // 提取描述部分
      const lines = comment.value.split('\n')
      const descLines = lines
        .map((line) => line.trim().replace(/^\*\s?/, ''))
        .filter((line) => line && !line.startsWith('@'))
      return descLines.join(' ')
    }
  }
  return undefined
}

/**
 * 去重 Props
 */
function deduplicateProps(props: PropDoc[]): PropDoc[] {
  const seen = new Set<string>()
  return props.filter((prop) => {
    if (seen.has(prop.name)) return false
    seen.add(prop.name)
    return true
  })
}

