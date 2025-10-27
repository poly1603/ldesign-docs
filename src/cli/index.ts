#!/usr/bin/env node

/**
 * CLI 入口
 */

import { Command } from 'commander'
import { init } from './commands/init'
import { dev } from './commands/dev'
import { generate } from './commands/generate'
import { build } from './commands/build'
import { serve } from './commands/serve'

const program = new Command()

program
  .name('ldesign-docs')
  .description('智能的文档生成工具')
  .version('1.0.0')

// 初始化命令
program
  .command('init')
  .description('初始化文档项目')
  .option('-f, --force', '强制覆盖现有配置')
  .action(init)

// 开发服务器命令
program
  .command('dev')
  .description('启动开发服务器')
  .option('-p, --port <port>', '指定端口', '3000')
  .option('-o, --open', '自动打开浏览器')
  .action(dev)

// 生成文档命令
program
  .command('generate')
  .alias('gen')
  .description('生成文档')
  .option('-w, --watch', '监听文件变化')
  .action(generate)

// 构建命令
program
  .command('build')
  .description('构建静态站点')
  .action(build)

// 预览命令
program
  .command('serve')
  .description('预览构建结果')
  .option('-p, --port <port>', '指定端口', '3000')
  .action(serve)

// 解析命令行参数
program.parse()

