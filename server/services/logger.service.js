/**
 * server/services/logger.service.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * Structured logger. Replaces all dispersed console.log calls.
 * - Levels: info, warn, error, debug
 * - Never exposes internal stack traces to the HTTP client
 * - In production, debug level is silenced
 */

'use strict'

const config = require('../config/env')

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }
const ICONS  = { debug: '🔍', info: '✅', warn: '⚠️ ', error: '❌' }
const MIN_LEVEL = config.IS_PROD ? LEVELS.info : LEVELS.debug

function log(level, message, meta = {}) {
  if (LEVELS[level] < MIN_LEVEL) return

  const timestamp = new Date().toISOString()
  const icon = ICONS[level] || '  '
  const metaStr = Object.keys(meta).length
    ? ' ' + JSON.stringify(meta)
    : ''

  // Write to stdout with structured format
  process.stdout.write(`${icon} [${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`)
}

const logger = {
  info:  (msg, meta) => log('info',  msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),

  /**
   * Logs an error safely — never leaks internal stack in production.
   * @param {string} context — identifying label (e.g. '[Auth]')
   * @param {Error}  err
   */
  safeError(context, err) {
    const meta = config.IS_PROD
      ? { context }
      : { context, message: err.message, stack: err.stack }
    log('error', `${context} Excepción capturada`, meta)
  }
}

module.exports = logger
