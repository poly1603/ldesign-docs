/**
 * 预览命令
 */

import path from 'node:path'
import fs from 'fs-extra'
import sirv from 'sirv'
import compression from 'compression'
import { createServer } from 'node:http'
import { logger } from '../../core/logger'
import { loadConfig } from '../../core/config-loader'

/**
 * 执行预览
 */
export async function serve(options: { port?: number }): Promise<void> {
  try {
    const config = await loadConfig()
    const port = options.port || 3000

    // 检查构建目录是否存在
    if (!(await fs.pathExists(config.outDir))) {
      logger.error('构建目录不存在，请先运行 build 命令')
      process.exit(1)
    }

    // 创建静态文件服务器
    const serve = sirv(config.outDir, {
      dev: false,
      etag: true,
      maxAge: 31536000,
      immutable: true,
    })

    // 创建 HTTP 服务器
    const server = createServer((req, res) => {
      // 添加压缩
      compression()(req, res, () => {
        serve(req, res)
      })
    })

    server.listen(port, () => {
      logger.success(`预览服务器启动成功！`)
      logger.info(``)
      logger.info(`  本地:   http://localhost:${port}`)
      logger.info(``)
      logger.info(`按 Ctrl+C 停止服务器`)
    })

    // 处理退出信号
    process.on('SIGINT', () => {
      logger.info('\n正在关闭服务器...')
      server.close(() => {
        logger.success('服务器已关闭')
        process.exit(0)
      })
    })
  } catch (error) {
    logger.error('启动预览服务器失败', error as Error)
    process.exit(1)
  }
}

