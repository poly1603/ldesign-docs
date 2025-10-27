/**
 * 插件管理器
 */

import type {
  DocsPlugin,
  DocsConfig,
  ResolvedDocsConfig,
  GenerateContext,
} from '../types'
import { logger } from './logger'

/**
 * 插件管理器
 */
export class PluginManager {
  private plugins: DocsPlugin[] = []

  /**
   * 注册插件
   */
  register(plugin: DocsPlugin): void {
    logger.debug(`注册插件: ${plugin.name}`)
    this.plugins.push(plugin)
  }

  /**
   * 批量注册插件
   */
  registerBatch(plugins: DocsPlugin[]): void {
    plugins.forEach((plugin) => this.register(plugin))
  }

  /**
   * 获取所有插件
   */
  getAll(): DocsPlugin[] {
    return this.plugins
  }

  /**
   * 执行配置钩子
   */
  async config(config: DocsConfig): Promise<DocsConfig> {
    let result = config

    for (const plugin of this.plugins) {
      if (plugin.config) {
        logger.debug(`执行插件配置钩子: ${plugin.name}`)
        const modified = await plugin.config(result)
        if (modified) {
          result = modified
        }
      }
    }

    return result
  }

  /**
   * 执行配置解析后钩子
   */
  async configResolved(config: ResolvedDocsConfig): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.configResolved) {
        logger.debug(`执行插件配置解析后钩子: ${plugin.name}`)
        await plugin.configResolved(config)
      }
    }
  }

  /**
   * 执行 Markdown 转换钩子
   */
  async transformMarkdown(content: string, file: string): Promise<string> {
    let result = content

    for (const plugin of this.plugins) {
      if (plugin.transformMarkdown) {
        logger.debug(`执行插件 Markdown 转换钩子: ${plugin.name}`)
        result = await plugin.transformMarkdown(result, file)
      }
    }

    return result
  }

  /**
   * 执行页面生成前钩子
   */
  async beforeGenerate(context: GenerateContext): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.beforeGenerate) {
        logger.debug(`执行插件生成前钩子: ${plugin.name}`)
        await plugin.beforeGenerate(context)
      }
    }
  }

  /**
   * 执行页面生成后钩子
   */
  async afterGenerate(context: GenerateContext): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.afterGenerate) {
        logger.debug(`执行插件生成后钩子: ${plugin.name}`)
        await plugin.afterGenerate(context)
      }
    }
  }

  /**
   * 执行构建前钩子
   */
  async beforeBuild(config: ResolvedDocsConfig): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.beforeBuild) {
        logger.debug(`执行插件构建前钩子: ${plugin.name}`)
        await plugin.beforeBuild(config)
      }
    }
  }

  /**
   * 执行构建后钩子
   */
  async afterBuild(config: ResolvedDocsConfig): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.afterBuild) {
        logger.debug(`执行插件构建后钩子: ${plugin.name}`)
        await plugin.afterBuild(config)
      }
    }
  }
}

