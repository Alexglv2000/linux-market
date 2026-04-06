/**
 * server/routes/transfers.routes.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * Transfer management + Sucursales + Accounts endpoints.
 * Identical contracts to original server.js.
 */

'use strict'

const express   = require('express')
const router    = express.Router()
const logger    = require('../services/logger.service')
const broadcast = require('../services/broadcast.service')
const repo      = require('../db/repository')

// ── GET /api/sucursales ───────────────────────────────────────────────────
router.get('/sucursales', (req, res) => {
  res.json(repo.query('SELECT * FROM sucursales WHERE isActive = 1'))
})

// ── GET /api/accounts ─────────────────────────────────────────────────────
router.get('/accounts', (req, res) => {
  res.json(repo.query('SELECT * FROM accounts WHERE isActive = 1'))
})

// ── POST /api/accounts ────────────────────────────────────────────────────
router.post('/accounts', (req, res) => {
  const a = req.body
  try {
    const info = repo.run(
      'INSERT INTO accounts (name, type, bank, identifier) VALUES (?, ?, ?, ?)',
      [a.name, a.type || 'banco', a.bank || '', a.identifier || '']
    )
    const created = repo.findOne('accounts', 'id = ?', [info.lastInsertRowid])
    broadcast.broadcast('account_created', created)
    res.status(201).json(created)
  } catch (err) {
    logger.safeError('[Accounts POST]', err)
    res.status(400).json({ error: err.message })
  }
})

// ── DELETE /api/accounts/:id ──────────────────────────────────────────────
router.delete('/accounts/:id', (req, res) => {
  repo.run('UPDATE accounts SET isActive=0 WHERE id=?', [req.params.id])
  broadcast.broadcast('account_deleted', { id: parseInt(req.params.id) })
  res.json({ ok: true })
})

// ── GET /api/transfers ────────────────────────────────────────────────────
router.get('/transfers', (req, res) => {
  const rows = repo.query('SELECT * FROM transfers ORDER BY createdAt DESC LIMIT 200')
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items || '[]') })))
})

// ── POST /api/transfers ───────────────────────────────────────────────────
router.post('/transfers', (req, res) => {
  const t = req.body
  try {
    const info = repo.run(
      'INSERT INTO transfers (transferNumber, fromSucursalId, toSucursalId, purchaseId, userId, status, items, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [t.transferNumber, t.fromSucursalId, t.toSucursalId, t.purchaseId || '', t.userId, t.status || 'pendiente', JSON.stringify(t.items || []), t.notes || '']
    )
    const created = repo.findOne('transfers', 'id = ?', [info.lastInsertRowid])
    broadcast.broadcast('transfer_created', created)
    res.status(201).json(created)
  } catch (err) {
    logger.safeError('[Transfers POST]', err)
    res.status(400).json({ error: err.message })
  }
})

// ── PATCH /api/transfers/:id/status ──────────────────────────────────────
router.patch('/transfers/:id/status', (req, res) => {
  const { status } = req.body
  const id = req.params.id

  try {
    const transfer = repo.findOne('transfers', 'id = ?', [id])
    if (!transfer) return res.status(404).json({ error: 'Transferencia no encontrada' })

    repo.raw().transaction(() => {
      repo.run(
        `UPDATE transfers SET status=?, updatedAt=datetime('now'), completedAt=datetime('now') WHERE id=?`,
        [status, id]
      )
    })()

    const updated = repo.findOne('transfers', 'id = ?', [id])
    updated.items = JSON.parse(updated.items || '[]')

    // Broadcast AFTER transaction commits
    broadcast.broadcast('transfer_updated', updated)
    res.json(updated)
  } catch (err) {
    logger.safeError('[Transfers PATCH]', err)
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
