/**
 * 文档生成器
 */

import path from 'node:path'
import fs from 'fs-extra'
import fg from 'fast-glob'
import type { ResolvedDocsConfig, DocNode, GenerateContext, ApiDocNode, ComponentDoc } from '../types'
import { logger } from './logger'
import { PluginManager } from './plugin-manager'
import { MarkdownProcessor } from '../markdown/processor'
import { parseTypeScriptFile } from '../parsers/typescript'
import { parseVueComponent } from '../parsers/vue'
import { parseReactComponent } from '../parsers/react'

/**
 * 文档生成器
 */
export class DocGenerator {
  constructor(
    private config: ResolvedDocsConfig,
    private pluginManager: PluginManager,
    private markdownProcessor: MarkdownProcessor
  ) { }

  /**
   * 生成所有文档
   */
  async generate(): Promise<DocNode[]> {
    logger.info('开始生成文档')
    const startTime = Date.now()

    const docs: DocNode[] = []

    // 生成 Markdown 文档
    const markdownDocs = await this.generateMarkdownDocs()
    docs.push(...markdownDocs)

    // 生成 API 文档
    const apiDocs = await this.generateApiDocs()
    docs.push(...apiDocs)

    // 生成组件文档
    const componentDocs = await this.generateComponentDocs()
    docs.push(...componentDocs)

    // 执行插件钩子
    const context: GenerateContext = {
      config: this.config,
      files: docs.map((d) => d.path),
      docs,
    }

    await this.pluginManager.beforeGenerate(context)
    await this.pluginManager.afterGenerate(context)

    const elapsed = Date.now() - startTime
    logger.success(`文档生成完成，共 ${docs.length} 个文件，耗时 ${logger.formatTime(elapsed)}`)

    return docs
  }

  /**
   * 生成 Markdown 文档
   */
  private async generateMarkdownDocs(): Promise<DocNode[]> {
    logger.info('生成 Markdown 文档')

    const files = await fg('**/*.md', {
      cwd: this.config.docsDir,
      absolute: true,
      ignore: ['node_modules'],
    })

    const docs: DocNode[] = []

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8')

        // 应用插件转换
        const transformed = await this.pluginManager.transformMarkdown(content, file)

        // 渲染 HTML
        const html = this.markdownProcessor.render(transformed)

        // 提取元数据
        const { title, meta } = this.extractFrontmatter(content)

        const relativePath = path.relative(this.config.docsDir, file)

        docs.push({
          path: relativePath,
          title: title || this.getTitleFromPath(relativePath),
          content: html,
          type: 'markdown',
          meta,
        })

        logger.debug(`已处理: ${relativePath}`)
      } catch (error) {
        logger.error(`处理 Markdown 文件失败: ${file}`, error as Error)
      }
    }

    return docs
  }

  /**
   * 生成 API 文档
   */
  private async generateApiDocs(): Promise<DocNode[]> {
    logger.info('生成 API 文档')

    const files = await fg('**/*.{ts,tsx}', {
      cwd: this.config.root,
      absolute: true,
      ignore: [
        'node_modules',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        this.config.docsDir,
        this.config.outDir,
      ],
    })

    const docs: DocNode[] = []

    for (const file of files) {
      try {
        const apiNodes = await parseTypeScriptFile(file)

        if (apiNodes.length === 0) continue

        const html = this.renderApiDoc(apiNodes)
        const relativePath = path.relative(this.config.root, file)
        const docPath = relativePath.replace(/\.tsx?$/, '.html')

        docs.push({
          path: `api/${docPath}`,
          title: this.getTitleFromPath(relativePath),
          content: html,
          type: 'api',
        })

        logger.debug(`已处理: ${relativePath}`)
      } catch (error) {
        logger.error(`处理 API 文件失败: ${file}`, error as Error)
      }
    }

    return docs
  }

  /**
   * 生成组件文档
   */
  private async generateComponentDocs(): Promise<DocNode[]> {
    logger.info('生成组件文档')

    const docs: DocNode[] = []

    // Vue 组件
    const vueFiles = await fg('**/*.vue', {
      cwd: this.config.componentsDir,
      absolute: true,
      ignore: ['node_modules'],
    })

    for (const file of vueFiles) {
      try {
        const componentDoc = await parseVueComponent(file)
        const html = this.renderComponentDoc(componentDoc)
        const relativePath = path.relative(this.config.componentsDir, file)
        const docPath = relativePath.replace(/\.vue$/, '.html')

        docs.push({
          path: `components/${docPath}`,
          title: componentDoc.name,
          content: html,
          type: 'component',
        })

        logger.debug(`已处理: ${relativePath}`)
      } catch (error) {
        logger.error(`处理 Vue 组件失败: ${file}`, error as Error)
      }
    }

    // React 组件
    const reactFiles = await fg('**/*.{jsx,tsx}', {
      cwd: this.config.componentsDir,
      absolute: true,
      ignore: ['node_modules', '**/*.test.*', '**/*.spec.*'],
    })

    for (const file of reactFiles) {
      try {
        const componentDoc = await parseReactComponent(file)
        const html = this.renderComponentDoc(componentDoc)
        const relativePath = path.relative(this.config.componentsDir, file)
        const docPath = relativePath.replace(/\.(jsx|tsx)$/, '.html')

        docs.push({
          path: `components/${docPath}`,
          title: componentDoc.name,
          content: html,
          type: 'component',
        })

        logger.debug(`已处理: ${relativePath}`)
      } catch (error) {
        logger.error(`处理 React 组件失败: ${file}`, error as Error)
      }
    }

    return docs
  }

  /**
   * 渲染 API 文档
   */
  private renderApiDoc(apiNodes: ApiDocNode[]): string {
    let html = '<div class="api-doc">'

    for (const node of apiNodes) {
      html += `<div class="api-item api-${node.kind}">`
      html += `<h3 id="${node.name}">${node.name}</h3>`

      if (node.description) {
        html += `<p class="description">${node.description}</p>`
      }

      if (node.signature) {
        html += `<pre><code>${this.escapeHtml(node.signature)}</code></pre>`
      }

      if (node.parameters && node.parameters.length > 0) {
        html += '<h4>参数</h4>'
        html += '<table class="params-table">'
        html += '<thead><tr><th>名称</th><th>类型</th><th>描述</th><th>默认值</th></tr></thead>'
        html += '<tbody>'

        for (const param of node.parameters) {
          html += '<tr>'
          html += `<td><code>${param.name}</code>${param.optional ? ' <em>(可选)</em>' : ''}</td>`
          html += `<td><code>${param.type.type}</code></td>`
          html += `<td>${param.description || '-'}</td>`
          html += `<td>${param.defaultValue ? `<code>${param.defaultValue}</code>` : '-'}</td>`
          html += '</tr>'
        }

        html += '</tbody></table>'
      }

      if (node.returns) {
        html += '<h4>返回值</h4>'
        html += `<p><code>${node.returns.type}</code></p>`
      }

      if (node.examples && node.examples.length > 0) {
        html += '<h4>示例</h4>'
        for (const example of node.examples) {
          html += `<pre><code>${this.escapeHtml(example)}</code></pre>`
        }
      }

      html += '</div>'
    }

    html += '</div>'
    return html
  }

  /**
   * 渲染组件文档
   */
  private renderComponentDoc(component: ComponentDoc): string {
    let html = '<div class="component-doc">'

    html += `<h2>${component.name}</h2>`

    if (component.description) {
      html += `<p class="description">${component.description}</p>`
    }

    // Props
    if (component.props && component.props.length > 0) {
      html += '<h3>Props</h3>'
      html += '<table class="props-table">'
      html += '<thead><tr><th>名称</th><th>类型</th><th>必需</th><th>默认值</th><th>描述</th></tr></thead>'
      html += '<tbody>'

      for (const prop of component.props) {
        html += '<tr>'
        html += `<td><code>${prop.name}</code></td>`
        html += `<td><code>${Array.isArray(prop.type) ? prop.type.join(' | ') : prop.type}</code></td>`
        html += `<td>${prop.required ? '✓' : '-'}</td>`
        html += `<td>${prop.default ? `<code>${prop.default}</code>` : '-'}</td>`
        html += `<td>${prop.description || '-'}</td>`
        html += '</tr>'
      }

      html += '</tbody></table>'
    }

    // Events
    if (component.events && component.events.length > 0) {
      html += '<h3>Events</h3>'
      html += '<table class="events-table">'
      html += '<thead><tr><th>事件名</th><th>参数</th><th>描述</th></tr></thead>'
      html += '<tbody>'

      for (const event of component.events) {
        html += '<tr>'
        html += `<td><code>${event.name}</code></td>`
        html += `<td>${event.payload ? `<code>${event.payload.type}</code>` : '-'}</td>`
        html += `<td>${event.description || '-'}</td>`
        html += '</tr>'
      }

      html += '</tbody></table>'
    }

    // Slots
    if (component.slots && component.slots.length > 0) {
      html += '<h3>Slots</h3>'
      html += '<table class="slots-table">'
      html += '<thead><tr><th>插槽名</th><th>作用域</th><th>描述</th></tr></thead>'
      html += '<tbody>'

      for (const slot of component.slots) {
        html += '<tr>'
        html += `<td><code>${slot.name}</code></td>`
        html += `<td>${slot.scoped ? '✓' : '-'}</td>`
        html += `<td>${slot.description || '-'}</td>`
        html += '</tr>'
      }

      html += '</tbody></table>'
    }

    html += '</div>'
    return html
  }

  /**
   * 提取 Frontmatter
   */
  private extractFrontmatter(content: string): { title: string; meta?: Record<string, any> } {
    const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/)

    if (!frontmatterMatch) {
      return { title: '' }
    }

    const frontmatter = frontmatterMatch[1]
    const meta: Record<string, any> = {}
    let title = ''

    frontmatter.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split(':')
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim()
        const trimmedKey = key.trim()

        if (trimmedKey === 'title') {
          title = value.replace(/^['"]|['"]$/g, '')
        } else {
          meta[trimmedKey] = value.replace(/^['"]|['"]$/g, '')
        }
      }
    })

    return { title, meta }
  }

  /**
   * 从路径获取标题
   */
  private getTitleFromPath(filePath: string): string {
    const basename = path.basename(filePath, path.extname(filePath))
    return basename
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * 转义 HTML
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
  }
}

