/**
 * 构建命令
 */

import { loadConfig } from '../../core/config-loader'
import { PluginManager } from '../../core/plugin-manager'
import { createMarkdownProcessor } from '../../markdown/processor'
import { DocGenerator } from '../../core/doc-generator'
import { buildSite } from '../../builder/build'
import { logger } from '../../core/logger'

/**
 * 执行构建
 */
export async function build(): Promise<void> {
  try {
    logger.info('开始构建文档站点')
    const startTime = Date.now()

    // 加载配置
    const config = await loadConfig()

    // 初始化插件
    const pluginManager = new PluginManager()
    pluginManager.registerBatch(config.plugins)
    await pluginManager.configResolved(config)

    // 执行构建前钩子
    await pluginManager.beforeBuild(config)

    // 创建处理器
    const markdownProcessor = await createMarkdownProcessor(config.markdown)

    // 生成文档
    const docGenerator = new DocGenerator(
      config,
      pluginManager,
      markdownProcessor
    )
    const docs = await docGenerator.generate()

    // 构建站点
    await buildSite(config, docs)

    // 执行构建后钩子
    await pluginManager.afterBuild(config)

    const elapsed = Date.now() - startTime
    logger.success(`构建完成，总耗时 ${logger.formatTime(elapsed)}`)
  } catch (error) {
    logger.error('构建失败', error as Error)
    process.exit(1)
  }
}

