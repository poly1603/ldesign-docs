/**
 * @ldesign/docs - 智能的文档生成工具
 */

// 配置
export { defineConfig, loadConfig } from './core/config-loader'
export type { DocsConfig, ResolvedDocsConfig } from './types'

// 核心功能
export { DocGenerator } from './core/doc-generator'
export { PluginManager } from './core/plugin-manager'
export { logger } from './core/logger'

// Markdown 处理
export { createMarkdownProcessor, MarkdownProcessor } from './markdown/processor'

// 解析器
export { parseTypeScriptFile } from './parsers/typescript'
export { parseVueComponent } from './parsers/vue'
export { parseReactComponent } from './parsers/react'

// 搜索
export { generateSearchIndex } from './search/indexer'

// 构建
export { buildSite } from './builder/build'

// 类型导出
export type {
  DocsPlugin,
  DocNode,
  ApiDocNode,
  ComponentDoc,
  PropDoc,
  EventDoc,
  SlotDoc,
  GenerateContext,
  MarkdownConfig,
  SearchConfig,
  ThemeConfig,
  NavItem,
  SidebarConfig,
  SidebarItem,
} from './types'

