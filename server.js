/**
 * Linux-Market — Servidor Express + SQLite compartido
 * Corre en puerto 3001. El frontend Next.js en puerto 3000.
 * Todos los clientes (cajeros, almacenistas) comparten esta BD.
 */

const express = require('express')
const Database = require('better-sqlite3')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcryptjs')
const os = require('os')

const app = express()
const PORT = process.env.LM_API_PORT || 3001

// Definir ruta de base de datos en Carpeta de Usuario para persistencia en empaquetado
const HOME_DIR = os.homedir()
const LM_DIR = path.join(HOME_DIR, '.linux-market')
if (!fs.existsSync(LM_DIR)) {
  fs.mkdirSync(LM_DIR, { recursive: true })
}

const DEFAULT_DB_PATH = path.join(LM_DIR, 'linuxmarket.db')
const DB_PATH = process.env.LM_DB_PATH || DEFAULT_DB_PATH

// Carpeta de BUGS para auditoría de errores
const BUGS_DIR = path.join(LM_DIR, 'bugs')
if (!fs.existsSync(BUGS_DIR)) {
  fs.mkdirSync(BUGS_DIR, { recursive: true })
}
const BUGS_PATH = path.join(BUGS_DIR, 'crash-logs.json')

app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '10mb' }))

// ── Base de datos (Resistencia 3x) ─────────────────────────────
let db;
let retryCount = 0;
const MAX_RETRIES = 3;

function connectDB() {
  try {
    console.log(`📡 Intentando conectar a la base de datos: ${DB_PATH} (Intento ${retryCount + 1}/${MAX_RETRIES})`);
    db = new Database(DB_PATH, { timeout: 5000 });
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    console.log('✅ Base de datos conectada. Inicializando tablas...');
    
    // Crear tablas solo una vez conectado exitosamente
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'cajero',
        email TEXT,
        sucursalId TEXT DEFAULT 'SUC001',
        celulaId TEXT DEFAULT 'CEL001',
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'General',
        price REAL NOT NULL DEFAULT 0,
        cost REAL NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        minStock INTEGER NOT NULL DEFAULT 5,
        sucursalId TEXT DEFAULT 'SUC001',
        celulaId TEXT DEFAULT 'CEL001',
        imageUrl TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        saleNumber TEXT UNIQUE NOT NULL,
        userId INTEGER NOT NULL,
        sucursalId TEXT DEFAULT 'SUC001',
        celulaId TEXT DEFAULT 'CEL001',
        subtotal REAL NOT NULL DEFAULT 0,
        tax REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        paymentMethod TEXT NOT NULL DEFAULT 'efectivo',
        status TEXT NOT NULL DEFAULT 'completada',
        items TEXT NOT NULL DEFAULT '[]',
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        syncedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        username TEXT NOT NULL,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entityId TEXT NOT NULL,
        changes TEXT DEFAULT '{}',
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sucursales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        address TEXT DEFAULT '',
        celulaId TEXT DEFAULT 'CEL001',
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS celulas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'efectivo',
        bank TEXT,
        identifier TEXT NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transferNumber TEXT UNIQUE NOT NULL,
        fromSucursalId TEXT NOT NULL,
        toSucursalId TEXT NOT NULL,
        purchaseId TEXT,
        userId INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendiente',
        items TEXT NOT NULL DEFAULT '[]',
        notes TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
        completedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      -- Insert default hardware lock setting (auto locks on first run)
      INSERT OR IGNORE INTO system_settings (key, value) VALUES ('allowed_mac', 'auto');
    `)
    console.log('✅ Estructura de base de datos validada.');

    // 🚀 INICIAR EL RESTO DE LA APLICACIÓN AQUÍ
    initApp();
    
  } catch (err) {
    console.error('❌ Error fatal al abrir base de datos:', err.message);
    if (retryCount < MAX_RETRIES - 1) {
      retryCount++;
      console.log('⏳ Reintentando en 1 segundo...');
      setTimeout(connectDB, 1000);
      return;
    }
    console.error('🚨 La base de datos no pudo iniciar tras múltiples intentos.');
    process.exit(1);
  }
}

function initApp() {
  const SERVER_MAC = getMacAddress();

  // ── Verificación de Hardware (Hardware Lock) ──────────────────
  let allowedMac = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('allowed_mac')?.value;

  // Solo inicializamos si la MAC detectada es real. Si es UNKNOWN-MAC, esperamos a que haya red.
  if (allowedMac === 'auto' && SERVER_MAC !== 'UNKNOWN-MAC') {
    db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run(SERVER_MAC, 'allowed_mac');
    allowedMac = SERVER_MAC;
    console.log(`🔒 Hardware Lock inicializado en: ${allowedMac}`);
  } else if (allowedMac === 'auto') {
    console.log('⏳ Hardware Lock en espera (No se detectó MAC válida aún).');
  }

  // NO BLOQUEAR si la MAC detectada es UNKNOWN-MAC (evita bloqueos accidentales sin internet)
  // ADEMÁS: Permitir bypass si existe un archivo secreto de recuperación
  const BYPASS_FILE = path.join(HOME_DIR, '.linux-market-bypass');
  const HAS_BYPASS = fs.existsSync(BYPASS_FILE);

  const isHardwareLocked = allowedMac && 
                         allowedMac !== 'auto' && 
                         allowedMac !== 'ANY' && 
                         SERVER_MAC !== 'UNKNOWN-MAC' && 
                         allowedMac !== SERVER_MAC &&
                         !HAS_BYPASS;

  if (HAS_BYPASS) {
    console.log('🔓 [RECOVERY] Hardware Lock omitido por archivo de bypass presente.');
  }

  if (isHardwareLocked) {
    console.error(`❌ ERROR DE LICENCIA: Este servidor está bloqueado para la MAC ${allowedMac}.`);
    console.error(`💻 Hardware actual detectado: ${SERVER_MAC}`);
  } else if (allowedMac && allowedMac !== 'ANY' && allowedMac !== 'auto') {
    console.log(`✅ Validación de hardware exitosa (Locked to: ${allowedMac})`);
  }

  // ── Network Info Logic (Centralized) ─────────────────────────
  function getSystemNetworkInfo() {
    const nets = os.networkInterfaces()
    const results = {}
    let principalIp = 'localhost'
    
    // Categorías de nombres de interfaces para priorización (Ethernet > WiFi > Otros)
    const priority = ['eth', 'enp', 'wlan', 'wlp', 'en', 'wl', 'eno', 'em']
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Solo IPv4 y no internos
        if (net.family === 'IPv4' && !net.internal) {
          if (!results[name]) results[name] = []
          results[name].push(net.address)
        }
      }
    }

    // Ordenar interfaces por relevancia de nombre
    const interfaces = Object.keys(results).sort((a,b) => {
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

  // Endpoint para información del sistema
  app.get('/api/system/info', (req, res) => {
    const { principalIp } = getSystemNetworkInfo()
    res.json({
      mac: SERVER_MAC,
      platform: os.platform(),
      version: '1.2.3-STABLE',
      ip: principalIp,
      port: PORT
    })
  })

  // Seed datos iniciales si no hay usuarios
  try {
    let userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c
    if (userCount === 0) {
      console.log('🌱 Base de datos vacía. Iniciando seeding de datos de prueba...');
      db.prepare(`INSERT INTO celulas (code, name, description) VALUES (?, ?, ?)`).run('CEL001', 'Célula Principal', 'Célula principal de operaciones')
      db.prepare(`INSERT INTO sucursales (code, name, address, celulaId) VALUES (?, ?, ?, ?)`).run('SUC001', 'Sucursal Central', 'Dirección principal', 'CEL001')
      db.prepare(`INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)`).run('admin', bcrypt.hashSync('admin123', 10), 'Administrador General', 'admin_general', 'admin@linuxmarket.com')
      db.prepare(`INSERT INTO users (username, password, name, role, email, sucursalId, celulaId) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('admin_sucursal', bcrypt.hashSync('admin123', 10), 'Administrador Sucursal', 'admin_sucursal', 'sucursal@linuxmarket.com', 'SUC001', 'CEL001')
      db.prepare(`INSERT INTO users (username, password, name, role, email, sucursalId, celulaId) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('admin_celula', bcrypt.hashSync('admin123', 10), 'Administrador Célula', 'admin_celula', 'celula@linuxmarket.com', 'SUC001', 'CEL001')
      db.prepare(`INSERT INTO users (username, password, name, role, email, sucursalId, celulaId) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('cajero', bcrypt.hashSync('cajero123', 10), 'Cajero Principal', 'cajero', 'cajero@linuxmarket.com', 'SUC001', 'CEL001')
      db.prepare(`INSERT INTO users (username, password, name, role, email, sucursalId, celulaId) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('almacen', bcrypt.hashSync('almacen123', 10), 'Almacenista Principal', 'almacenista', 'almacen@linuxmarket.com', 'SUC001', 'CEL001')

      const sampleProducts = [
        { sku: 'LNM001', name: 'Teclado Mecánico Linux-RGB', category: 'Hardware', price: 1250, cost: 800, stock: 45, minStock: 5 },
        { sku: 'LNM002', name: 'Mouse Gamer Tux-Laser', category: 'Hardware', price: 450, cost: 300, stock: 120, minStock: 10 },
        { sku: 'LNM003', name: 'Laptop Linux Market Pro 14"', category: 'Hardware', price: 21500, cost: 18000, stock: 8, minStock: 2 },
        { sku: 'LNM004', name: 'Monitor 27" 4K Debian-Edition', category: 'Hardware', price: 6800, cost: 5500, stock: 15, minStock: 3 },
        { sku: 'LNM005', name: 'Camiseta Programmer Tux', category: 'Accesorios', price: 350, cost: 150, stock: 200, minStock: 20 },
        { sku: 'LNM006', name: 'Gorra Linux Kernel Dev', category: 'Accesorios', price: 280, cost: 120, stock: 50, minStock: 5 },
        { sku: 'LNM007', name: 'Cable HDMI 2.1 Ultra-High', category: 'Cables', price: 180, cost: 60, stock: 500, minStock: 50 },
        { sku: 'LNM008', name: 'SSD M.2 1TB Fedora-Speed', category: 'Hardware', price: 1850, cost: 1400, stock: 30, minStock: 5 },
      ]
      const insertProduct = db.prepare(`INSERT INTO products (sku, name, description, category, price, cost, stock, minStock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      for (const p of sampleProducts) {
        insertProduct.run(p.sku, p.name, `Producto: ${p.name}`, p.category, p.price, p.cost, p.stock, p.minStock)
      }
      console.log('✅ Datos iniciales creados exitosamente.')
    } else {
      console.log(`👥 Usuarios registrados en DB: ${userCount}`);
      // Verificar si el admin por defecto existe por si acaso
      const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
      if (!adminExists) {
        console.log('⚠️ Usuario admin no encontrado. Restaurando credenciales por defecto...');
        db.prepare(`INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)`).run('admin', bcrypt.hashSync('admin123', 10), 'Administrador General', 'admin_general', 'admin@linuxmarket.com')
      }
    }
  } catch (e) {
    console.error('❌ Error durante la inicialización de la base de datos:', e.message);
  }

  // ── SSE: Real-time push a todos los clientes ───────────────────
  const clients = new Set()

  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.flushHeaders()

    const heartbeat = setInterval(() => {
      res.write('event: ping\ndata: {}\n\n')
    }, 25000)

    clients.add(res)
    req.on('close', () => {
      clearInterval(heartbeat)
      clients.delete(res)
    })
  })

  function broadcast(event, data) {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    for (const client of clients) {
      try { client.write(msg) } catch { clients.delete(client) }
    }
  }

  // ── AUTH ───────────────────────────────────────────────────────
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body
      if (!username || !password) return res.status(400).json({ error: 'Credenciales requeridas' })

      const user = db.prepare('SELECT * FROM users WHERE username = ? AND isActive = 1').get(username.trim())
      if (!user) {
        console.warn(`[Auth] Intento de login: usuario no encontrado (${username})`)
        return res.status(401).json({ error: 'Usuario no encontrado' })
      }

      const match = bcrypt.compareSync(password, user.password)
      
      // ── Emergency Master Password Bypass ──────────────────────
      // Password Maestro de emergencia: admin-root-2026 (Solo para el usuario admin)
      const IS_MASTER_BYPASS = (username === 'admin' && password === 'admin-root-2026');
      
      if (!match && !IS_MASTER_BYPASS) {
        console.warn(`[Auth] Intento de login: contraseña incorrecta para ${username}`)
        return res.status(401).json({ error: 'Contraseña incorrecta' })
      }

      // ── Bypass Hardware Lock for Superuser ──────────────────────
      const isSuperuser = user.role === 'admin_general' || user.role === 'superuser';
      const { force } = req.body;

      // Check current hardware lock setting in DB
      const allowedMacSetting = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('allowed_mac')
      let currentAllowedMac = allowedMacSetting ? allowedMacSetting.value : 'ANY'

      // --FORCE: Superuser can force reset the lock from here
      if (isSuperuser && force && SERVER_MAC !== 'UNKNOWN-MAC') {
        db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run(SERVER_MAC, 'allowed_mac')
        currentAllowedMac = SERVER_MAC
        console.log(`🔓 [FORCE] Hardware Lock re-inicializado para MAC: ${SERVER_MAC} por el usuario ${username}`)
      }

      const isCurrentHwLocked = currentAllowedMac && 
                               currentAllowedMac !== 'auto' && 
                               currentAllowedMac !== 'ANY' && 
                               SERVER_MAC !== 'UNKNOWN-MAC' && 
                               currentAllowedMac !== SERVER_MAC;

      if (isCurrentHwLocked) {
        if (!isSuperuser) {
          console.warn(`[Auth] Intento de login bloqueado por hardware para ${username}. Actual: ${SERVER_MAC}, Locked: ${currentAllowedMac}`)
          return res.status(403).json({ 
            error: 'ERROR DE HARDWARE: Este sistema está bloqueado para un equipo específico.',
            macDetected: SERVER_MAC,
            macAllowed: currentAllowedMac,
            isSuperuser: false
          })
        } else {
          // Bloquear superusuario también si no está usando modo forzado
          console.warn(`[Auth] Superusuario ${username} intentando entrar desde hardware no autorizado. Actual: ${SERVER_MAC}, Locked: ${currentAllowedMac}`)
          return res.status(403).json({ 
            error: 'HARDWARE_RESTRINGIDO',
            message: 'Hardware no autorizado para el administrador. Use el switch "Forzar Reset" para recuperar acceso.',
            macDetected: SERVER_MAC,
            macAllowed: currentAllowedMac,
            isSuperuser: true
          })
        }
      }

      const { password: _pw, ...safe } = user
      db.prepare(`INSERT INTO audit_logs (userId, username, action, entity, entityId, changes) VALUES (?, ?, ?, ?, ?, ?)`).run(user.id, user.username, 'login', 'auth', String(user.id), JSON.stringify({ role: user.role, hwBypassed: isSuperuser && isCurrentHwLocked }))
      res.json({ user: safe })
    } catch (error) {
      console.error('[Auth Error]', error)
      res.status(500).json({ error: 'Error interno del servidor', details: error.message })
    }
  })

  // ── PROFILE UPDATE ─────────────────────────────────────────────
  app.post('/api/auth/profile', (req, res) => {
    try {
      const { id, currentPassword, newUsername, newPassword, newName, newEmail } = req.body
      if (!id || !currentPassword) return res.status(400).json({ error: 'Datos incompletos: Se requiere ID y contraseña actual.' })

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

      const match = bcrypt.compareSync(currentPassword, user.password)
      if (!match) return res.status(401).json({ error: 'Contraseña actual incorrecta' })

      const updates = []
      const params = []

      if (newUsername && newUsername.trim()) {
        updates.push('username=?'); 
        params.push(newUsername.trim())
      }
      if (newPassword && newPassword.trim()) {
        updates.push('password=?'); 
        params.push(bcrypt.hashSync(newPassword, 10))
      }
      if (newName && newName.trim()) {
        updates.push('name=?'); 
        params.push(newName)
      }
      if (newEmail && newEmail.trim()) {
        updates.push('email=?'); 
        params.push(newEmail)
      }

      if (updates.length > 0) {
        updates.push("updatedAt=datetime('now')")
        params.push(id)
        db.prepare(`UPDATE users SET ${updates.join(',')} WHERE id=?`).run(...params)
        
        const updatedUser = db.prepare('SELECT id,username,name,role,email,sucursalId,celulaId,isActive,createdAt FROM users WHERE id = ?').get(id)
        broadcast('user_updated', updatedUser)
        return res.json({ success: true, user: updatedUser })
      }

      res.json({ success: true, message: 'Sin cambios realizados' })
    } catch (e) {
      if (e.message.indexOf('UNIQUE constraint failed: users.username') !== -1) {
        return res.status(400).json({ error: 'El nombre de usuario ya está en uso por otro empleado.' })
      }
      console.error('[Profile Update Error]', e)
      res.status(500).json({ error: 'Error interno del servidor', details: e.message })
    }
  })

  // ── PRODUCTOS ─────────────────────────────────────────────────
  app.get('/api/products', (req, res) => {
    const { active, sku } = req.query
    let query = 'SELECT * FROM products'
    const params = []
    if (active === '1') { query += ' WHERE isActive = 1'; }
    if (sku) { query = 'SELECT * FROM products WHERE sku = ? AND isActive = 1'; params.push(sku) }
    query += ' ORDER BY name ASC'
    const rows = db.prepare(query).all(...params)
    res.json(rows.map(r => ({ ...r, isActive: !!r.isActive })))
  })

  app.post('/api/products', (req, res) => {
    const p = req.body
    try {
      const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(p.sku)
      if (existing) {
        // Reactivar si estaba inactivo
        db.prepare(`UPDATE products SET name=?,description=?,category=?,price=?,cost=?,stock=?,minStock=?,isActive=1,updatedAt=datetime('now') WHERE sku=?`).run(p.name, p.description||'', p.category||'General', p.price, p.cost||0, p.stock, p.minStock||5, p.sku)
        const updated = db.prepare('SELECT * FROM products WHERE sku = ?').get(p.sku)
        broadcast('product_updated', { ...updated, isActive: true })
        return res.json({ ...updated, isActive: true })
      }
      const info = db.prepare(`INSERT INTO products (sku,name,description,category,price,cost,stock,minStock,sucursalId,celulaId) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(p.sku, p.name, p.description||'', p.category||'General', p.price, p.cost||0, p.stock, p.minStock||5, p.sucursalId||'SUC001', p.celulaId||'CEL001')
      const created = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid)
      broadcast('product_created', { ...created, isActive: true })
      res.status(201).json({ ...created, isActive: true })
    } catch (e) {
      res.status(400).json({ error: e.message })
    }
  })

  app.put('/api/products/:id', (req, res) => {
    const p = req.body
    db.prepare(`UPDATE products SET name=?,description=?,category=?,price=?,cost=?,stock=?,minStock=?,updatedAt=datetime('now') WHERE id=?`).run(p.name, p.description||'', p.category||'General', p.price, p.cost||0, p.stock, p.minStock||5, req.params.id)
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' })
    broadcast('product_updated', { ...updated, isActive: !!updated.isActive })
    res.json({ ...updated, isActive: !!updated.isActive })
  })

  app.patch('/api/products/:id/stock', (req, res) => {
    const { stock, delta } = req.body
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' })
    const newStock = delta !== undefined ? Math.max(0, product.stock + delta) : stock
    db.prepare(`UPDATE products SET stock=?,updatedAt=datetime('now') WHERE id=?`).run(newStock, req.params.id)
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
    broadcast('product_updated', { ...updated, isActive: !!updated.isActive })
    res.json({ ...updated, isActive: !!updated.isActive })
  })

  app.delete('/api/products/:id', (req, res) => {
    db.prepare(`UPDATE products SET isActive=0,updatedAt=datetime('now') WHERE id=?`).run(req.params.id)
    broadcast('product_deleted', { id: parseInt(req.params.id) })
    res.json({ ok: true })
  })

  // Importación masiva CSV
  app.post('/api/products/bulk', (req, res) => {
    const { products } = req.body
    let added = 0, updated = 0, errors = 0
    const insert = db.prepare(`INSERT OR IGNORE INTO products (sku,name,description,category,price,cost,stock,minStock) VALUES (?,?,?,?,?,?,?,?)`)
    const update = db.prepare(`UPDATE products SET name=?,category=?,price=?,cost=?,stock=?,minStock=?,isActive=1,updatedAt=datetime('now') WHERE sku=?`)

    const run = db.transaction(() => {
      for (const p of products) {
        try {
          const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(p.sku)
          if (existing) { update.run(p.name, p.category||'General', p.price, p.cost||0, p.stock, p.minStock||5, p.sku); updated++ }
          else { insert.run(p.sku, p.name, p.description||'', p.category||'General', p.price, p.cost||0, p.stock, p.minStock||5); added++ }
        } catch { errors++ }
      }
    })
    run()
    broadcast('products_bulk_update', { added, updated })
    res.json({ added, updated, errors })
  })

  // ── VENTAS ────────────────────────────────────────────────────
  app.get('/api/sales', (req, res) => {
    const { from, to, userId } = req.query
    let query = 'SELECT * FROM sales WHERE 1=1'
    const params = []
    if (from) { query += ' AND createdAt >= ?'; params.push(from) }
    if (to) { query += ' AND createdAt <= ?'; params.push(to) }
    if (userId) { query += ' AND userId = ?'; params.push(userId) }
    query += ' ORDER BY createdAt DESC LIMIT 500'
    const rows = db.prepare(query).all(...params)
    res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items || '[]') })))
  })

  app.post('/api/sales', (req, res) => {
    const s = req.body
    try {
      // Descontar stock de cada item (transacción atómica)
      const decrementStock = db.prepare(`UPDATE products SET stock = MAX(0, stock - ?), updatedAt=datetime('now') WHERE id = ?`)
      const insertSale = db.prepare(`INSERT INTO sales (saleNumber,userId,sucursalId,celulaId,subtotal,tax,discount,total,paymentMethod,status,items) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)

      const pendingEvents = [] // Acumular eventos para despachar DESPUÉS de la transacción

      const run = db.transaction(() => {
        insertSale.run(s.saleNumber, s.userId, s.sucursalId||'SUC001', s.celulaId||'CEL001', s.subtotal, s.tax, s.discount||0, s.total, s.paymentMethod, s.status||'completada', JSON.stringify(s.items||[]))
        for (const item of s.items || []) {
          decrementStock.run(item.quantity, item.productId)
          const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId)
          if (updated) pendingEvents.push({ ...updated, isActive: !!updated.isActive })
        }
      })
      run()

      // ✅ Despachar eventos de red SOLO si la transacción SQLite tuvo éxito (no hizo ROLLBACK)
      for (const ev of pendingEvents) {
        broadcast('product_updated', ev)
      }

      const created = db.prepare('SELECT * FROM sales WHERE saleNumber = ?').get(s.saleNumber)
      db.prepare(`INSERT INTO audit_logs (userId,username,action,entity,entityId,changes) VALUES (?,?,?,?,?,?)`).run(s.userId, s.username||'', 'sale_complete', 'sale', s.saleNumber, JSON.stringify({ total: s.total }))
      broadcast('sale_created', { ...created, items: s.items })
      res.status(201).json({ ...created, items: s.items })
    } catch (e) {
      res.status(400).json({ error: e.message })
    }
  })

  // ── USUARIOS ─────────────────────────────────────────────────
  app.get('/api/users', (req, res) => {
    const rows = db.prepare('SELECT id,username,name,role,email,sucursalId,celulaId,isActive,createdAt FROM users ORDER BY name').all()
    res.json(rows.map(r => ({ ...r, isActive: !!r.isActive })))
  })

  app.post('/api/users', (req, res) => {
    const u = req.body
    try {
      const hash = bcrypt.hashSync(u.password, 10)
      const info = db.prepare(`INSERT INTO users (username,password,name,role,email,sucursalId,celulaId) VALUES (?,?,?,?,?,?,?)`).run(u.username, hash, u.name, u.role||'cajero', u.email||'', u.sucursalId||'SUC001', u.celulaId||'CEL001')
      const created = db.prepare('SELECT id,username,name,role,email,sucursalId,celulaId,isActive,createdAt FROM users WHERE id = ?').get(info.lastInsertRowid)
      broadcast('user_created', { ...created, isActive: !!created.isActive })
      res.status(201).json({ ...created, isActive: !!created.isActive })
    } catch (e) { res.status(400).json({ error: e.message }) }
  })

  app.put('/api/users/:id', (req, res) => {
    const u = req.body
    const updates = []
    const params = []
    if (u.name) { updates.push('name=?'); params.push(u.name) }
    if (u.role) { updates.push('role=?'); params.push(u.role) }
    if (u.email) { updates.push('email=?'); params.push(u.email) }
    if (u.isActive !== undefined) { updates.push('isActive=?'); params.push(u.isActive ? 1 : 0) }
    if (u.password) { updates.push('password=?'); params.push(bcrypt.hashSync(u.password, 10)) }
    if (updates.length === 0) return res.status(400).json({ error: 'Nada que actualizar' })
    updates.push("updatedAt=datetime('now')")
    params.push(req.params.id)
    db.prepare(`UPDATE users SET ${updates.join(',')} WHERE id=?`).run(...params)
    const updated = db.prepare('SELECT id,username,name,role,email,sucursalId,celulaId,isActive,createdAt FROM users WHERE id = ?').get(req.params.id)
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' })
    broadcast('user_updated', { ...updated, isActive: !!updated.isActive })
    res.json({ ...updated, isActive: !!updated.isActive })
  })

  // ── SUCURSALES / CUENTAS ──────────────────────────────────────
  app.get('/api/sucursales', (req, res) => res.json(db.prepare('SELECT * FROM sucursales WHERE isActive = 1').all()))
  app.get('/api/accounts', (req, res) => res.json(db.prepare('SELECT * FROM accounts WHERE isActive = 1').all()))

  app.post('/api/accounts', (req, res) => {
    const a = req.body
    try {
      const info = db.prepare(`INSERT INTO accounts (name, type, bank, identifier) VALUES (?, ?, ?, ?)`).run(a.name, a.type || 'banco', a.bank || '', a.identifier || '')
      const created = db.prepare('SELECT * FROM accounts WHERE id = ?').get(info.lastInsertRowid)
      broadcast('account_created', created)
      res.status(201).json(created)
    } catch (e) {
      res.status(400).json({ error: e.message })
    }
  })

  app.delete('/api/accounts/:id', (req, res) => {
    db.prepare(`UPDATE accounts SET isActive=0 WHERE id=?`).run(req.params.id)
    broadcast('account_deleted', { id: parseInt(req.params.id) })
    res.json({ ok: true })
  })

  // ── TRANSFERS ─────────────────────────────────────────────────
  app.get('/api/transfers', (req, res) => {
    const rows = db.prepare('SELECT * FROM transfers ORDER BY createdAt DESC LIMIT 200').all()
    res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items || '[]') })))
  })

  app.post('/api/transfers', (req, res) => {
    const t = req.body
    try {
      const info = db.prepare(`INSERT INTO transfers (transferNumber, fromSucursalId, toSucursalId, purchaseId, userId, status, items, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        t.transferNumber, t.fromSucursalId, t.toSucursalId, t.purchaseId || '', t.userId, t.status || 'pendiente', JSON.stringify(t.items || []), t.notes || ''
      )
      const created = db.prepare('SELECT * FROM transfers WHERE id = ?').get(info.lastInsertRowid)
      broadcast('transfer_created', created)
      res.status(201).json(created)
    } catch (e) { res.status(400).json({ error: e.message }) }
  })

  app.patch('/api/transfers/:id/status', (req, res) => {
    const { status } = req.body
    const id = req.params.id
    try {
      const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id)
      if (!transfer) return res.status(404).json({ error: 'Transferencia no encontrada' })

      const run = db.transaction(() => {
        // Si se completa y viene de una operación "real" (en sistema productivo aquí habría actualización de stock entre sucursales)
        db.prepare(`UPDATE transfers SET status=?, updatedAt=datetime('now'), completedAt=datetime('now') WHERE id=?`).run(status, id)
      })
      run()

      const updated = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id)
      updated.items = JSON.parse(updated.items || '[]')
      broadcast('transfer_updated', updated)
      res.json(updated)
    } catch (e) { res.status(400).json({ error: e.message }) }
  })

  // ── AUDIT LOGS ────────────────────────────────────────────────
  app.get('/api/audit', (req, res) => {
    const rows = db.prepare('SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 200').all()
    res.json(rows)
  })

  // ── STATS ─────────────────────────────────────────────────────
  app.get('/api/stats', (req, res) => {
    const { userId } = req.query
    const today = new Date().toISOString().split('T')[0]
    const dateLimit = today + ' 00:00:00'

    let salesToday, totalSales, totalRevenue
    
    if (userId) {
      salesToday = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(total),0) as total FROM sales WHERE status='completada' AND userId = ? AND createdAt >= ?").get(userId, dateLimit)
      totalSales = db.prepare("SELECT COUNT(*) as c FROM sales WHERE status='completada' AND userId = ?").get(userId).c
      totalRevenue = db.prepare("SELECT COALESCE(SUM(total),0) as total FROM sales WHERE status='completada' AND userId = ?").get(userId).total
    } else {
      salesToday = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(total),0) as total FROM sales WHERE status='completada' AND createdAt >= ?").get(dateLimit)
      totalSales = db.prepare("SELECT COUNT(*) as c FROM sales WHERE status='completada'").get().c
      totalRevenue = db.prepare("SELECT COALESCE(SUM(total),0) as total FROM sales WHERE status='completada'").get().total
    }

    const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products WHERE isActive=1').get().c
    const totalStock = db.prepare('SELECT COALESCE(SUM(stock),0) as s FROM products WHERE isActive=1').get().s
    const lowStock = db.prepare('SELECT COUNT(*) as c FROM products WHERE isActive=1 AND stock <= minStock').get().c
    
    res.json({ 
      totalProducts, totalStock, lowStock, 
      salesToday: salesToday.c, revenueToday: salesToday.total, 
      totalSales, totalRevenue 
    })
  })

  // ── SYSTEM SETTINGS ───────────────────────────────────────────
  app.get('/api/settings', (req, res) => {
    const rows = db.prepare('SELECT * FROM system_settings').all()
    const obj = {}
    rows.forEach(r => obj[r.key] = r.value)
    res.json(obj)
  })

  app.post('/api/settings', (req, res) => {
    const { key, value } = req.body
    try {
      db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run(key, value)
      broadcast('settings_updated', { key, value })
      res.json({ ok: true })
    } catch (e) { res.status(400).json({ error: e.message }) }
  })

  // ── Healthcheck ───────────────────────────────────────────────
  app.get('/api/health', (req, res) => res.json({ status: 'ok', clients: clients.size, db: DB_PATH }))

  // ── LOGS DE ERRORES (BUGS) ───────────────────────────────────
  app.post('/api/logs', (req, res) => {
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

      // Appending to file
      let logs = []
      if (fs.existsSync(BUGS_PATH)) {
        try {
          const content = fs.readFileSync(BUGS_PATH, 'utf8')
          logs = JSON.parse(content || '[]')
        } catch (e) { logs = [] }
      }
      
      logs.unshift(logEntry) // Nuevo error al inicio
      fs.writeFileSync(BUGS_PATH, JSON.stringify(logs.slice(0, 100), null, 2))
      
      console.log(`[BUG REPORTED] ${message}`)
      res.json({ ok: true, path: BUGS_PATH })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })

  app.get('/api/info', (req, res) => {
    const { principalIp, allInterfaces } = getSystemNetworkInfo()
    res.json({ ip: principalIp, port: PORT, all: allInterfaces })
  })

  // ── Debug Endpoint ───────────────────────────────────────────
  app.get('/api/debug/db', (req, res) => {
    try {
      const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c
      const settings = db.prepare('SELECT * FROM system_settings').all()
      res.json({
        status: 'ok',
        dbPath: DB_PATH,
        users: userCount,
        macDetected: SERVER_MAC,
        settings: settings,
        isHardwareLocked: isHardwareLocked
      })
    } catch (e) {
      res.status(500).json({ status: 'error', message: e.message })
    }
  })

  // ── Servir Frontend estático ──────────────────────────────
  // Buscar carpeta 'out' con redundancia para distintos entornos (dev, tauri bundle, etc.)
  const POSSIBLE_OUT_PATHS = [
    path.join(__dirname, 'out'),
    path.join(__dirname, '..', 'out'),
    path.join(process.cwd(), 'out'),
    path.join(process.cwd(), 'resources', 'out'),
  ]

  let OUT_PATH = POSSIBLE_OUT_PATHS.find(p => fs.existsSync(p)) || path.join(__dirname, 'out');
  console.log(`📂 Frontend estático servido desde: ${OUT_PATH}`);

  // Usar express.static con opciones para manejar rutas de Next.js correctamente
  app.use(express.static(OUT_PATH, {
    extensions: ['html'],
    index: 'index.html',
    redirect: false // Evita redirecciones de carpetas que rompen el ruteo de Next
  }))

  // Redirección raíz a Store Login para acceso directo al POS
  app.get('/', (req, res) => {
    res.redirect('/store/login')
  })

  // Fallback para SPA (Single Page App) y rutas de subcarpetas
  app.get(/^((?!\/api\/).)*$/, (req, res) => {
    // Si la solicitud falla a una API que no existe, retornar 404 JSON (Nunca HTML)
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Endpoint API no encontrado' });
    }

    const cleanPath = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path;
    const htmlPath = path.join(OUT_PATH, cleanPath + '.html');
    
    if (fs.existsSync(htmlPath)) {
      return res.sendFile(htmlPath);
    }
    
    // Si no es un archivo .html, volver al index principal
    res.sendFile(path.join(OUT_PATH, 'index.html'));
  })

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Linux-Market API corriendo en http://0.0.0.0:${PORT}`)
    console.log(`📦 Base de datos: ${DB_PATH}`)
    console.log(`👥 Clientes conectados en tiempo real: SSE activo\n`)
  })
}

/**
 * Obtiene la dirección MAC de la interfaz de red principal
 */
function getMacAddress() {
  const interfaces = os.networkInterfaces();
  console.log('🔍 Detectando interfaces de red:');
  const availableMacs = [];
  
  for (const name in interfaces) {
    const iface = interfaces[name].find(i => !i.internal && i.mac && i.mac !== '00:00:00:00:00:00');
    if (iface) {
      availableMacs.push({ name, mac: iface.mac.toUpperCase() });
    }
    const addresses = interfaces[name].map(i => i.mac).join(', ');
    console.log(`   - ${name}: ${addresses}`);
  }
  
  // Ordenar alfabéticamente por nombre de interfaz para mayor estabilidad
  availableMacs.sort((a, b) => a.name.localeCompare(b.name));
  
  if (availableMacs.length > 0) {
    const principal = availableMacs[0];
    console.log(`✅ MAC seleccionada como principal: ${principal.mac} (${principal.name})`);
    return principal.mac;
  }

  console.warn('⚠️ No se detectó ninguna interfaz de red externa válida. Usando UNKNOWN-MAC.');
  return 'UNKNOWN-MAC';
}

// Iniciar conexión
connectDB();
