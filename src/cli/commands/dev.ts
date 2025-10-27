/**
 * 开发服务器命令
 */

import { logger } from '../../core/logger'

/**
 * 启动开发服务器
 */
export async function dev(options: { port?: number; open?: boolean }): Promise<void> {
  try {
    const port = options.port || 3000

    logger.warn('开发服务器功能尚在开发中')
    logger.info('您可以使用以下命令：')
    logger.info('  1. npx ldesign-docs generate  # 生成文档')
    logger.info('  2. npx ldesign-docs build     # 构建站点')
    logger.info('  3. npx ldesign-docs serve     # 预览站点')

    // TODO: 实现基于 Vite 的开发服务器
    // const config = await loadConfig()
    // const server = await createViteServer(config)
    // await server.listen(port)
  } catch (error) {
    logger.error('启动开发服务器失败', error as Error)
    process.exit(1)
  }
}

