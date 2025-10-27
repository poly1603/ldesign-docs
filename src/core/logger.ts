/**
 * 日志工具
 */

import chalk from 'chalk'
import ora, { Ora } from 'ora'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success'

class Logger {
  private spinners: Map<string, Ora> = new Map()
  private logLevel: LogLevel = 'info'

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.logLevel = level
  }

  /**
   * 调试日志
   */
  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(chalk.gray(`[DEBUG] ${message}`))
      if (data) {
        console.log(chalk.gray(JSON.stringify(data, null, 2)))
      }
    }
  }

  /**
   * 信息日志
   */
  info(message: string): void {
    if (this.shouldLog('info')) {
      console.log(chalk.blue(`ℹ ${message}`))
    }
  }

  /**
   * 警告日志
   */
  warn(message: string): void {
    if (this.shouldLog('warn')) {
      console.log(chalk.yellow(`⚠ ${message}`))
    }
  }

  /**
   * 错误日志
   */
  error(message: string, error?: Error): void {
    if (this.shouldLog('error')) {
      console.log(chalk.red(`✖ ${message}`))
      if (error) {
        console.error(chalk.red(error.stack || error.message))
      }
    }
  }

  /**
   * 成功日志
   */
  success(message: string): void {
    if (this.shouldLog('success')) {
      console.log(chalk.green(`✔ ${message}`))
    }
  }

  /**
   * 开始加载动画
   */
  startSpinner(id: string, text: string): void {
    const spinner = ora({
      text,
      color: 'cyan',
    }).start()
    this.spinners.set(id, spinner)
  }

  /**
   * 更新加载动画文本
   */
  updateSpinner(id: string, text: string): void {
    const spinner = this.spinners.get(id)
    if (spinner) {
      spinner.text = text
    }
  }

  /**
   * 成功结束加载动画
   */
  succeedSpinner(id: string, text?: string): void {
    const spinner = this.spinners.get(id)
    if (spinner) {
      spinner.succeed(text)
      this.spinners.delete(id)
    }
  }

  /**
   * 失败结束加载动画
   */
  failSpinner(id: string, text?: string): void {
    const spinner = this.spinners.get(id)
    if (spinner) {
      spinner.fail(text)
      this.spinners.delete(id)
    }
  }

  /**
   * 停止加载动画
   */
  stopSpinner(id: string): void {
    const spinner = this.spinners.get(id)
    if (spinner) {
      spinner.stop()
      this.spinners.delete(id)
    }
  }

  /**
   * 格式化时间
   */
  formatTime(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`
    }
    return `${(ms / 1000).toFixed(2)}s`
  }

  /**
   * 判断是否应该输出日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'success']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const targetLevelIndex = levels.indexOf(level)
    return targetLevelIndex >= currentLevelIndex
  }
}

// 导出单例
export const logger = new Logger()

