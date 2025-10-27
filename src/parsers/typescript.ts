/**
 * TypeScript 解析器
 */

import ts from 'typescript'
import path from 'node:path'
import fs from 'fs-extra'
import type { ApiDocNode, ParameterDoc, TypeDoc, SourceLocation } from '../types'
import { logger } from '../core/logger'

/**
 * 解析 TypeScript 文件
 */
export async function parseTypeScriptFile(filePath: string): Promise<ApiDocNode[]> {
  logger.debug(`解析 TypeScript 文件: ${filePath}`)

  if (!(await fs.pathExists(filePath))) {
    throw new Error(`文件不存在: ${filePath}`)
  }

  const content = await fs.readFile(filePath, 'utf-8')
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  )

  const nodes: ApiDocNode[] = []

  function visit(node: ts.Node) {
    // 解析函数
    if (ts.isFunctionDeclaration(node) && node.name) {
      nodes.push(parseFunctionDeclaration(node, sourceFile))
    }
    // 解析类
    else if (ts.isClassDeclaration(node) && node.name) {
      nodes.push(parseClassDeclaration(node, sourceFile))
    }
    // 解析接口
    else if (ts.isInterfaceDeclaration(node)) {
      nodes.push(parseInterfaceDeclaration(node, sourceFile))
    }
    // 解析类型别名
    else if (ts.isTypeAliasDeclaration(node)) {
      nodes.push(parseTypeAliasDeclaration(node, sourceFile))
    }
    // 解析变量
    else if (ts.isVariableStatement(node)) {
      const declarations = parseVariableStatement(node, sourceFile)
      nodes.push(...declarations)
    }
    // 解析枚举
    else if (ts.isEnumDeclaration(node)) {
      nodes.push(parseEnumDeclaration(node, sourceFile))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return nodes.filter((node) => isExported(node))
}

/**
 * 解析函数声明
 */
function parseFunctionDeclaration(
  node: ts.FunctionDeclaration,
  sourceFile: ts.SourceFile
): ApiDocNode {
  const name = node.name!.text
  const jsDocComment = getJSDocComment(node)
  const parameters = node.parameters.map((p) => parseParameter(p, sourceFile))
  const returnType = node.type ? parseType(node.type) : { name: 'void', type: 'void' }

  return {
    name,
    kind: 'function',
    description: jsDocComment?.description,
    signature: node.getText(sourceFile),
    parameters,
    returns: returnType,
    examples: jsDocComment?.examples,
    tags: jsDocComment?.tags,
    source: getSourceLocation(node, sourceFile),
  }
}

/**
 * 解析类声明
 */
function parseClassDeclaration(
  node: ts.ClassDeclaration,
  sourceFile: ts.SourceFile
): ApiDocNode {
  const name = node.name!.text
  const jsDocComment = getJSDocComment(node)
  const children: ApiDocNode[] = []

  node.members.forEach((member) => {
    if (ts.isMethodDeclaration(member) && member.name) {
      const methodName = member.name.getText(sourceFile)
      const methodDoc = parseFunctionDeclaration(member as any, sourceFile)
      children.push({ ...methodDoc, name: methodName })
    } else if (ts.isPropertyDeclaration(member) && member.name) {
      const propName = member.name.getText(sourceFile)
      const propType = member.type ? parseType(member.type) : { name: 'any', type: 'any' }
      const propDoc = getJSDocComment(member)
      children.push({
        name: propName,
        kind: 'variable',
        description: propDoc?.description,
        returns: propType,
        source: getSourceLocation(member, sourceFile),
      })
    }
  })

  return {
    name,
    kind: 'class',
    description: jsDocComment?.description,
    signature: `class ${name}`,
    examples: jsDocComment?.examples,
    tags: jsDocComment?.tags,
    source: getSourceLocation(node, sourceFile),
    children,
  }
}

/**
 * 解析接口声明
 */
function parseInterfaceDeclaration(
  node: ts.InterfaceDeclaration,
  sourceFile: ts.SourceFile
): ApiDocNode {
  const name = node.name.text
  const jsDocComment = getJSDocComment(node)
  const children: ApiDocNode[] = []

  node.members.forEach((member) => {
    if (ts.isPropertySignature(member) && member.name) {
      const propName = member.name.getText(sourceFile)
      const propType = member.type ? parseType(member.type) : { name: 'any', type: 'any' }
      const propDoc = getJSDocComment(member)
      children.push({
        name: propName,
        kind: 'variable',
        description: propDoc?.description,
        returns: propType,
        source: getSourceLocation(member, sourceFile),
      })
    }
  })

  return {
    name,
    kind: 'interface',
    description: jsDocComment?.description,
    signature: `interface ${name}`,
    examples: jsDocComment?.examples,
    tags: jsDocComment?.tags,
    source: getSourceLocation(node, sourceFile),
    children,
  }
}

/**
 * 解析类型别名
 */
function parseTypeAliasDeclaration(
  node: ts.TypeAliasDeclaration,
  sourceFile: ts.SourceFile
): ApiDocNode {
  const name = node.name.text
  const jsDocComment = getJSDocComment(node)
  const type = parseType(node.type)

  return {
    name,
    kind: 'type',
    description: jsDocComment?.description,
    signature: node.getText(sourceFile),
    returns: type,
    examples: jsDocComment?.examples,
    tags: jsDocComment?.tags,
    source: getSourceLocation(node, sourceFile),
  }
}

/**
 * 解析变量声明
 */
function parseVariableStatement(
  node: ts.VariableStatement,
  sourceFile: ts.SourceFile
): ApiDocNode[] {
  const nodes: ApiDocNode[] = []

  node.declarationList.declarations.forEach((declaration) => {
    if (ts.isIdentifier(declaration.name)) {
      const name = declaration.name.text
      const jsDocComment = getJSDocComment(node)
      const type = declaration.type
        ? parseType(declaration.type)
        : { name: 'any', type: 'any' }

      nodes.push({
        name,
        kind: 'variable',
        description: jsDocComment?.description,
        signature: declaration.getText(sourceFile),
        returns: type,
        examples: jsDocComment?.examples,
        tags: jsDocComment?.tags,
        source: getSourceLocation(declaration, sourceFile),
      })
    }
  })

  return nodes
}

/**
 * 解析枚举声明
 */
function parseEnumDeclaration(
  node: ts.EnumDeclaration,
  sourceFile: ts.SourceFile
): ApiDocNode {
  const name = node.name.text
  const jsDocComment = getJSDocComment(node)

  return {
    name,
    kind: 'enum',
    description: jsDocComment?.description,
    signature: `enum ${name}`,
    examples: jsDocComment?.examples,
    tags: jsDocComment?.tags,
    source: getSourceLocation(node, sourceFile),
  }
}

/**
 * 解析参数
 */
function parseParameter(
  param: ts.ParameterDeclaration,
  sourceFile: ts.SourceFile
): ParameterDoc {
  const name = param.name.getText(sourceFile)
  const type = param.type ? parseType(param.type) : { name: 'any', type: 'any' }
  const optional = !!param.questionToken
  const defaultValue = param.initializer?.getText(sourceFile)

  return {
    name,
    type,
    optional,
    defaultValue,
  }
}

/**
 * 解析类型
 */
function parseType(type: ts.TypeNode): TypeDoc {
  const typeName = type.getText()
  return {
    name: typeName,
    type: typeName,
    isGeneric: typeName.includes('<'),
  }
}

/**
 * 获取 JSDoc 注释
 */
function getJSDocComment(node: ts.Node): {
  description?: string
  examples?: string[]
  tags?: Record<string, string | string[]>
} | undefined {
  const jsDocTags = ts.getJSDocTags(node)
  const jsDocComments = (node as any).jsDoc as ts.JSDoc[] | undefined

  if (!jsDocComments || jsDocComments.length === 0) {
    return undefined
  }

  const comment = jsDocComments[0]
  const description = comment.comment
    ? typeof comment.comment === 'string'
      ? comment.comment
      : comment.comment.map((c: any) => c.text).join('')
    : undefined

  const examples: string[] = []
  const tags: Record<string, string | string[]> = {}

  jsDocTags.forEach((tag) => {
    const tagName = tag.tagName.text
    const tagText = tag.comment
      ? typeof tag.comment === 'string'
        ? tag.comment
        : tag.comment.map((c: any) => c.text).join('')
      : ''

    if (tagName === 'example') {
      examples.push(tagText)
    } else {
      if (tags[tagName]) {
        if (Array.isArray(tags[tagName])) {
          ; (tags[tagName] as string[]).push(tagText)
        } else {
          tags[tagName] = [tags[tagName] as string, tagText]
        }
      } else {
        tags[tagName] = tagText
      }
    }
  })

  return { description, examples, tags }
}

/**
 * 获取源码位置
 */
function getSourceLocation(node: ts.Node, sourceFile: ts.SourceFile): SourceLocation {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
  return {
    file: sourceFile.fileName,
    line: line + 1,
    column: character + 1,
  }
}

/**
 * 判断是否导出
 */
function isExported(node: ApiDocNode): boolean {
  // 简化处理，假设所有都导出
  return true
}

