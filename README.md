# @ldesign/docs

> 📚 智能的文档生成工具，让文档维护变得轻松

## ✨ 特性

- 📚 **API 文档生成** - 从 TypeScript 代码自动生成 API 文档
- 🎨 **组件文档** - React/Vue 组件文档自动提取
- 📖 **Markdown 增强** - 支持容器、代码高亮、Emoji 等
- 🔍 **全文搜索** - 内置搜索索引生成
- 🌐 **静态站点** - 一键生成优化的静态站点
- 🔌 **插件系统** - 强大的插件扩展能力

## 📦 安装

```bash
npm install @ldesign/docs --save-dev
# 或
pnpm add -D @ldesign/docs
```

## 🚀 快速开始

### 1. 初始化项目

```bash
npx ldesign-docs init
```

这将创建基本的配置文件和示例文档。

### 2. 启动开发（生成文档）

```bash
# 生成所有文档
npx ldesign-docs generate

# 或使用简写
npx ldesign-docs gen
```

### 3. 构建静态站点

```bash
npx ldesign-docs build
```

### 4. 预览构建结果

```bash
npx ldesign-docs serve
```

## ⚙️ 配置

创建 `docs.config.js`：

```javascript
import { defineConfig } from '@ldesign/docs'

export default defineConfig({
  // 基础配置
  title: 'LDesign Documentation',
  description: 'Documentation site',
  docsDir: 'docs',
  componentsDir: 'src/components',
  outDir: 'dist',
  base: '/',
  
  // 主题配置
  theme: {
    primaryColor: '#1890ff',
    logo: '/logo.png',
    repo: 'https://github.com/your/repo',
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025',
    },
  },
  
  // 导航配置
  nav: [
    { text: '指南', link: '/guide/' },
    { text: 'API', link: '/api/' },
    { text: '组件', link: '/components/' },
  ],
  
  // 侧边栏配置
  sidebar: [
    {
      text: '开始',
      items: [
        { text: '介绍', link: '/introduction' },
        { text: '快速开始', link: '/getting-started' },
      ],
    },
  ],
  
  // Markdown 配置
  markdown: {
    lineNumbers: true,
    containers: true,
    emoji: true,
    anchor: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
  
  // 搜索配置
  search: {
    enabled: true,
    provider: 'local',
  },
})
```

## 📚 功能详解

### API 文档生成

自动从 TypeScript 源码中提取 API 文档：

```typescript
/**
 * 计算两个数的和
 * @param a - 第一个数
 * @param b - 第二个数
 * @returns 两数之和
 * @example
 * ```ts
 * add(1, 2) // 3
 * ```
 */
export function add(a: number, b: number): number {
  return a + b
}
```

工具会自动生成包含参数、返回值、示例的完整文档。

### Vue 组件文档

自动提取 Vue 组件的 Props、Events、Slots：

```vue
<script setup lang="ts">
defineProps<{
  /** 按钮文本 */
  text: string
  /** 是否禁用 */
  disabled?: boolean
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>
```

### React 组件文档

自动提取 React 组件的 Props：

```tsx
interface ButtonProps {
  /** 按钮文本 */
  text: string
  /** 是否禁用 */
  disabled?: boolean
  /** 点击事件 */
  onClick?: () => void
}

export function Button({ text, disabled, onClick }: ButtonProps) {
  return <button disabled={disabled} onClick={onClick}>{text}</button>
}
```

### Markdown 增强

支持多种 Markdown 增强语法：

#### 容器

```markdown
::: tip 提示
这是一个提示
:::

::: warning 警告
这是一个警告
:::

::: danger 危险
这是一个危险警告
:::
```

#### 代码高亮

```markdown
\`\`\`typescript {2-4}
const a = 1
const b = 2  // 高亮
const c = 3
const d = 4  // 高亮
\`\`\`
```

#### Emoji

```markdown
:smile: :heart: :rocket: :tada:
```

## 🔌 插件开发

创建自定义插件：

```typescript
import type { DocsPlugin } from '@ldesign/docs'

export function myPlugin(): DocsPlugin {
  return {
    name: 'my-plugin',
    
    async config(config) {
      // 修改配置
      return config
    },
    
    async transformMarkdown(content, file) {
      // 转换 Markdown
      return content
    },
    
    async beforeGenerate(context) {
      // 生成前钩子
    },
    
    async afterGenerate(context) {
      // 生成后钩子
    },
  }
}
```

在配置中使用：

```javascript
import { defineConfig } from '@ldesign/docs'
import { myPlugin } from './my-plugin'

export default defineConfig({
  plugins: [
    myPlugin(),
  ],
})
```

## 📖 CLI 命令

```bash
# 初始化项目
ldesign-docs init [-f, --force]

# 生成文档
ldesign-docs generate [-w, --watch]
ldesign-docs gen           # 简写

# 构建静态站点
ldesign-docs build

# 预览构建结果
ldesign-docs serve [-p, --port <port>]

# 开发服务器（开发中）
ldesign-docs dev [-p, --port <port>] [-o, --open]
```

## 🏗️ 项目结构

推荐的项目结构：

```
my-project/
├── docs/                  # 文档目录
│   ├── index.md
│   ├── guide/
│   │   ├── introduction.md
│   │   └── getting-started.md
│   └── api/
├── src/                   # 源码目录
│   ├── components/        # 组件目录
│   │   ├── Button.vue
│   │   └── Input.tsx
│   └── utils/
├── docs.config.js         # 文档配置
└── package.json
```

## 🎯 当前状态

本工具已实现以下核心功能：

✅ **已完成**：
- 完整的类型定义系统
- 配置加载和管理
- TypeScript/Vue/React 代码解析
- Markdown 处理和增强
- 文档生成核心逻辑
- 搜索索引生成
- 静态站点构建
- CLI 命令行工具
- 插件系统

🚧 **开发中**：
- Vite 开发服务器（HMR）
- 交互式 Playground
- 更丰富的默认主题

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

## 📄 许可证

MIT © LDesign Team
