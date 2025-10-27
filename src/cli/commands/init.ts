/**
 * 初始化命令
 */

import path from 'node:path'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import { logger } from '../../core/logger'

/**
 * 执行初始化
 */
export async function init(options: { force?: boolean }): Promise<void> {
  logger.info('初始化文档项目')

  const cwd = process.cwd()

  // 检查是否已存在配置
  const configPath = path.join(cwd, 'docs.config.js')
  if (await fs.pathExists(configPath) && !options.force) {
    logger.warn('配置文件已存在，使用 --force 强制覆盖')
    return
  }

  // 询问配置信息
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: '项目标题:',
      default: 'Documentation',
    },
    {
      type: 'input',
      name: 'description',
      message: '项目描述:',
      default: 'Documentation site',
    },
    {
      type: 'input',
      name: 'docsDir',
      message: '文档目录:',
      default: 'docs',
    },
    {
      type: 'input',
      name: 'componentsDir',
      message: '组件目录:',
      default: 'src/components',
    },
  ])

  // 生成配置文件
  const configContent = generateConfig(answers)
  await fs.writeFile(configPath, configContent, 'utf-8')

  // 创建文档目录
  const docsDir = path.join(cwd, answers.docsDir)
  await fs.ensureDir(docsDir)

  // 创建示例文件
  await createExampleFiles(docsDir)

  logger.success('初始化完成！')
  logger.info('运行以下命令开始开发:')
  logger.info('  npx ldesign-docs dev')
}

/**
 * 生成配置内容
 */
function generateConfig(answers: any): string {
  return `import { defineConfig } from '@ldesign/docs'

export default defineConfig({
  title: '${answers.title}',
  description: '${answers.description}',
  docsDir: '${answers.docsDir}',
  componentsDir: '${answers.componentsDir}',
  
  theme: {
    primaryColor: '#1890ff',
  },
  
  nav: [
    { text: '指南', link: '/guide/' },
    { text: 'API', link: '/api/' },
  ],
  
  sidebar: [
    {
      text: '开始',
      items: [
        { text: '介绍', link: '/introduction' },
        { text: '快速开始', link: '/getting-started' },
      ],
    },
  ],
})
`
}

/**
 * 创建示例文件
 */
async function createExampleFiles(docsDir: string): Promise<void> {
  // 创建 index.md
  await fs.writeFile(
    path.join(docsDir, 'index.md'),
    `---
title: 首页
---

# 欢迎使用文档生成工具

这是一个使用 @ldesign/docs 创建的文档站点。

## 特性

- 📚 **API 文档生成** - 从代码注释自动生成 API 文档
- 🎨 **组件文档** - React/Vue 组件文档和示例生成
- 📖 **Markdown 支持** - 支持 Markdown 文档编写和预览
- 🔍 **文档搜索** - 全文搜索功能

## 快速开始

\`\`\`bash
# 启动开发服务器
npx ldesign-docs dev

# 生成静态站点
npx ldesign-docs build
\`\`\`

::: tip 提示
编辑 docs/ 目录下的 Markdown 文件即可更新文档。
:::
`,
    'utf-8'
  )

  // 创建 introduction.md
  await fs.writeFile(
    path.join(docsDir, 'introduction.md'),
    `---
title: 介绍
---

# 介绍

欢迎使用文档生成工具！

## 什么是 @ldesign/docs？

@ldesign/docs 是一个智能的文档生成工具，支持：

- API 文档自动生成
- 组件文档自动提取
- Markdown 文档编写
- 静态站点生成

## 下一步

查看[快速开始](./getting-started.md)了解如何使用。
`,
    'utf-8'
  )

  // 创建 getting-started.md
  await fs.writeFile(
    path.join(docsDir, 'getting-started.md'),
    `---
title: 快速开始
---

# 快速开始

## 安装

\`\`\`bash
npm install @ldesign/docs --save-dev
\`\`\`

## 初始化

\`\`\`bash
npx ldesign-docs init
\`\`\`

## 启动开发服务器

\`\`\`bash
npx ldesign-docs dev
\`\`\`

访问 http://localhost:3000 查看文档。

## 构建静态站点

\`\`\`bash
npx ldesign-docs build
\`\`\`

构建的文件将输出到 \`dist/\` 目录。
`,
    'utf-8'
  )
}

