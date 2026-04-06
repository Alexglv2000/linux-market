/**
 * server/middlewares/error.middleware.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * Global Express error handler.
 * Every route that calls next(err) lands here.
 * - Never exposes stack traces to the client in production
 * - Logs the full error server-side
 * - Returns consistent JSON error shape
 */

'use strict'

const logger = require('../services/logger.service')
const config = require('../config/env')

/**
 * Global error handling middleware.
 * Must be registered LAST in the Express app with 4 arguments.
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const status  = err.status || err.statusCode || 500
  const message = err.message || 'Error interno del servidor'

  logger.safeError(`[${req.method} ${req.path}]`, err)

  // Never send stack traces to clients in production
  const body = {
    error: config.IS_PROD
      ? getPublicMessage(status, message)
      : message
  }

  // In development, add the stack for easier debugging
  if (!config.IS_PROD && err.stack) {
    body.stack = err.stack
  }

  res.status(status).json(body)
}

/**
 * Maps HTTP status codes to safe, public-facing messages.
 * Prevents leaking internal error details.
 */
function getPublicMessage(status, original) {
  if (status === 400) return 'Solicitud inválida'
  if (status === 401) return 'No autorizado'
  if (status === 403) return 'Acceso denegado'
  if (status === 404) return 'Recurso no encontrado'
  if (status >= 500)  return 'Error interno del servidor'
  return original
}

module.exports = { errorMiddleware }
