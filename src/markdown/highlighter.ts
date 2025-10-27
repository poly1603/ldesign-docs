/**
 * 代码高亮
 */

import { getHighlighter, type Highlighter, type BundledLanguage, type BundledTheme } from 'shiki'

let highlighter: Highlighter | null = null

/**
 * 创建高亮器
 */
export async function createHighlighter(theme: {
  light: string
  dark: string
}): Promise<(code: string, lang: string) => string> {
  if (!highlighter) {
    highlighter = await getHighlighter({
      themes: [theme.light as BundledTheme, theme.dark as BundledTheme],
      langs: [
        'typescript',
        'javascript',
        'vue',
        'jsx',
        'tsx',
        'json',
        'css',
        'scss',
        'html',
        'bash',
        'sh',
        'yaml',
        'markdown',
      ] as BundledLanguage[],
    })
  }

  return (code: string, lang: string): string => {
    if (!lang || !highlighter) {
      return `<pre><code>${escapeHtml(code)}</code></pre>`
    }

    try {
      const html = highlighter.codeToHtml(code, {
        lang: lang as BundledLanguage,
        theme: theme.light as BundledTheme,
      })
      return html
    } catch (error) {
      // 如果语言不支持，返回纯文本
      return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
    }
  }
}

/**
 * 转义 HTML
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

