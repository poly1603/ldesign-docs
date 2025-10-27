/**
 * 配置加载器
 */

import { pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'fs-extra'
import type { DocsConfig, ResolvedDocsConfig } from '../types'
import { logger } from './logger'

/**
 * 默认配置
 */
const defaultConfig: DocsConfig = {
  title: 'Documentation',
  description: 'Documentation site',
  docsDir: 'docs',
  componentsDir: 'src/components',
  outDir: 'dist',
  base: '/',
  theme: {
    primaryColor: '#1890ff',
  },
  nav: [],
  sidebar: [],
  plugins: [],
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
  search: {
    enabled: true,
    provider: 'local',
    local: {
      maxResults: 10,
      preload: true,
    },
  },
  build: {
    minify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 500,
  },
}

/**
 * 加载配置文件
 */
export async function loadConfig(
  root: string = process.cwd(),
  configFile?: string
): Promise<ResolvedDocsConfig> {
  logger.debug('加载配置', { root, configFile })

  // 查找配置文件
  const configPath = await findConfigFile(root, configFile)

  let userConfig: DocsConfig = {}

  if (configPath) {
    logger.info(`找到配置文件: ${configPath}`)
    userConfig = await loadConfigFile(configPath)
  } else {
    logger.warn('未找到配置文件，使用默认配置')
  }

  // 合并配置
  const config = mergeConfig(defaultConfig, userConfig)

  // 解析配置
  const resolved = resolveConfig(config, root)

  logger.debug('配置加载完成', resolved)

  return resolved
}

/**
 * 查找配置文件
 */
async function findConfigFile(
  root: string,
  configFile?: string
): Promise<string | null> {
  if (configFile) {
    const fullPath = path.resolve(root, configFile)
    if (await fs.pathExists(fullPath)) {
      return fullPath
    }
    return null
  }

  // 支持的配置文件名
  const configNames = [
    'docs.config.js',
    'docs.config.mjs',
    'docs.config.ts',
    'docs.config.mts',
  ]

  for (const name of configNames) {
    const fullPath = path.resolve(root, name)
    if (await fs.pathExists(fullPath)) {
      return fullPath
    }
  }

  return null
}

/**
 * 加载配置文件
 */
async function loadConfigFile(configPath: string): Promise<DocsConfig> {
  try {
    // 使用动态导入加载配置
    const fileUrl = pathToFileURL(configPath).href
    const module = await import(fileUrl)
    const config = module.default || module

    if (typeof config === 'function') {
      return await config()
    }

    return config
  } catch (error) {
    logger.error(`加载配置文件失败: ${configPath}`, error as Error)
    throw error
  }
}

/**
 * 合并配置
 */
function mergeConfig(
  defaults: DocsConfig,
  user: DocsConfig
): DocsConfig {
  return {
    ...defaults,
    ...user,
    theme: {
      ...defaults.theme,
      ...user.theme,
    },
    markdown: {
      ...defaults.markdown,
      ...user.markdown,
    },
    search: {
      ...defaults.search,
      ...user.search,
    },
    build: {
      ...defaults.build,
      ...user.build,
    },
    plugins: [...(defaults.plugins || []), ...(user.plugins || [])],
  }
}

/**
 * 解析配置
 */
function resolveConfig(
  config: DocsConfig,
  root: string
): ResolvedDocsConfig {
  const docsDir = path.resolve(root, config.docsDir!)
  const componentsDir = path.resolve(root, config.componentsDir!)
  const outDir = path.resolve(root, config.outDir!)
  const cacheDir = path.resolve(root, 'node_modules/.docs-cache')

  return {
    ...config,
    title: config.title!,
    description: config.description!,
    docsDir,
    componentsDir,
    outDir,
    base: config.base!,
    theme: config.theme!,
    nav: config.nav!,
    sidebar: config.sidebar!,
    plugins: config.plugins!,
    vite: config.vite,
    markdown: config.markdown!,
    search: config.search!,
    build: config.build!,
    root,
    cacheDir,
  }
}

/**
 * 定义配置
 */
export function defineConfig(config: DocsConfig): DocsConfig {
  return config
}

