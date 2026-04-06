/**
 * server/db/schema.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * Centralized SQL schema definitions.
 * Previously inlined as one giant db.exec() call inside server.js.
 * Keeping schema in one place makes migrations and audits trivial.
 */

'use strict'

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    name       TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'cajero',
    email      TEXT,
    sucursalId TEXT DEFAULT 'SUC001',
    celulaId   TEXT DEFAULT 'CEL001',
    isActive   INTEGER NOT NULL DEFAULT 1,
    createdAt  TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    sku         TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    category    TEXT DEFAULT 'General',
    price       REAL NOT NULL DEFAULT 0,
    cost        REAL NOT NULL DEFAULT 0,
    stock       INTEGER NOT NULL DEFAULT 0,
    minStock    INTEGER NOT NULL DEFAULT 5,
    sucursalId  TEXT DEFAULT 'SUC001',
    celulaId    TEXT DEFAULT 'CEL001',
    imageUrl    TEXT,
    isActive    INTEGER NOT NULL DEFAULT 1,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sales (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    saleNumber    TEXT UNIQUE NOT NULL,
    userId        INTEGER NOT NULL,
    sucursalId    TEXT DEFAULT 'SUC001',
    celulaId      TEXT DEFAULT 'CEL001',
    subtotal      REAL NOT NULL DEFAULT 0,
    tax           REAL NOT NULL DEFAULT 0,
    discount      REAL NOT NULL DEFAULT 0,
    total         REAL NOT NULL DEFAULT 0,
    paymentMethod TEXT NOT NULL DEFAULT 'efectivo',
    status        TEXT NOT NULL DEFAULT 'completada',
    items         TEXT NOT NULL DEFAULT '[]',
    createdAt     TEXT NOT NULL DEFAULT (datetime('now')),
    syncedAt      TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    userId    INTEGER NOT NULL,
    username  TEXT NOT NULL,
    action    TEXT NOT NULL,
    entity    TEXT NOT NULL,
    entityId  TEXT NOT NULL,
    changes   TEXT DEFAULT '{}',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sucursales (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    code      TEXT UNIQUE NOT NULL,
    name      TEXT NOT NULL,
    address   TEXT DEFAULT '',
    celulaId  TEXT DEFAULT 'CEL001',
    isActive  INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS celulas (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    isActive    INTEGER NOT NULL DEFAULT 1,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    type       TEXT NOT NULL DEFAULT 'efectivo',
    bank       TEXT,
    identifier TEXT NOT NULL,
    isActive   INTEGER NOT NULL DEFAULT 1,
    createdAt  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transfers (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    transferNumber TEXT UNIQUE NOT NULL,
    fromSucursalId TEXT NOT NULL,
    toSucursalId   TEXT NOT NULL,
    purchaseId     TEXT,
    userId         INTEGER NOT NULL,
    status         TEXT NOT NULL DEFAULT 'pendiente',
    items          TEXT NOT NULL DEFAULT '[]',
    notes          TEXT,
    createdAt      TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt      TEXT NOT NULL DEFAULT (datetime('now')),
    completedAt    TEXT
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Default hardware lock: 'auto' means it will self-register on first run
  INSERT OR IGNORE INTO system_settings (key, value) VALUES ('allowed_mac', 'auto');
`

module.exports = { SCHEMA_SQL }
