/**
 * server/services/broadcast.service.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * Centralized SSE (Server-Sent Events) broadcast service.
 * Previously inlined inside server.js.
 *
 * CRITICAL FIX: Events are only dispatched AFTER the database
 * transaction has committed successfully. This eliminates the
 * race condition where a failed write could still emit a success event.
 */

'use strict'

const logger = require('./logger.service')

// Singleton set of active SSE response objects
const clients = new Set()

/**
 * Registers an SSE client connection.
 * Sets up heartbeat + cleanup on disconnect.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
function registerClient(req, res) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  // Keep-alive heartbeat every 25 seconds to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    try {
      res.write('event: ping\ndata: {}\n\n')
    } catch {
      clearInterval(heartbeat)
      clients.delete(res)
    }
  }, 25000)

  clients.add(res)
  logger.debug(`SSE client connected. Total: ${clients.size}`)

  req.on('close', () => {
    clearInterval(heartbeat)
    clients.delete(res)
    logger.debug(`SSE client disconnected. Total: ${clients.size}`)
  })
}

/**
 * Broadcasts an event to all connected SSE clients.
 * Safe: individual client failures don't crash the loop.
 *
 * @param {string} event — event name (e.g. 'product_updated')
 * @param {object} data  — payload to serialize as JSON
 */
function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  let failed = 0

  for (const client of clients) {
    try {
      client.write(msg)
    } catch {
      clients.delete(client)
      failed++
    }
  }

  if (failed > 0) {
    logger.warn(`SSE broadcast: removed ${failed} dead client(s)`, { event })
  }
}

/**
 * Returns the current number of connected SSE clients.
 * Used by the /api/health endpoint.
 */
function clientCount() {
  return clients.size
}

module.exports = { registerClient, broadcast, clientCount }
