/**
 * server/routes/products.routes.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * Product management endpoints — identical contracts to original server.js.
 * Events broadcast ONLY after confirmed transaction (race condition fix).
 */

'use strict'

const express   = require('express')
const router    = express.Router()
const logger    = require('../services/logger.service')
const broadcast = require('../services/broadcast.service')
const repo      = require('../db/repository')

// ── GET /api/products ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { active, sku } = req.query
  let sql    = 'SELECT * FROM products'
  let params = []

  if (sku) {
    sql    = 'SELECT * FROM products WHERE sku = ? AND isActive = 1'
    params = [sku]
  } else if (active === '1') {
    sql = 'SELECT * FROM products WHERE isActive = 1'
  }

  sql += ' ORDER BY name ASC'
  const rows = repo.query(sql, params)
  res.json(rows.map(r => ({ ...r, isActive: !!r.isActive })))
})

// ── POST /api/products ────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const p = req.body
  try {
    const existing = repo.findOne('products', 'sku = ?', [p.sku])

    if (existing) {
      repo.run(
        `UPDATE products SET name=?,description=?,category=?,price=?,cost=?,stock=?,minStock=?,isActive=1,updatedAt=datetime('now') WHERE sku=?`,
        [p.name, p.description || '', p.category || 'General', p.price, p.cost || 0, p.stock, p.minStock || 5, p.sku]
      )
      const updated = repo.findOne('products', 'sku = ?', [p.sku])
      broadcast.broadcast('product_updated', { ...updated, isActive: true })
      return res.json({ ...updated, isActive: true })
    }

    const info = repo.run(
      'INSERT INTO products (sku,name,description,category,price,cost,stock,minStock,sucursalId,celulaId) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [p.sku, p.name, p.description || '', p.category || 'General', p.price, p.cost || 0, p.stock, p.minStock || 5, p.sucursalId || 'SUC001', p.celulaId || 'CEL001']
    )
    const created = repo.findOne('products', 'id = ?', [info.lastInsertRowid])
    broadcast.broadcast('product_created', { ...created, isActive: true })
    res.status(201).json({ ...created, isActive: true })
  } catch (err) {
    logger.safeError('[Products POST]', err)
    res.status(400).json({ error: err.message })
  }
})

// ── PUT /api/products/:id ─────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const p = req.body
  try {
    repo.run(
      `UPDATE products SET name=?,description=?,category=?,price=?,cost=?,stock=?,minStock=?,updatedAt=datetime('now') WHERE id=?`,
      [p.name, p.description || '', p.category || 'General', p.price, p.cost || 0, p.stock, p.minStock || 5, req.params.id]
    )
    const updated = repo.findOne('products', 'id = ?', [req.params.id])
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' })
    broadcast.broadcast('product_updated', { ...updated, isActive: !!updated.isActive })
    res.json({ ...updated, isActive: !!updated.isActive })
  } catch (err) {
    logger.safeError('[Products PUT]', err)
    res.status(400).json({ error: err.message })
  }
})

// ── PATCH /api/products/:id/stock ─────────────────────────────────────────
router.patch('/:id/stock', (req, res) => {
  const { stock, delta } = req.body
  const product = repo.findOne('products', 'id = ?', [req.params.id])
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' })

  const newStock = delta !== undefined ? Math.max(0, product.stock + delta) : stock
  repo.run(`UPDATE products SET stock=?,updatedAt=datetime('now') WHERE id=?`, [newStock, req.params.id])
  const updated = repo.findOne('products', 'id = ?', [req.params.id])
  broadcast.broadcast('product_updated', { ...updated, isActive: !!updated.isActive })
  res.json({ ...updated, isActive: !!updated.isActive })
})

// ── DELETE /api/products/:id (soft delete) ────────────────────────────────
router.delete('/:id', (req, res) => {
  repo.run(`UPDATE products SET isActive=0,updatedAt=datetime('now') WHERE id=?`, [req.params.id])
  broadcast.broadcast('product_deleted', { id: parseInt(req.params.id) })
  res.json({ ok: true })
})

// ── POST /api/products/bulk ───────────────────────────────────────────────
router.post('/bulk', (req, res) => {
  const { products } = req.body
  let added = 0, updated = 0, errors = 0

  const insert = repo.raw().prepare(
    'INSERT OR IGNORE INTO products (sku,name,description,category,price,cost,stock,minStock) VALUES (?,?,?,?,?,?,?,?)'
  )
  const update = repo.raw().prepare(
    `UPDATE products SET name=?,category=?,price=?,cost=?,stock=?,minStock=?,isActive=1,updatedAt=datetime('now') WHERE sku=?`
  )

  repo.raw().transaction(() => {
    for (const p of products) {
      try {
        const existing = repo.findOne('products', 'sku = ?', [p.sku])
        if (existing) {
          update.run(p.name, p.category || 'General', p.price, p.cost || 0, p.stock, p.minStock || 5, p.sku)
          updated++
        } else {
          insert.run(p.sku, p.name, p.description || '', p.category || 'General', p.price, p.cost || 0, p.stock, p.minStock || 5)
          added++
        }
      } catch { errors++ }
    }
  })()

  // Broadcast AFTER transaction completes
  broadcast.broadcast('products_bulk_update', { added, updated })
  res.json({ added, updated, errors })
})

module.exports = router
