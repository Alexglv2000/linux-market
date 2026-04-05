/**
 * Linux-Market POS Local - Backend API
 * Express + better-sqlite3  |  Puerto 3001
 * Herramientas: Node.js (gratis), Express (gratis), SQLite (gratis)
 */

'use strict'

const express     = require('express')
const cors        = require('cors')
const path        = require('path')
const fs          = require('fs')
const crypto      = require('crypto')
const Database    = require('better-sqlite3')
const { predecir } = require('../analytics-engine/predictor')

// ── Inicializar DB ───────────────────────────────────────────────────────
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'pos.db')
const SCHEMA  = path.join(__dirname, '..', 'database', 'schema.sql')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Ejecutar schema
const schema = fs.readFileSync(SCHEMA, 'utf8')
db.exec(schema)

// Crear admin por defecto si no existe
const adminExists = db.prepare('SELECT id FROM usuarios WHERE username = ?').get('admin')
if (!adminExists) {
  const id   = crypto.randomBytes(8).toString('hex')
  const hash = crypto.createHash('sha256').update('admin123').digest('hex')
  db.prepare(`
    INSERT INTO usuarios (id, sucursal_id, username, password_hash, nombre, rol)
    VALUES (?, 'suc-principal', 'admin', ?, 'Administrador', 'admin_general')
  `).run(id, hash)
}

// ── App Express ──────────────────────────────────────────────────────────
const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: '*' }))
app.use(express.json())

// Health check
app.get('/api/health', (_, res) => res.json({ ok: true, version: '1.0.0-beta', ts: new Date().toISOString() }))

// ── AUTH ─────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Credenciales requeridas' })
    const hash = crypto.createHash('sha256').update(password).digest('hex')
    const user = db.prepare('SELECT id, username, nombre, rol, sucursal_id FROM usuarios WHERE username = ? AND password_hash = ? AND activo = 1').get(username, hash)
    if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    // Token simple: base64 del payload (MVP — en producción usar JWT)
    const token = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 8 * 3600000 })).toString('base64')
    db.prepare("INSERT INTO auditoria (usuario_id, username, accion, entidad, ip) VALUES (?,?,?,?,?)").run(user.id, user.username, 'login', 'auth', req.ip)
    res.json({ token, user })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Middleware de autenticación ──────────────────────────────────────────
function auth(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' })
    const payload = JSON.parse(Buffer.from(header.slice(7), 'base64').toString())
    if (payload.exp < Date.now()) return res.status(401).json({ error: 'Sesion expirada' })
    req.user = payload
    next()
  } catch { res.status(401).json({ error: 'Token invalido' }) }
}

// ── PRODUCTOS ────────────────────────────────────────────────────────────
app.get('/api/productos', auth, (req, res) => {
  try {
    const { q, categoria, stock_bajo } = req.query
    let sql = `SELECT p.*, c.nombre as categoria_nombre, c.color as categoria_color
               FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id
               WHERE p.activo = 1`
    const params = []
    if (q)           { sql += ' AND (p.nombre LIKE ? OR p.sku LIKE ? OR p.codigo_barras = ?)'; params.push(`%${q}%`, `%${q}%`, q) }
    if (categoria)   { sql += ' AND p.categoria_id = ?'; params.push(categoria) }
    if (stock_bajo)  { sql += ' AND p.stock <= p.stock_minimo' }
    sql += ' ORDER BY p.nombre'
    res.json(db.prepare(sql).all(...params))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/productos', auth, (req, res) => {
  try {
    const { sucursal_id, categoria_id, sku, nombre, descripcion, precio, costo, stock, stock_minimo, unidad, codigo_barras } = req.body
    if (!nombre || !sku || precio === undefined) return res.status(400).json({ error: 'nombre, sku y precio son requeridos' })
    const id = crypto.randomBytes(8).toString('hex')
    const suc = sucursal_id || req.user.sucursal_id || 'suc-principal'
    db.prepare(`INSERT INTO productos (id,sucursal_id,categoria_id,sku,nombre,descripcion,precio,costo,stock,stock_minimo,unidad,codigo_barras)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, suc, categoria_id || null, sku, nombre, descripcion || '', precio, costo || 0, stock || 0, stock_minimo || 5, unidad || 'pza', codigo_barras || null)
    res.status(201).json({ id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/productos/:id', auth, (req, res) => {
  try {
    const { nombre, precio, costo, stock, stock_minimo, descripcion, categoria_id, codigo_barras, unidad } = req.body
    db.prepare(`UPDATE productos SET nombre=?,precio=?,costo=?,stock=?,stock_minimo=?,descripcion=?,categoria_id=?,codigo_barras=?,unidad=?,actualizado_en=datetime('now') WHERE id=?`)
      .run(nombre, precio, costo, stock, stock_minimo, descripcion, categoria_id, codigo_barras, unidad, req.params.id)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/productos/:id', auth, (req, res) => {
  try {
    db.prepare("UPDATE productos SET activo=0 WHERE id=?").run(req.params.id)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── VENTAS ───────────────────────────────────────────────────────────────
app.post('/api/ventas', auth, (req, res) => {
  try {
    const { items, metodo_pago, monto_pagado, descuento_global = 0, nota } = req.body
    if (!items?.length) return res.status(400).json({ error: 'La venta debe tener al menos un producto' })

    const ventaId = crypto.randomBytes(8).toString('hex')
    const sucId   = req.user.sucursal_id || 'suc-principal'

    // Generar folio: SUC-YYYYMMDD-NNN
    const hoy    = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const ultimo = db.prepare("SELECT folio FROM ventas WHERE sucursal_id = ? AND folio LIKE ? ORDER BY folio DESC LIMIT 1").get(sucId, `${sucId.slice(0,3).toUpperCase()}-${hoy}-%`)
    const seq    = ultimo ? parseInt(ultimo.folio.split('-').pop() || '0') + 1 : 1
    const folio  = `VTA-${hoy}-${String(seq).padStart(4, '0')}`

    // Calcular totales
    let subtotal = 0
    const impPct = parseFloat(db.prepare("SELECT valor FROM configuracion WHERE clave='impuesto_pct'").get()?.valor ?? '16')

    const insertItem = db.transaction(() => {
      for (const item of items) {
        const prod = db.prepare('SELECT * FROM productos WHERE id = ? AND activo = 1').get(item.producto_id)
        if (!prod) throw new Error(`Producto ${item.producto_id} no encontrado`)
        if (prod.stock < item.cantidad) throw new Error(`Stock insuficiente para ${prod.nombre}: disponible ${prod.stock}`)
        const linea = (prod.precio * item.cantidad) - (item.descuento || 0)
        subtotal += linea
        db.prepare('INSERT INTO venta_items (venta_id,producto_id,nombre,sku,cantidad,precio_unit,descuento,subtotal) VALUES (?,?,?,?,?,?,?,?)')
          .run(ventaId, prod.id, prod.nombre, prod.sku, item.cantidad, prod.precio, item.descuento || 0, linea)
        // Descontar stock
        db.prepare('UPDATE productos SET stock = stock - ?, actualizado_en = datetime(\'now\') WHERE id = ?').run(item.cantidad, prod.id)
        db.prepare('INSERT INTO movimientos_inventario (producto_id,usuario_id,tipo,cantidad,stock_antes,stock_nuevo,referencia) VALUES (?,?,?,?,?,?,?)')
          .run(prod.id, req.user.id, 'salida', item.cantidad, prod.stock, prod.stock - item.cantidad, ventaId)
      }
    })

    insertItem()
    subtotal -= descuento_global
    const impuesto = Math.round(subtotal * (impPct / 100) * 100) / 100
    const total    = Math.round((subtotal + impuesto) * 100) / 100
    const cambio   = Math.max(0, monto_pagado - total)

    db.prepare(`INSERT INTO ventas (id,sucursal_id,cajero_id,folio,subtotal,descuento,impuesto,total,metodo_pago,monto_pagado,cambio,nota)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(ventaId, sucId, req.user.id, folio, subtotal, descuento_global, impuesto, total, metodo_pago, monto_pagado, cambio, nota || null)

    res.status(201).json({ id: ventaId, folio, total, cambio, impuesto })
  } catch (e) {
    console.error('[POS] Error en venta:', e.message)
    res.status(400).json({ error: e.message })
  }
})

app.get('/api/ventas', auth, (req, res) => {
  try {
    const { desde, hasta, limite = 50 } = req.query
    let sql = 'SELECT v.*, u.nombre as cajero_nombre FROM ventas v JOIN usuarios u ON v.cajero_id = u.id WHERE v.estado = \'completada\''
    const params = []
    if (desde) { sql += ' AND v.creado_en >= ?'; params.push(desde) }
    if (hasta) { sql += ' AND v.creado_en <= ?'; params.push(hasta) }
    sql += ' ORDER BY v.creado_en DESC LIMIT ?'
    params.push(parseInt(limite))
    res.json(db.prepare(sql).all(...params))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/ventas/:id', auth, (req, res) => {
  try {
    const venta = db.prepare('SELECT * FROM ventas WHERE id = ?').get(req.params.id)
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' })
    const items = db.prepare('SELECT * FROM venta_items WHERE venta_id = ?').all(req.params.id)
    res.json({ ...venta, items })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── ANALYTICS ────────────────────────────────────────────────────────────
app.get('/api/analytics/prediccion', auth, (req, res) => {
  try {
    const dias = parseInt(req.query.dias || '7')
    const historial = db.prepare(`
      SELECT date(creado_en) as fecha, SUM(total) as total
      FROM ventas WHERE estado = 'completada'
      GROUP BY date(creado_en)
      ORDER BY fecha ASC
      LIMIT 90
    `).all()
    const resultado = predecir(historial, dias)
    res.json(resultado)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/analytics/dashboard', auth, (req, res) => {
  try {
    const hoy   = new Date().toISOString().slice(0, 10)
    const mes   = hoy.slice(0, 7)
    const ayer  = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    const ventasHoy  = db.prepare("SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count FROM ventas WHERE date(creado_en)=? AND estado='completada'").get(hoy)
    const ventasAyer = db.prepare("SELECT COALESCE(SUM(total),0) as total FROM ventas WHERE date(creado_en)=? AND estado='completada'").get(ayer)
    const ventasMes  = db.prepare("SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count FROM ventas WHERE strftime('%Y-%m',creado_en)=? AND estado='completada'").get(mes)
    const stockBajo  = db.prepare("SELECT COUNT(*) as count FROM productos WHERE stock <= stock_minimo AND activo=1").get()
    const topProds   = db.prepare(`SELECT p.nombre, SUM(vi.cantidad) as unidades, SUM(vi.subtotal) as total FROM venta_items vi JOIN productos p ON vi.producto_id=p.id JOIN ventas v ON vi.venta_id=v.id WHERE date(v.creado_en)>=? AND v.estado='completada' GROUP BY p.id ORDER BY total DESC LIMIT 5`).all(hoy.slice(0,7) + '-01')
    const ventasDia  = db.prepare(`SELECT date(creado_en) as fecha, SUM(total) as total FROM ventas WHERE creado_en >= date('now','-30 days') AND estado='completada' GROUP BY date(creado_en) ORDER BY fecha`).all()

    const variacion  = ventasAyer.total > 0 ? ((ventasHoy.total - ventasAyer.total) / ventasAyer.total * 100).toFixed(1) : 0

    res.json({ ventasHoy, ventasAyer, ventasMes, stockBajo, topProds, ventasDia, variacion })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── CATEGORÍAS ───────────────────────────────────────────────────────────
app.get('/api/categorias', auth, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM categorias ORDER BY nombre').all()) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ── CONFIGURACIÓN ────────────────────────────────────────────────────────
app.get('/api/config', auth, (req, res) => {
  try {
    const rows = db.prepare('SELECT clave, valor FROM configuracion').all()
    const config = Object.fromEntries(rows.map(r => [r.clave, r.valor]))
    res.json(config)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/config', auth, (req, res) => {
  try {
    const updates = db.transaction(() => {
      for (const [clave, valor] of Object.entries(req.body)) {
        db.prepare('INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?,?)').run(clave, String(valor))
      }
    })
    updates()
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Servir frontend estático en producción ───────────────────────────────
const FRONTEND = path.join(__dirname, '..', 'frontend', 'out')
if (fs.existsSync(FRONTEND)) {
  app.use(express.static(FRONTEND))
  app.get('*', (_, res) => res.sendFile(path.join(FRONTEND, 'index.html')))
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[POS] Servidor corriendo en http://0.0.0.0:${PORT}`)
  console.log(`[POS] Base de datos: ${DB_PATH}`)
  console.log(`[POS] Accede desde la red LAN con la IP de esta maquina`)
})

module.exports = app
