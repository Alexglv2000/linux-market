/**
 * server/routes/users.routes.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * User management endpoints — identical contracts to original server.js.
 */

'use strict'

const express   = require('express')
const bcrypt    = require('bcryptjs')
const router    = express.Router()
const logger    = require('../services/logger.service')
const broadcast = require('../services/broadcast.service')
const repo      = require('../db/repository')

const SAFE_FIELDS = 'id,username,name,role,email,sucursalId,celulaId,isActive,createdAt'

// ── GET /api/users ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const rows = repo.query(`SELECT ${SAFE_FIELDS} FROM users ORDER BY name`)
  res.json(rows.map(r => ({ ...r, isActive: !!r.isActive })))
})

// ── POST /api/users ───────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const u = req.body
  try {
    const hash = bcrypt.hashSync(u.password, 10)
    const info = repo.run(
      'INSERT INTO users (username,password,name,role,email,sucursalId,celulaId) VALUES (?,?,?,?,?,?,?)',
      [u.username, hash, u.name, u.role || 'cajero', u.email || '', u.sucursalId || 'SUC001', u.celulaId || 'CEL001']
    )
    const created = repo.queryOne(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`, [info.lastInsertRowid])
    broadcast.broadcast('user_created', { ...created, isActive: !!created.isActive })
    res.status(201).json({ ...created, isActive: !!created.isActive })
  } catch (err) {
    logger.safeError('[Users POST]', err)
    res.status(400).json({ error: err.message })
  }
})

// ── PUT /api/users/:id ────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const u       = req.body
  const updates = []
  const params  = []

  if (u.name       !== undefined) { updates.push('name=?');     params.push(u.name) }
  if (u.role       !== undefined) { updates.push('role=?');     params.push(u.role) }
  if (u.email      !== undefined) { updates.push('email=?');    params.push(u.email) }
  if (u.isActive   !== undefined) { updates.push('isActive=?'); params.push(u.isActive ? 1 : 0) }
  if (u.password)                 { updates.push('password=?'); params.push(bcrypt.hashSync(u.password, 10)) }

  if (updates.length === 0) return res.status(400).json({ error: 'Nada que actualizar' })

  updates.push("updatedAt=datetime('now')")
  params.push(req.params.id)

  try {
    repo.run(`UPDATE users SET ${updates.join(',')} WHERE id=?`, params)
    const updated = repo.queryOne(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`, [req.params.id])
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' })
    broadcast.broadcast('user_updated', { ...updated, isActive: !!updated.isActive })
    res.json({ ...updated, isActive: !!updated.isActive })
  } catch (err) {
    logger.safeError('[Users PUT]', err)
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
