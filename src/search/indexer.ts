/**
 * 搜索索引生成器
 */

import fs from 'fs-extra'
import path from 'node:path'
import type { DocNode, SearchIndexItem } from '../types'
import { logger } from '../core/logger'

/**
 * 生成搜索索引
 */
export async function generateSearchIndex(
  docs: DocNode[],
  outputPath: string
): Promise<void> {
  logger.info('生成搜索索引')

  const items: SearchIndexItem[] = []

  for (const doc of docs) {
    // 提取纯文本内容
    const content = stripHtml(doc.content)

    // 提取标题
    const headers = extractHeaders(doc.content)

    items.push({
      id: doc.path,
      title: doc.title,
      content: content.substring(0, 500), // 限制内容长度
      path: doc.path,
      headers,
    })
  }

  // 写入索引文件
  await fs.ensureDir(path.dirname(outputPath))
  await fs.writeJSON(outputPath, items, { spaces: 2 })

  logger.success(`搜索索引已生成: ${outputPath}`)
}

/**
 * 去除 HTML 标签
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 提取标题
 */
function extractHeaders(html: string): string[] {
  const headers: string[] = []
  const headerRegex = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi
  let match

  while ((match = headerRegex.exec(html)) !== null) {
    headers.push(match[1].trim())
  }

  return headers
}

