/**
 * 静态站点构建器
 */

import path from 'node:path'
import fs from 'fs-extra'
import type { ResolvedDocsConfig, DocNode } from '../types'
import { logger } from '../core/logger'
import { generateSearchIndex } from '../search/indexer'

/**
 * 构建站点
 */
export async function buildSite(
  config: ResolvedDocsConfig,
  docs: DocNode[]
): Promise<void> {
  logger.info('开始构建静态站点')
  const startTime = Date.now()

  // 清理输出目录
  await fs.emptyDir(config.outDir)

  // 生成 HTML 文件
  await generateHtmlFiles(config, docs)

  // 生成搜索索引
  const searchIndexPath = path.join(config.outDir, 'search-index.json')
  await generateSearchIndex(docs, searchIndexPath)

  // 复制静态资源
  await copyAssets(config)

  const elapsed = Date.now() - startTime
  logger.success(`构建完成，耗时 ${logger.formatTime(elapsed)}`)
  logger.info(`输出目录: ${config.outDir}`)
}

/**
 * 生成 HTML 文件
 */
async function generateHtmlFiles(
  config: ResolvedDocsConfig,
  docs: DocNode[]
): Promise<void> {
  for (const doc of docs) {
    const htmlPath = path.join(
      config.outDir,
      doc.path.replace(/\.md$/, '.html')
    )

    const html = renderPage(config, doc)

    await fs.ensureDir(path.dirname(htmlPath))
    await fs.writeFile(htmlPath, html, 'utf-8')

    logger.debug(`已生成: ${doc.path}`)
  }
}

/**
 * 渲染页面
 */
function renderPage(config: ResolvedDocsConfig, doc: DocNode): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title} - ${config.title}</title>
  <meta name="description" content="${config.description}">
  <link rel="stylesheet" href="${config.base}assets/style.css">
</head>
<body>
  <div id="app">
    <header class="header">
      <div class="container">
        <div class="logo">
          ${config.theme.logo ? `<img src="${config.theme.logo}" alt="${config.title}">` : ''}
          <span>${config.title}</span>
        </div>
        <nav class="nav">
          ${renderNav(config.nav, config.base)}
        </nav>
      </div>
    </header>

    <div class="container main">
      <aside class="sidebar">
        ${renderSidebar(config.sidebar, config.base)}
      </aside>

      <main class="content">
        <h1>${doc.title}</h1>
        ${doc.content}
      </main>

      <aside class="toc">
        <h4>目录</h4>
        <div id="toc"></div>
      </aside>
    </div>

    ${config.theme.footer ? `
    <footer class="footer">
      <div class="container">
        ${config.theme.footer.message ? `<p>${config.theme.footer.message}</p>` : ''}
        ${config.theme.footer.copyright ? `<p>${config.theme.footer.copyright}</p>` : ''}
      </div>
    </footer>
    ` : ''}
  </div>

  <script src="${config.base}assets/main.js"></script>
</body>
</html>`
}

/**
 * 渲染导航
 */
function renderNav(nav: any[], base: string): string {
  return nav
    .map((item) => {
      if (item.items) {
        return `
        <div class="nav-item dropdown">
          <span>${item.text}</span>
          <div class="dropdown-menu">
            ${renderNav(item.items, base)}
          </div>
        </div>
        `
      }
      return `<a href="${base}${item.link}" class="nav-item">${item.text}</a>`
    })
    .join('')
}

/**
 * 渲染侧边栏
 */
function renderSidebar(sidebar: any, base: string): string {
  if (Array.isArray(sidebar)) {
    return renderSidebarItems(sidebar, base)
  }

  // TODO: 处理分组侧边栏
  return ''
}

/**
 * 渲染侧边栏项
 */
function renderSidebarItems(items: any[], base: string): string {
  return `<ul class="sidebar-menu">${items
    .map((item) => {
      if (item.items) {
        return `
        <li class="sidebar-group ${item.collapsed ? 'collapsed' : ''}">
          <div class="sidebar-group-title">${item.text}</div>
          ${renderSidebarItems(item.items, base)}
        </li>
        `
      }
      return `<li><a href="${base}${item.link}">${item.text}</a></li>`
    })
    .join('')}</ul>`
}

/**
 * 复制静态资源
 */
async function copyAssets(config: ResolvedDocsConfig): Promise<void> {
  // 创建基础样式和脚本
  const assetsDir = path.join(config.outDir, 'assets')
  await fs.ensureDir(assetsDir)

  // 写入基础样式
  const css = generateBasicCSS(config)
  await fs.writeFile(path.join(assetsDir, 'style.css'), css, 'utf-8')

  // 写入基础脚本
  const js = generateBasicJS()
  await fs.writeFile(path.join(assetsDir, 'main.js'), js, 'utf-8')

  logger.debug('静态资源已复制')
}

/**
 * 生成基础 CSS
 */
function generateBasicCSS(config: ResolvedDocsConfig): string {
  const primaryColor = config.theme.primaryColor || '#1890ff'

  return `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #2c3e50;
  background: #fff;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 1px solid #eaecef;
  padding: 12px 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
}

.logo img {
  height: 32px;
}

.nav {
  display: flex;
  gap: 24px;
}

.nav-item {
  color: #2c3e50;
  text-decoration: none;
  transition: color 0.2s;
}

.nav-item:hover {
  color: ${primaryColor};
}

.main {
  display: grid;
  grid-template-columns: 260px 1fr 200px;
  gap: 48px;
  padding: 32px 0;
}

.sidebar {
  position: sticky;
  top: 80px;
  height: fit-content;
}

.sidebar-menu {
  list-style: none;
}

.sidebar-menu a {
  display: block;
  padding: 6px 12px;
  color: #2c3e50;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.2s;
}

.sidebar-menu a:hover {
  background: #f3f4f5;
  color: ${primaryColor};
}

.content {
  min-width: 0;
}

.content h1 {
  margin-bottom: 24px;
  font-size: 36px;
}

.content h2 {
  margin: 32px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eaecef;
}

.content p {
  margin: 16px 0;
}

.content code {
  padding: 2px 6px;
  background: #f3f4f5;
  border-radius: 3px;
  font-family: 'Source Code Pro', monospace;
  font-size: 0.9em;
}

.content pre {
  margin: 16px 0;
  padding: 16px;
  background: #f6f8fa;
  border-radius: 6px;
  overflow-x: auto;
}

.content table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.content th,
.content td {
  padding: 12px;
  border: 1px solid #eaecef;
  text-align: left;
}

.content th {
  background: #f6f8fa;
  font-weight: 600;
}

.toc {
  position: sticky;
  top: 80px;
  height: fit-content;
}

.footer {
  margin-top: 64px;
  padding: 32px 0;
  border-top: 1px solid #eaecef;
  text-align: center;
  color: #7f8c8d;
}

.custom-block {
  margin: 16px 0;
  padding: 16px;
  border-left: 4px solid;
  border-radius: 4px;
}

.custom-block.tip {
  border-color: ${primaryColor};
  background: rgba(24, 144, 255, 0.1);
}

.custom-block.warning {
  border-color: #faad14;
  background: rgba(250, 173, 20, 0.1);
}

.custom-block.danger {
  border-color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
}
`
}

/**
 * 生成基础 JS
 */
function generateBasicJS(): string {
  return `
// 生成目录
function generateTOC() {
  const content = document.querySelector('.content');
  const headers = content.querySelectorAll('h2, h3');
  const toc = document.getElementById('toc');
  
  if (!toc || headers.length === 0) return;
  
  const ul = document.createElement('ul');
  ul.className = 'toc-list';
  
  headers.forEach(header => {
    const li = document.createElement('li');
    li.className = 'toc-item toc-' + header.tagName.toLowerCase();
    
    const a = document.createElement('a');
    a.textContent = header.textContent;
    a.href = '#' + header.id;
    
    li.appendChild(a);
    ul.appendChild(li);
  });
  
  toc.appendChild(ul);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  generateTOC();
});
`
}

