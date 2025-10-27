# 使用指南

本文档详细说明如何使用 `@ldesign/docs` 文档生成工具。

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [配置详解](#配置详解)
- [Markdown 语法](#markdown-语法)
- [API 文档](#api-文档)
- [组件文档](#组件文档)
- [插件系统](#插件系统)
- [部署](#部署)

## 安装

### npm

```bash
npm install @ldesign/docs --save-dev
```

### pnpm

```bash
pnpm add -D @ldesign/docs
```

### yarn

```bash
yarn add -D @ldesign/docs
```

## 快速开始

### 1. 初始化项目

在你的项目根目录运行：

```bash
npx ldesign-docs init
```

这会：
- 创建 `docs.config.js` 配置文件
- 创建 `docs/` 文档目录
- 生成几个示例 Markdown 文件

### 2. 编写文档

在 `docs/` 目录下创建或编辑 Markdown 文件：

```markdown
---
title: 我的第一篇文档
description: 这是一篇示例文档
---

# 我的第一篇文档

这是文档内容。

## 章节标题

这是章节内容。

\`\`\`typescript
// 代码示例
console.log('Hello, World!')
\`\`\`
```

### 3. 生成文档

```bash
npx ldesign-docs generate
```

或使用简写：

```bash
npx ldesign-docs gen
```

### 4. 构建站点

```bash
npx ldesign-docs build
```

构建的文件会输出到 `dist/` 目录（可在配置中修改）。

### 5. 预览

```bash
npx ldesign-docs serve
```

默认访问 `http://localhost:3000`。

可以指定端口：

```bash
npx ldesign-docs serve --port 8080
```

## 配置详解

### 基础配置

```javascript
import { defineConfig } from '@ldesign/docs'

export default defineConfig({
  // 站点标题
  title: 'My Documentation',
  
  // 站点描述
  description: 'My awesome documentation site',
  
  // 文档源目录
  docsDir: 'docs',
  
  // 组件源目录
  componentsDir: 'src/components',
  
  // 输出目录
  outDir: 'dist',
  
  // 基础路径（部署到子路径时使用）
  base: '/',
})
```

### 主题配置

```javascript
theme: {
  // 主色调
  primaryColor: '#1890ff',
  
  // Logo 路径
  logo: '/logo.png',
  
  // 仓库链接
  repo: 'https://github.com/your/repo',
  
  // 编辑链接
  editLink: {
    pattern: 'https://github.com/your/repo/edit/main/docs/:path',
    text: '在 GitHub 上编辑此页',
  },
  
  // 页脚
  footer: {
    message: 'Released under the MIT License.',
    copyright: 'Copyright © 2025 Your Name',
  },
  
  // 社交链接
  socialLinks: [
    { icon: 'github', link: 'https://github.com/your/repo' },
    { icon: 'twitter', link: 'https://twitter.com/your' },
  ],
}
```

### 导航配置

```javascript
nav: [
  // 简单链接
  { text: '首页', link: '/' },
  
  // 下拉菜单
  {
    text: '指南',
    items: [
      { text: '介绍', link: '/guide/introduction' },
      { text: '快速开始', link: '/guide/getting-started' },
    ],
  },
  
  // 外部链接
  { text: 'GitHub', link: 'https://github.com/your/repo' },
]
```

### 侧边栏配置

```javascript
sidebar: [
  {
    text: '开始',
    items: [
      { text: '介绍', link: '/introduction' },
      { text: '快速开始', link: '/getting-started' },
    ],
  },
  {
    text: '指南',
    // 默认折叠
    collapsed: true,
    items: [
      { text: '配置', link: '/guide/config' },
      { text: '部署', link: '/guide/deployment' },
    ],
  },
]
```

### Markdown 配置

```javascript
markdown: {
  // 显示行号
  lineNumbers: true,
  
  // 启用容器（tip、warning、danger 等）
  containers: true,
  
  // 启用 Emoji
  emoji: true,
  
  // 启用标题锚点
  anchor: true,
  
  // 代码高亮主题
  theme: {
    light: 'github-light',
    dark: 'github-dark',
  },
}
```

### 搜索配置

```javascript
search: {
  // 启用搜索
  enabled: true,
  
  // 搜索提供者
  provider: 'local',
  
  // 本地搜索选项
  local: {
    maxResults: 10,
    preload: true,
  },
}
```

## Markdown 语法

### Frontmatter

```markdown
---
title: 页面标题
description: 页面描述
author: 作者名
date: 2025-01-01
tags:
  - tag1
  - tag2
draft: false
---
```

### 容器

```markdown
::: tip 提示
这是一个提示框
:::

::: warning 警告
这是一个警告框
:::

::: danger 危险
这是一个危险警告框
:::

::: info 信息
这是一个信息框
:::

::: details 点击展开
这是一个可折叠的详情块
:::
```

### 代码块高亮

```markdown
\`\`\`typescript {2-4}
const a = 1
const b = 2  // 这一行会高亮
const c = 3  // 这一行会高亮
const d = 4  // 这一行会高亮
const e = 5
\`\`\`
```

### Emoji

```markdown
:smile: :heart: :rocket: :tada: :star: :fire:
```

## API 文档

工具会自动从 TypeScript 文件中提取 API 文档。

### JSDoc 注释

```typescript
/**
 * 计算两个数的和
 * 
 * @param a - 第一个数
 * @param b - 第二个数
 * @returns 两数之和
 * 
 * @example
 * ```ts
 * const result = add(1, 2)
 * console.log(result) // 3
 * ```
 * 
 * @see https://example.com/docs
 * @since 1.0.0
 */
export function add(a: number, b: number): number {
  return a + b
}
```

### 类文档

```typescript
/**
 * 用户类
 */
export class User {
  /**
   * 用户名
   */
  name: string

  /**
   * 年龄
   */
  age: number

  /**
   * 构造函数
   * @param name - 用户名
   * @param age - 年龄
   */
  constructor(name: string, age: number) {
    this.name = name
    this.age = age
  }

  /**
   * 获取用户信息
   * @returns 用户信息字符串
   */
  getInfo(): string {
    return `${this.name}, ${this.age} years old`
  }
}
```

## 组件文档

### Vue 组件

```vue
<template>
  <button :disabled="disabled" @click="handleClick">
    {{ text }}
  </button>
</template>

<script setup lang="ts">
/**
 * 按钮组件
 */
defineProps<{
  /** 按钮文本 */
  text: string
  /** 是否禁用 */
  disabled?: boolean
}>()

const emit = defineEmits<{
  /** 点击事件 */
  click: [event: MouseEvent]
}>()

function handleClick(e: MouseEvent) {
  emit('click', e)
}
</script>
```

### React 组件

```tsx
/**
 * 按钮组件 Props
 */
interface ButtonProps {
  /** 按钮文本 */
  text: string
  /** 是否禁用 */
  disabled?: boolean
  /** 点击事件 */
  onClick?: (e: React.MouseEvent) => void
}

/**
 * 按钮组件
 */
export function Button({ text, disabled, onClick }: ButtonProps) {
  return (
    <button disabled={disabled} onClick={onClick}>
      {text}
    </button>
  )
}
```

## 插件系统

### 创建插件

```typescript
import type { DocsPlugin } from '@ldesign/docs'

export function myPlugin(): DocsPlugin {
  return {
    name: 'my-plugin',
    
    // 修改配置
    async config(config) {
      console.log('Plugin config hook')
      return config
    },
    
    // 配置解析完成
    async configResolved(config) {
      console.log('Config resolved:', config.title)
    },
    
    // 转换 Markdown
    async transformMarkdown(content, file) {
      console.log('Transform:', file)
      return content.replace(/TODO/g, '✅ TODO')
    },
    
    // 生成前
    async beforeGenerate(context) {
      console.log(`Generating ${context.files.length} files`)
    },
    
    // 生成后
    async afterGenerate(context) {
      console.log(`Generated ${context.docs.length} docs`)
    },
    
    // 构建前
    async beforeBuild(config) {
      console.log('Building...')
    },
    
    // 构建后
    async afterBuild(config) {
      console.log('Build complete!')
    },
  }
}
```

### 使用插件

```javascript
import { defineConfig } from '@ldesign/docs'
import { myPlugin } from './my-plugin'

export default defineConfig({
  plugins: [
    myPlugin(),
  ],
})
```

## 部署

### 构建

```bash
npx ldesign-docs build
```

### 部署到 GitHub Pages

1. 在 `docs.config.js` 中设置 base：

```javascript
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

2. 创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run docs:build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 部署到 Vercel

1. 安装 Vercel CLI：

```bash
npm i -g vercel
```

2. 部署：

```bash
vercel --prod
```

### 部署到 Netlify

1. 安装 Netlify CLI：

```bash
npm i -g netlify-cli
```

2. 部署：

```bash
netlify deploy --prod
```

## 常见问题

### Q: 如何自定义样式？

A: 你可以创建自定义 CSS 文件并在配置中引入：

```javascript
export default defineConfig({
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      }
    }
  }
})
```

### Q: 如何添加自定义页面？

A: 直接在 `docs/` 目录下创建 Markdown 文件即可。

### Q: 如何忽略某些文件？

A: 修改配置文件中的 glob 模式，或使用 `.docsignore` 文件。

## 更多帮助

- [GitHub Issues](https://github.com/ldesign/ldesign/issues)
- [讨论区](https://github.com/ldesign/ldesign/discussions)

