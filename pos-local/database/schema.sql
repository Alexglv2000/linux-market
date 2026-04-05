-- ============================================================
-- Linux-Market POS Local v1.0.0 Beta
-- Schema SQLite optimizado para análisis histórico y red LAN
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- ── Sucursales ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sucursales (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  nombre      TEXT NOT NULL,
  direccion   TEXT,
  telefono    TEXT,
  es_matriz   INTEGER DEFAULT 0,
  activa      INTEGER DEFAULT 1,
  creado_en   TEXT DEFAULT (datetime('now'))
);

-- ── Usuarios ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  sucursal_id   TEXT REFERENCES sucursales(id),
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  rol           TEXT NOT NULL CHECK(rol IN ('super_admin','admin_general','admin_sucursal','cajero')),
  activo        INTEGER DEFAULT 1,
  creado_en     TEXT DEFAULT (datetime('now'))
);

-- ── Categorías ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre    TEXT NOT NULL UNIQUE,
  color     TEXT DEFAULT '#6366f1'
);

-- ── Productos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  sucursal_id   TEXT REFERENCES sucursales(id),
  categoria_id  INTEGER REFERENCES categorias(id),
  sku           TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  descripcion   TEXT,
  precio        REAL NOT NULL DEFAULT 0,
  costo         REAL NOT NULL DEFAULT 0,
  stock         INTEGER NOT NULL DEFAULT 0,
  stock_minimo  INTEGER DEFAULT 5,
  unidad        TEXT DEFAULT 'pza',
  codigo_barras TEXT,
  activo        INTEGER DEFAULT 1,
  creado_en     TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT DEFAULT (datetime('now')),
  UNIQUE(sucursal_id, sku)
);

-- ── Ventas ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ventas (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  sucursal_id     TEXT NOT NULL REFERENCES sucursales(id),
  cajero_id       TEXT NOT NULL REFERENCES usuarios(id),
  folio           TEXT NOT NULL,
  subtotal        REAL NOT NULL DEFAULT 0,
  descuento       REAL NOT NULL DEFAULT 0,
  impuesto        REAL NOT NULL DEFAULT 0,
  total           REAL NOT NULL DEFAULT 0,
  metodo_pago     TEXT NOT NULL CHECK(metodo_pago IN ('efectivo','tarjeta','transferencia','qr','mixto')),
  monto_pagado    REAL NOT NULL DEFAULT 0,
  cambio          REAL NOT NULL DEFAULT 0,
  estado          TEXT DEFAULT 'completada' CHECK(estado IN ('completada','cancelada','devuelta')),
  nota            TEXT,
  creado_en       TEXT DEFAULT (datetime('now')),
  UNIQUE(sucursal_id, folio)
);

-- ── Detalle de Ventas ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venta_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id    TEXT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id TEXT NOT NULL REFERENCES productos(id),
  nombre      TEXT NOT NULL,
  sku         TEXT NOT NULL,
  cantidad    INTEGER NOT NULL DEFAULT 1,
  precio_unit REAL NOT NULL,
  descuento   REAL DEFAULT 0,
  subtotal    REAL NOT NULL
);

-- ── Movimientos de Inventario ────────────────────────────────
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id TEXT NOT NULL REFERENCES productos(id),
  usuario_id  TEXT REFERENCES usuarios(id),
  tipo        TEXT NOT NULL CHECK(tipo IN ('entrada','salida','ajuste','transferencia')),
  cantidad    INTEGER NOT NULL,
  stock_antes INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  referencia  TEXT,
  nota        TEXT,
  creado_en   TEXT DEFAULT (datetime('now'))
);

-- ── Caja ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sesiones_caja (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  sucursal_id     TEXT NOT NULL REFERENCES sucursales(id),
  cajero_id       TEXT NOT NULL REFERENCES usuarios(id),
  fondo_inicial   REAL NOT NULL DEFAULT 0,
  total_efectivo  REAL DEFAULT 0,
  total_tarjeta   REAL DEFAULT 0,
  total_transfer  REAL DEFAULT 0,
  total_qr        REAL DEFAULT 0,
  total_ventas    REAL DEFAULT 0,
  num_transacc    INTEGER DEFAULT 0,
  abierta_en      TEXT DEFAULT (datetime('now')),
  cerrada_en      TEXT,
  estado          TEXT DEFAULT 'abierta' CHECK(estado IN ('abierta','cerrada'))
);

-- ── Auditoría ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id  TEXT REFERENCES usuarios(id),
  username    TEXT,
  accion      TEXT NOT NULL,
  entidad     TEXT NOT NULL,
  entidad_id  TEXT,
  datos       TEXT,
  ip          TEXT,
  creado_en   TEXT DEFAULT (datetime('now'))
);

-- ── Configuración ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion TEXT
);

-- ── Índices para análisis rápido ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ventas_fecha     ON ventas(creado_en);
CREATE INDEX IF NOT EXISTS idx_ventas_sucursal  ON ventas(sucursal_id, creado_en);
CREATE INDEX IF NOT EXISTS idx_venta_items_prod ON venta_items(producto_id);
CREATE INDEX IF NOT EXISTS idx_mov_inv_prod     ON movimientos_inventario(producto_id, creado_en);
CREATE INDEX IF NOT EXISTS idx_prod_sucursal    ON productos(sucursal_id, activo);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha  ON auditoria(creado_en);

-- ── Datos iniciales ──────────────────────────────────────────
INSERT OR IGNORE INTO configuracion VALUES ('nombre_negocio',  'Mi Tienda',     'Nombre del negocio');
INSERT OR IGNORE INTO configuracion VALUES ('moneda',          'MXN',           'Moneda del sistema');
INSERT OR IGNORE INTO configuracion VALUES ('impuesto_pct',    '16',            'Porcentaje de IVA');
INSERT OR IGNORE INTO configuracion VALUES ('ticket_pie',      'Gracias por su compra', 'Texto pie de ticket');
INSERT OR IGNORE INTO configuracion VALUES ('version',         '1.0.0-beta',    'Version del sistema');

INSERT OR IGNORE INTO categorias (nombre, color) VALUES
  ('General',    '#6366f1'),
  ('Alimentos',  '#f97316'),
  ('Bebidas',    '#06b6d4'),
  ('Limpieza',   '#22c55e'),
  ('Electronica','#a855f7'),
  ('Ropa',       '#ec4899'),
  ('Servicios',  '#f59e0b');

INSERT OR IGNORE INTO sucursales (id, nombre, es_matriz, activa) VALUES
  ('suc-principal', 'Sucursal Principal', 1, 1);
