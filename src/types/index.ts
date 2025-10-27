/**
 * 文档生成工具类型定义
 */

import type { UserConfig as ViteConfig } from 'vite'

/**
 * 文档配置
 */
export interface DocsConfig {
  /** 文档标题 */
  title?: string
  /** 文档描述 */
  description?: string
  /** 文档目录 */
  docsDir?: string
  /** 组件目录 */
  componentsDir?: string
  /** 输出目录 */
  outDir?: string
  /** 基础路径 */
  base?: string
  /** 主题配置 */
  theme?: ThemeConfig
  /** 导航配置 */
  nav?: NavItem[]
  /** 侧边栏配置 */
  sidebar?: SidebarConfig
  /** 插件 */
  plugins?: DocsPlugin[]
  /** Vite 配置 */
  vite?: ViteConfig
  /** Markdown 配置 */
  markdown?: MarkdownConfig
  /** 搜索配置 */
  search?: SearchConfig
  /** 构建配置 */
  build?: BuildConfig
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  /** 主色调 */
  primaryColor?: string
  /** Logo 路径 */
  logo?: string
  /** 仓库链接 */
  repo?: string
  /** 编辑链接 */
  editLink?: {
    pattern: string
    text?: string
  }
  /** 页脚 */
  footer?: {
    message?: string
    copyright?: string
  }
  /** 社交链接 */
  socialLinks?: SocialLink[]
}

/**
 * 导航项
 */
export interface NavItem {
  text: string
  link?: string
  items?: NavItem[]
  activeMatch?: string
}

/**
 * 侧边栏配置
 */
export type SidebarConfig = SidebarItem[] | Record<string, SidebarItem[]>

/**
 * 侧边栏项
 */
export interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
}

/**
 * 社交链接
 */
export interface SocialLink {
  icon: string
  link: string
}

/**
 * Markdown 配置
 */
export interface MarkdownConfig {
  /** 行号 */
  lineNumbers?: boolean
  /** 自定义容器 */
  containers?: boolean
  /** Emoji */
  emoji?: boolean
  /** 锚点 */
  anchor?: boolean
  /** 代码高亮主题 */
  theme?: {
    light: string
    dark: string
  }
}

/**
 * 搜索配置
 */
export interface SearchConfig {
  /** 启用搜索 */
  enabled?: boolean
  /** 搜索引擎类型 */
  provider?: 'local' | 'algolia'
  /** 本地搜索选项 */
  local?: LocalSearchOptions
  /** Algolia 搜索选项 */
  algolia?: AlgoliaSearchOptions
}

/**
 * 本地搜索选项
 */
export interface LocalSearchOptions {
  /** 最大结果数 */
  maxResults?: number
  /** 预加载 */
  preload?: boolean
}

/**
 * Algolia 搜索选项
 */
export interface AlgoliaSearchOptions {
  appId: string
  apiKey: string
  indexName: string
}

/**
 * 构建配置
 */
export interface BuildConfig {
  /** 压缩 */
  minify?: boolean
  /** 源码映射 */
  sourcemap?: boolean
  /** Chunk 大小警告限制 */
  chunkSizeWarningLimit?: number
}

/**
 * 插件接口
 */
export interface DocsPlugin {
  /** 插件名称 */
  name: string
  /** 配置钩子 */
  config?: (config: DocsConfig) => DocsConfig | void | Promise<DocsConfig | void>
  /** 配置解析后钩子 */
  configResolved?: (config: ResolvedDocsConfig) => void | Promise<void>
  /** Markdown 转换钩子 */
  transformMarkdown?: (content: string, file: string) => string | Promise<string>
  /** 页面生成前钩子 */
  beforeGenerate?: (context: GenerateContext) => void | Promise<void>
  /** 页面生成后钩子 */
  afterGenerate?: (context: GenerateContext) => void | Promise<void>
  /** 构建前钩子 */
  beforeBuild?: (config: ResolvedDocsConfig) => void | Promise<void>
  /** 构建后钩子 */
  afterBuild?: (config: ResolvedDocsConfig) => void | Promise<void>
}

/**
 * 解析后的文档配置
 */
export interface ResolvedDocsConfig extends Required<DocsConfig> {
  /** 根目录 */
  root: string
  /** 缓存目录 */
  cacheDir: string
}

/**
 * 生成上下文
 */
export interface GenerateContext {
  /** 配置 */
  config: ResolvedDocsConfig
  /** 文件列表 */
  files: string[]
  /** 生成的文档 */
  docs: DocNode[]
}

/**
 * 文档节点
 */
export interface DocNode {
  /** 文件路径 */
  path: string
  /** 标题 */
  title: string
  /** 内容 */
  content: string
  /** 类型 */
  type: 'markdown' | 'api' | 'component'
  /** 元数据 */
  meta?: DocMeta
}

/**
 * 文档元数据
 */
export interface DocMeta {
  /** 描述 */
  description?: string
  /** 标签 */
  tags?: string[]
  /** 作者 */
  author?: string
  /** 日期 */
  date?: string
  /** 是否草稿 */
  draft?: boolean
  /** 自定义数据 */
  [key: string]: any
}

/**
 * API 文档节点
 */
export interface ApiDocNode {
  /** 名称 */
  name: string
  /** 类型 */
  kind: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'enum'
  /** 描述 */
  description?: string
  /** 签名 */
  signature?: string
  /** 参数 */
  parameters?: ParameterDoc[]
  /** 返回值 */
  returns?: TypeDoc
  /** 示例 */
  examples?: string[]
  /** 标签 */
  tags?: Record<string, string | string[]>
  /** 源文件 */
  source?: SourceLocation
  /** 子节点 */
  children?: ApiDocNode[]
}

/**
 * 参数文档
 */
export interface ParameterDoc {
  /** 参数名 */
  name: string
  /** 类型 */
  type: TypeDoc
  /** 描述 */
  description?: string
  /** 是否可选 */
  optional?: boolean
  /** 默认值 */
  defaultValue?: string
}

/**
 * 类型文档
 */
export interface TypeDoc {
  /** 类型名称 */
  name: string
  /** 类型字符串 */
  type: string
  /** 是否为泛型 */
  isGeneric?: boolean
}

/**
 * 源码位置
 */
export interface SourceLocation {
  /** 文件路径 */
  file: string
  /** 行号 */
  line: number
  /** 列号 */
  column?: number
}

/**
 * 组件文档
 */
export interface ComponentDoc {
  /** 组件名称 */
  name: string
  /** 描述 */
  description?: string
  /** Props */
  props?: PropDoc[]
  /** Events */
  events?: EventDoc[]
  /** Slots */
  slots?: SlotDoc[]
  /** 示例 */
  examples?: ComponentExample[]
  /** 源文件 */
  source?: SourceLocation
}

/**
 * Prop 文档
 */
export interface PropDoc {
  /** 名称 */
  name: string
  /** 类型 */
  type: string | string[]
  /** 描述 */
  description?: string
  /** 是否必需 */
  required?: boolean
  /** 默认值 */
  default?: string
}

/**
 * Event 文档
 */
export interface EventDoc {
  /** 事件名 */
  name: string
  /** 描述 */
  description?: string
  /** 参数 */
  payload?: TypeDoc
}

/**
 * Slot 文档
 */
export interface SlotDoc {
  /** 插槽名 */
  name: string
  /** 描述 */
  description?: string
  /** 作用域数据 */
  scoped?: boolean
  /** 参数 */
  props?: PropDoc[]
}

/**
 * 组件示例
 */
export interface ComponentExample {
  /** 标题 */
  title: string
  /** 代码 */
  code: string
  /** 描述 */
  description?: string
}

/**
 * 搜索索引项
 */
export interface SearchIndexItem {
  /** ID */
  id: string
  /** 标题 */
  title: string
  /** 内容 */
  content: string
  /** 路径 */
  path: string
  /** 标题层级 */
  headers?: string[]
}

