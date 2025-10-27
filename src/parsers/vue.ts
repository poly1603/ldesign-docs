/**
 * Vue 组件解析器
 */

import { parse } from '@vue/compiler-sfc'
import fs from 'fs-extra'
import type { ComponentDoc, PropDoc, EventDoc, SlotDoc, SourceLocation } from '../types'
import { logger } from '../core/logger'
import { parseTypeScriptFile } from './typescript'

/**
 * 解析 Vue 组件文件
 */
export async function parseVueComponent(filePath: string): Promise<ComponentDoc> {
  logger.debug(`解析 Vue 组件: ${filePath}`)

  if (!(await fs.pathExists(filePath))) {
    throw new Error(`文件不存在: ${filePath}`)
  }

  const content = await fs.readFile(filePath, 'utf-8')
  const { descriptor, errors } = parse(content, {
    filename: filePath,
  })

  if (errors.length > 0) {
    logger.warn(`解析 Vue 组件时有警告: ${filePath}`)
    errors.forEach((err) => logger.warn(err.message))
  }

  const name = extractComponentName(filePath, descriptor)
  const description = extractDescription(descriptor)
  const props = extractProps(descriptor)
  const events = extractEvents(descriptor)
  const slots = extractSlots(descriptor)

  return {
    name,
    description,
    props,
    events,
    slots,
    source: {
      file: filePath,
      line: 1,
    },
  }
}

/**
 * 提取组件名称
 */
function extractComponentName(
  filePath: string,
  descriptor: ReturnType<typeof parse>['descriptor']
): string {
  // 尝试从 script 中提取
  if (descriptor.script || descriptor.scriptSetup) {
    const scriptContent = descriptor.script?.content || descriptor.scriptSetup?.content || ''
    const nameMatch = scriptContent.match(/name:\s*['"](.+?)['"]/）
    if (nameMatch) {
      return nameMatch[1]
    }
  }

  // 从文件名提取
  const basename = filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown'
  return basename.replace(/\.vue$/, '')
}

/**
 * 提取描述
 */
function extractDescription(
  descriptor: ReturnType<typeof parse>['descriptor']
): string | undefined {
  const scriptContent = descriptor.script?.content || descriptor.scriptSetup?.content || ''
  const commentMatch = scriptContent.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/)
  return commentMatch ? commentMatch[1] : undefined
}

/**
 * 提取 Props
 */
function extractProps(descriptor: ReturnType<typeof parse>['descriptor']): PropDoc[] {
  const props: PropDoc[] = []

  if (!descriptor.script && !descriptor.scriptSetup) {
    return props
  }

  const scriptContent = descriptor.script?.content || descriptor.scriptSetup?.content || ''

  // 解析 defineProps (Composition API)
  const definePropsMatch = scriptContent.match(/defineProps<\{([^}]+)\}>/s)
  if (definePropsMatch) {
    const propsContent = definePropsMatch[1]
    const propMatches = propsContent.matchAll(/(\w+)\??:\s*([^;\n]+)/g)

    for (const match of propMatches) {
      const [, name, type] = match
      props.push({
        name,
        type: type.trim(),
        required: !match[0].includes('?'),
      })
    }
  }

  // 解析 props 对象 (Options API)
  const propsObjectMatch = scriptContent.match(/props:\s*\{([^}]+)\}/s)
  if (propsObjectMatch) {
    const propsContent = propsObjectMatch[1]
    const propMatches = propsContent.matchAll(/(\w+):\s*\{([^}]+)\}/g)

    for (const match of propMatches) {
      const [, name, propDef] = match
      const typeMatch = propDef.match(/type:\s*(\w+)/)
      const requiredMatch = propDef.match(/required:\s*(true|false)/)
      const defaultMatch = propDef.match(/default:\s*(.+?)(?:,|$)/)

      props.push({
        name,
        type: typeMatch ? typeMatch[1] : 'any',
        required: requiredMatch ? requiredMatch[1] === 'true' : false,
        default: defaultMatch ? defaultMatch[1].trim() : undefined,
      })
    }
  }

  return props
}

/**
 * 提取 Events
 */
function extractEvents(descriptor: ReturnType<typeof parse>['descriptor']): EventDoc[] {
  const events: EventDoc[] = []

  if (!descriptor.script && !descriptor.scriptSetup) {
    return events
  }

  const scriptContent = descriptor.script?.content || descriptor.scriptSetup?.content || ''

  // 解析 defineEmits (Composition API)
  const defineEmitsMatch = scriptContent.match(/defineEmits<\{([^}]+)\}>/s)
  if (defineEmitsMatch) {
    const emitsContent = defineEmitsMatch[1]
    const eventMatches = emitsContent.matchAll(/(\w+):\s*\[([^\]]*)\]/g)

    for (const match of eventMatches) {
      const [, name, payload] = match
      events.push({
        name,
        payload: payload ? { name: payload.trim(), type: payload.trim() } : undefined,
      })
    }
  }

  // 解析 $emit 调用
  const emitMatches = scriptContent.matchAll(/\$emit\(['"](\w+)['"]/g)
  for (const match of emitMatches) {
    const [, name] = match
    if (!events.some((e) => e.name === name)) {
      events.push({ name })
    }
  }

  return events
}

/**
 * 提取 Slots
 */
function extractSlots(descriptor: ReturnType<typeof parse>['descriptor']): SlotDoc[] {
  const slots: SlotDoc[] = []

  if (!descriptor.template) {
    return slots
  }

  const templateContent = descriptor.template.content

  // 提取插槽
  const slotMatches = templateContent.matchAll(/<slot\s+(?:name=["'](\w+)["'])?([^>]*)>/g)

  for (const match of slotMatches) {
    const [, name, attrs] = match
    const slotName = name || 'default'

    // 检查是否有作用域插槽
    const scoped = attrs.includes(':') || attrs.includes('v-bind')

    if (!slots.some((s) => s.name === slotName)) {
      slots.push({
        name: slotName,
        scoped,
      })
    }
  }

  return slots
}

