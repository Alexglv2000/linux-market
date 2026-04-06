/**
 * server/db/index.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * SQLite singleton connection with seeding logic.
 * Uses the Repository pattern (see repository.js) to abstract
 * direct db.prepare() calls from business logic.
 *
 * PHASE 5 NOTE: To migrate to PostgreSQL, replace this file only.
 * All routes/controllers use repository.js, not this file directly.
 */

'use strict'

const Database = require('better-sqlite3')
const bcrypt   = require('bcryptjs')
const config   = require('../config/env')
const logger   = require('../services/logger.service')
const { SCHEMA_SQL } = require('./schema')

let _db = null

/**
 * Returns the active database connection.
 * Throws if called before connect().
 */
function getDb() {
  if (!_db) throw new Error('Database not initialized. Call connect() first.')
  return _db
}

/**
 * Opens the SQLite connection, applies the schema, and seeds initial data.
 * Retries up to MAX_RETRIES times on failure.
 *
 * @returns {Promise<void>}
 */
function connect() {
  return new Promise((resolve, reject) => {
    const MAX_RETRIES = 3
    let attempt = 0

    function tryConnect() {
      attempt++
      logger.info(`Connecting to database (attempt ${attempt}/${MAX_RETRIES})`, {
        path: config.DB_PATH
      })

      try {
        _db = new Database(config.DB_PATH, { timeout: 5000 })
        _db.pragma('journal_mode = WAL')   // Write-Ahead Logging for concurrency
        _db.pragma('foreign_keys = ON')    // Enforce referential integrity
        _db.exec(SCHEMA_SQL)

        logger.info('Database schema validated.')
        seed(_db)
        resolve(_db)
      } catch (err) {
        logger.error(`Database connection failed on attempt ${attempt}`, {
          message: err.message
        })

        if (attempt < MAX_RETRIES) {
          logger.info(`Retrying in 1 second...`)
          setTimeout(tryConnect, 1000)
        } else {
          reject(new Error(`Database failed after ${MAX_RETRIES} attempts: ${err.message}`))
        }
      }
    }

    tryConnect()
  })
}

/**
 * Seeds the database with default data on first run.
 * Safe to call multiple times — uses INSERT OR IGNORE.
 *
 * @param {Database} db
 */
function seed(db) {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c

    if (userCount === 0) {
      logger.info('Empty database detected. Seeding default data...')

      db.prepare('INSERT INTO celulas (code, name, description) VALUES (?, ?, ?)').run(
        'CEL001', 'Célula Principal', 'Célula principal de operaciones'
      )
      db.prepare('INSERT INTO sucursales (code, name, address, celulaId) VALUES (?, ?, ?, ?)').run(
        'SUC001', 'Sucursal Central', 'Dirección principal', 'CEL001'
      )

      const seedUsers = [
        { username: 'admin',         password: 'admin123',   name: 'Administrador General',   role: 'admin_general',   email: 'admin@linuxmarket.com',    sucursalId: null,     celulaId: null },
        { username: 'admin_sucursal', password: 'admin123',  name: 'Administrador Sucursal',  role: 'admin_sucursal',  email: 'sucursal@linuxmarket.com', sucursalId: 'SUC001', celulaId: 'CEL001' },
        { username: 'admin_celula',   password: 'admin123',  name: 'Administrador Célula',    role: 'admin_celula',    email: 'celula@linuxmarket.com',   sucursalId: 'SUC001', celulaId: 'CEL001' },
        { username: 'cajero',         password: 'cajero123', name: 'Cajero Principal',         role: 'cajero',          email: 'cajero@linuxmarket.com',   sucursalId: 'SUC001', celulaId: 'CEL001' },
        { username: 'almacen',        password: 'almacen123',name: 'Almacenista Principal',   role: 'almacenista',     email: 'almacen@linuxmarket.com',  sucursalId: 'SUC001', celulaId: 'CEL001' },
      ]

      const insertUser = db.prepare(
        'INSERT INTO users (username, password, name, role, email, sucursalId, celulaId) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      for (const u of seedUsers) {
        insertUser.run(u.username, bcrypt.hashSync(u.password, 10), u.name, u.role, u.email, u.sucursalId, u.celulaId)
      }

      const sampleProducts = [
        { sku: 'LNM001', name: 'Teclado Mecánico Linux-RGB',     category: 'Hardware',    price: 1250,  cost: 800,   stock: 45,  minStock: 5  },
        { sku: 'LNM002', name: 'Mouse Gamer Tux-Laser',          category: 'Hardware',    price: 450,   cost: 300,   stock: 120, minStock: 10 },
        { sku: 'LNM003', name: 'Laptop Linux Market Pro 14"',    category: 'Hardware',    price: 21500, cost: 18000, stock: 8,   minStock: 2  },
        { sku: 'LNM004', name: 'Monitor 27" 4K Debian-Edition',  category: 'Hardware',    price: 6800,  cost: 5500,  stock: 15,  minStock: 3  },
        { sku: 'LNM005', name: 'Camiseta Programmer Tux',        category: 'Accesorios',  price: 350,   cost: 150,   stock: 200, minStock: 20 },
        { sku: 'LNM006', name: 'Gorra Linux Kernel Dev',         category: 'Accesorios',  price: 280,   cost: 120,   stock: 50,  minStock: 5  },
        { sku: 'LNM007', name: 'Cable HDMI 2.1 Ultra-High',      category: 'Cables',      price: 180,   cost: 60,    stock: 500, minStock: 50 },
        { sku: 'LNM008', name: 'SSD M.2 1TB Fedora-Speed',       category: 'Hardware',    price: 1850,  cost: 1400,  stock: 30,  minStock: 5  },
      ]

      const insertProduct = db.prepare(
        'INSERT INTO products (sku, name, description, category, price, cost, stock, minStock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      for (const p of sampleProducts) {
        insertProduct.run(p.sku, p.name, `Producto: ${p.name}`, p.category, p.price, p.cost, p.stock, p.minStock)
      }

      logger.info('Default seed data created successfully.')
    } else {
      logger.info(`Database OK. Users registered: ${userCount}`)

      // Ensure admin account always exists for recovery
      const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin')
      if (!adminExists) {
        logger.warn('Admin user missing. Restoring with default credentials.')
        db.prepare('INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)').run(
          'admin', bcrypt.hashSync('admin123', 10), 'Administrador General', 'admin_general', 'admin@linuxmarket.com'
        )
      }
    }
  } catch (err) {
    logger.safeError('[DB Seed]', err)
  }
}

module.exports = { connect, getDb }
