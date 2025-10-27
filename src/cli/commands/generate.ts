/**
 * 生成文档命令
 */

import { loadConfig } from '../../core/config-loader'
import { PluginManager } from '../../core/plugin-manager'
import { createMarkdownProcessor } from '../../markdown/processor'
import { DocGenerator } from '../../core/doc-generator'
import { logger } from '../../core/logger'

/**
 * 执行生成
 */
export async function generate(options: { watch?: boolean }): Promise<void> {
  try {
    logger.info('加载配置...')
    const config = await loadConfig()

    logger.info('初始化插件...')
    const pluginManager = new PluginManager()
    pluginManager.registerBatch(config.plugins)
    await pluginManager.configResolved(config)

    logger.info('创建 Markdown 处理器...')
    const markdownProcessor = await createMarkdownProcessor(config.markdown)

    logger.info('创建文档生成器...')
    const docGenerator = new DocGenerator(
      config,
      pluginManager,
      markdownProcessor
    )

    logger.startSpinner('generate', '生成文档中...')
    const docs = await docGenerator.generate()
    logger.succeedSpinner('generate', `成功生成 ${docs.length} 个文档`)

    if (options.watch) {
      logger.info('监听文件变化...')
      // TODO: 实现文件监听
      logger.warn('watch 模式尚未实现')
    }
  } catch (error) {
    logger.error('生成文档失败', error as Error)
    process.exit(1)
  }
}

