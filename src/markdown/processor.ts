/**
 * Markdown 处理器
 */

import MarkdownIt from 'markdown-it'
import container from 'markdown-it-container'
import anchor from 'markdown-it-anchor'
import type { MarkdownConfig } from '../types'
import { createHighlighter } from './highlighter'
import { logger } from '../core/logger'

/**
 * 创建 Markdown 处理器
 */
export async function createMarkdownProcessor(
  config: MarkdownConfig
): Promise<MarkdownProcessor> {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  })

  // 配置代码高亮
  const highlighter = await createHighlighter(config.theme || {
    light: 'github-light',
    dark: 'github-dark',
  })

  md.options.highlight = (code, lang) => {
    return highlighter(code, lang)
  }

  // 添加行号
  if (config.lineNumbers) {
    md.use(lineNumberPlugin)
  }

  // 添加锚点
  if (config.anchor) {
    md.use(anchor, {
      permalink: anchor.permalink.headerLink(),
      slugify: (s: string) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-')),
    })
  }

  // 添加容器
  if (config.containers) {
    md.use(containerPlugin)
  }

  // 添加 Emoji
  if (config.emoji) {
    md.use(emojiPlugin)
  }

  return new MarkdownProcessor(md, config)
}

/**
 * Markdown 处理器类
 */
export class MarkdownProcessor {
  constructor(
    private md: MarkdownIt,
    private config: MarkdownConfig
  ) { }

  /**
   * 渲染 Markdown
   */
  render(content: string): string {
    try {
      return this.md.render(content)
    } catch (error) {
      logger.error('Markdown 渲染失败', error as Error)
      return `<pre>Error rendering markdown: ${(error as Error).message}</pre>`
    }
  }

  /**
   * 提取标题
   */
  extractHeaders(content: string): Array<{ level: number; text: string; slug: string }> {
    const headers: Array<{ level: number; text: string; slug: string }> = []
    const tokens = this.md.parse(content, {})

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token.type === 'heading_open') {
        const level = parseInt(token.tag.substring(1))
        const textToken = tokens[i + 1]
        if (textToken && textToken.type === 'inline') {
          const text = textToken.content
          const slug = this.slugify(text)
          headers.push({ level, text, slug })
        }
      }
    }

    return headers
  }

  /**
   * 提取摘要
   */
  extractExcerpt(content: string, length: number = 200): string {
    // 去除 Markdown 标记
    const plainText = content
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .trim()

    if (plainText.length <= length) {
      return plainText
    }

    return plainText.substring(0, length) + '...'
  }

  /**
   * Slugify 字符串
   */
  private slugify(text: string): string {
    return encodeURIComponent(
      text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-\u4e00-\u9fa5]+/g, '')
    )
  }
}

/**
 * 行号插件
 */
function lineNumberPlugin(md: MarkdownIt): void {
  const fence = md.renderer.rules.fence!
  md.renderer.rules.fence = (...args) => {
    const [tokens, idx] = args
    const token = tokens[idx]
    const rawCode = fence(...args)
    const lines = token.content.split('\n').length - 1

    const lineNumbersCode = [...Array(lines)]
      .map((_, i) => `<span class="line-number">${i + 1}</span>`)
      .join('')

    return rawCode.replace(
      '<code>',
      `<div class="line-numbers-wrapper">${lineNumbersCode}</div><code>`
    )
  }
}

/**
 * 容器插件
 */
function containerPlugin(md: MarkdownIt): void {
  const types = ['tip', 'warning', 'danger', 'details', 'info']

  types.forEach((type) => {
    md.use(container, type, {
      render(tokens: any[], idx: number) {
        const token = tokens[idx]
        const info = token.info.trim().slice(type.length).trim()

        if (token.nesting === 1) {
          const title = info || type.charAt(0).toUpperCase() + type.slice(1)
          return `<div class="custom-block ${type}"><p class="custom-block-title">${title}</p>\n`
        } else {
          return '</div>\n'
        }
      },
    })
  })
}

/**
 * Emoji 插件（简单实现）
 */
function emojiPlugin(md: MarkdownIt): void {
  const emojiMap: Record<string, string> = {
    ':smile:': '😊',
    ':heart:': '❤️',
    ':rocket:': '🚀',
    ':tada:': '🎉',
    ':star:': '⭐',
    ':fire:': '🔥',
    ':warning:': '⚠️',
    ':info:': 'ℹ️',
    ':check:': '✔️',
    ':x:': '❌',
  }

  md.core.ruler.after('inline', 'emoji', (state) => {
    for (const token of state.tokens) {
      if (token.type === 'inline' && token.content) {
        for (const [emoji, char] of Object.entries(emojiMap)) {
          token.content = token.content.replace(new RegExp(emoji, 'g'), char)
        }
      }
    }
  })
}

