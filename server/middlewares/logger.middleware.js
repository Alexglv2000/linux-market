/**
 * server/middlewares/logger.middleware.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * HTTP request logger middleware.
 * Logs method, path, status, and response time for every request.
 * Replaces ad-hoc console.log calls inside individual route handlers.
 */

'use strict'

const logger = require('../services/logger.service')

function loggerMiddleware(req, res, next) {
  const start = Date.now()

  // Intercept the response finish event to log status + duration
  res.on('finish', () => {
    const ms     = Date.now() - start
    const status = res.statusCode
    const level  = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'

    logger[level](`${req.method} ${req.path}`, {
      status,
      ms,
      ip: req.ip || req.connection.remoteAddress
    })
  })

  next()
}

module.exports = { loggerMiddleware }
