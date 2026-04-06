/**
 * server/routes/system.routes.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * System-level endpoints: SSE events, health, info, debug, logs.
 * Same endpoints as server.js — no contract changes.
 */

'use strict'

const express   = require('express')
const os        = require('os')
const fs        = require('fs')
const router    = express.Router()
const config    = require('../config/env')
const logger    = require('../services/logger.service')
const broadcast = require('../services/broadcast.service')
const repo      = require('../db/repository')

// ── SSE — Real-time push ──────────────────────────────────────────────────
router.get('/events', (req, res) => {
  broadcast.registerClient(req, res)
})

// ── Health check ──────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: broadcast.clientCount(),
    db: config.DB_PATH
  })
})

// ── Network info ──────────────────────────────────────────────────────────
function getSystemNetworkInfo() {
  const nets = os.networkInterfaces()
  const results = {}
  let principalIp = 'localhost'

  const priority = ['eth', 'enp', 'wlan', 'wlp', 'en', 'wl', 'eno', 'em']

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) results[name] = []
        results[name].push(net.address)
      }
    }
  }

  const interfaces = Object.keys(results).sort((a, b) => {
    const aIdx = priority.findIndex(p => a.toLowerCase().startsWith(p))
    const bIdx = priority.findIndex(p => b.toLowerCase().startsWith(p))
    if (aIdx !== -1 && bIdx === -1) return -1
    if (aIdx === -1 && bIdx !== -1) return 1
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    return a.localeCompare(b)
  })

  if (interfaces.length > 0) principalIp = results[interfaces[0]][0]
  return { principalIp, allInterfaces: results }
}

router.get('/system/info', (req, res) => {
  const { principalIp } = getSystemNetworkInfo()
  const { getMacAddress } = require('../services/hardware.service')
  res.json({
    mac: getMacAddress(),
    platform: os.platform(),
    version: '1.2.3-STABLE',
    ip: principalIp,
    port: config.PORT
  })
})

router.get('/info', (req, res) => {
  const { principalIp, allInterfaces } = getSystemNetworkInfo()
  res.json({ ip: principalIp, port: config.PORT, all: allInterfaces })
})

// ── Bug logs ─────────────────────────────────────────────────────────────
router.post('/logs', (req, res) => {
  try {
    const { level, message, stack, context } = req.body
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level || 'error',
      message,
      stack,
      context,
      userAgent: req.headers['user-agent']
    }

    let logs = []
    if (fs.existsSync(config.BUGS_PATH)) {
      try {
        logs = JSON.parse(fs.readFileSync(config.BUGS_PATH, 'utf8') || '[]')
      } catch { logs = [] }
    }

    logs.unshift(logEntry)
    fs.writeFileSync(config.BUGS_PATH, JSON.stringify(logs.slice(0, 100), null, 2))
    logger.warn(`[BUG REPORTED] ${message}`)
    res.json({ ok: true, path: config.BUGS_PATH })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Debug endpoint (non-production only) ─────────────────────────────────
router.get('/debug/db', (req, res) => {
  try {
    const userCount = repo.queryOne('SELECT COUNT(*) as c FROM users').c
    const settings  = repo.query('SELECT * FROM system_settings')
    const { getMacAddress } = require('../services/hardware.service')
    const mac = getMacAddress()
    res.json({
      status: 'ok',
      dbPath: config.DB_PATH,
      users: userCount,
      macDetected: mac,
      settings
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

module.exports = router
