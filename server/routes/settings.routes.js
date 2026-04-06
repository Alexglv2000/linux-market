/**
 * server/routes/settings.routes.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * System settings + audit logs + stats endpoints.
 * Identical contracts to original server.js.
 */

'use strict'

const express   = require('express')
const router    = express.Router()
const logger    = require('../services/logger.service')
const broadcast = require('../services/broadcast.service')
const repo      = require('../db/repository')

// ── GET /api/settings ─────────────────────────────────────────────────────
router.get('/settings', (req, res) => {
  const rows = repo.query('SELECT * FROM system_settings')
  const obj  = {}
  rows.forEach(r => { obj[r.key] = r.value })
  res.json(obj)
})

// ── POST /api/settings ────────────────────────────────────────────────────
router.post('/settings', (req, res) => {
  const { key, value } = req.body
  try {
    repo.run('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)', [key, value])
    broadcast.broadcast('settings_updated', { key, value })
    res.json({ ok: true })
  } catch (err) {
    logger.safeError('[Settings POST]', err)
    res.status(400).json({ error: err.message })
  }
})

// ── GET /api/audit ────────────────────────────────────────────────────────
router.get('/audit', (req, res) => {
  const rows = repo.query('SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 200')
  res.json(rows)
})

// ── GET /api/stats ────────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const { userId }   = req.query
  const today        = new Date().toISOString().split('T')[0]
  const dateLimit    = today + ' 00:00:00'

  let salesToday, totalSales, totalRevenue

  if (userId) {
    salesToday   = repo.queryOne("SELECT COUNT(*) as c, COALESCE(SUM(total),0) as total FROM sales WHERE status='completada' AND userId = ? AND createdAt >= ?", [userId, dateLimit])
    totalSales   = repo.queryOne("SELECT COUNT(*) as c FROM sales WHERE status='completada' AND userId = ?", [userId]).c
    totalRevenue = repo.queryOne("SELECT COALESCE(SUM(total),0) as total FROM sales WHERE status='completada' AND userId = ?", [userId]).total
  } else {
    salesToday   = repo.queryOne("SELECT COUNT(*) as c, COALESCE(SUM(total),0) as total FROM sales WHERE status='completada' AND createdAt >= ?", [dateLimit])
    totalSales   = repo.queryOne("SELECT COUNT(*) as c FROM sales WHERE status='completada'").c
    totalRevenue = repo.queryOne("SELECT COALESCE(SUM(total),0) as total FROM sales WHERE status='completada'").total
  }

  const totalProducts = repo.queryOne('SELECT COUNT(*) as c FROM products WHERE isActive=1').c
  const totalStock    = repo.queryOne('SELECT COALESCE(SUM(stock),0) as s FROM products WHERE isActive=1').s
  const lowStock      = repo.queryOne('SELECT COUNT(*) as c FROM products WHERE isActive=1 AND stock <= minStock').c

  res.json({
    totalProducts, totalStock, lowStock,
    salesToday: salesToday.c, revenueToday: salesToday.total,
    totalSales, totalRevenue
  })
})

module.exports = router
