# @ldesign/docs

> 📚 智能的文档生成工具，让文档维护变得轻松

## ✨ 特性

- 📚 **API 文档生成** - 从代码注释自动生成 API 文档
- 🎨 **组件文档** - React/Vue 组件文档和示例生成
- 📖 **Markdown 支持** - 支持 Markdown 文档编写和预览
- 🔍 **文档搜索** - 全文搜索功能
- 🌐 **静态站点** - 一键生成文档静态站点
- 🎭 **在线演示** - 组件交互式演示
- 🔄 **热更新** - 文档修改实时预览

## 📦 安装

```bash
npm install @ldesign/docs --save-dev
```

## 🚀 快速开始

### 初始化文档项目

```bash
npx ldesign-docs init
```

### 启动文档服务

```bash
npx ldesign-docs dev
```

### 生成静态站点

```bash
npx ldesign-docs build
```

## ⚙️ 配置

创建 `docs.config.js`：

```javascript
module.exports = {
  // 文档标题
  title: 'LDesign Documentation',
  
  // 文档目录
  docsDir: 'docs',
  
  // 组件目录
  componentsDir: 'src/components',
  
  // 主题配置
  theme: {
    primaryColor: '#1890ff',
    logo: '/logo.png',
  },
  
  // 导航配置
  nav: [
    { text: '指南', link: '/guide/' },
    { text: 'API', link: '/api/' },
    { text: '组件', link: '/components/' },
  ],
  
  // 侧边栏
  sidebar: {
    '/guide/': [
      'introduction',
      'getting-started',
    ],
  },
};
```

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 📄 许可证

MIT © LDesign Team
@ldesign/docs - Documentation generation tool
