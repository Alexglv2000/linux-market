/**
 * server/routes/sales.routes.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * Sales endpoints — identical contracts to original server.js.
 * Critical fix: SSE events dispatched ONLY after SQLite transaction commits.
 */

'use strict'

const express   = require('express')
const router    = express.Router()
const logger    = require('../services/logger.service')
const broadcast = require('../services/broadcast.service')
const repo      = require('../db/repository')

// ── GET /api/sales ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { from, to, userId } = req.query
  let sql    = 'SELECT * FROM sales WHERE 1=1'
  const params = []

  if (from)   { sql += ' AND createdAt >= ?'; params.push(from) }
  if (to)     { sql += ' AND createdAt <= ?'; params.push(to) }
  if (userId) { sql += ' AND userId = ?';     params.push(userId) }

  sql += ' ORDER BY createdAt DESC LIMIT 500'
  const rows = repo.query(sql, params)
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items || '[]') })))
})

// ── POST /api/sales ───────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const s = req.body

  try {
    const db = repo.raw()
    const decrementStock = db.prepare(
      `UPDATE products SET stock = MAX(0, stock - ?), updatedAt=datetime('now') WHERE id = ?`
    )
    const insertSale = db.prepare(
      `INSERT INTO sales (saleNumber,userId,sucursalId,celulaId,subtotal,tax,discount,total,paymentMethod,status,items) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    )

    // Accumulate events — dispatch ONLY after the transaction commits successfully
    const pendingEvents = []

    const run = db.transaction(() => {
      insertSale.run(
        s.saleNumber, s.userId,
        s.sucursalId || 'SUC001', s.celulaId || 'CEL001',
        s.subtotal, s.tax, s.discount || 0, s.total,
        s.paymentMethod, s.status || 'completada',
        JSON.stringify(s.items || [])
      )
      for (const item of s.items || []) {
        decrementStock.run(item.quantity, item.productId)
        const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId)
        if (updated) pendingEvents.push({ ...updated, isActive: !!updated.isActive })
      }
    })

    // Transaction commits here — if it throws, pendingEvents are never dispatched
    run()

    // ✅ Safe to broadcast — DB has already confirmed the write
    for (const ev of pendingEvents) {
      broadcast.broadcast('product_updated', ev)
    }

    const created = repo.findOne('sales', 'saleNumber = ?', [s.saleNumber])
    repo.run(
      'INSERT INTO audit_logs (userId,username,action,entity,entityId,changes) VALUES (?,?,?,?,?,?)',
      [s.userId, s.username || '', 'sale_complete', 'sale', s.saleNumber, JSON.stringify({ total: s.total })]
    )
    broadcast.broadcast('sale_created', { ...created, items: s.items })
    res.status(201).json({ ...created, items: s.items })

  } catch (err) {
    logger.safeError('[Sales POST]', err)
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
