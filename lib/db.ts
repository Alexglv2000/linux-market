import Dexie, { type EntityTable } from 'dexie'
import bcrypt from 'bcryptjs'

// Types
export interface User {
  id?: number
  username: string
  password: string
  name: string
  role: 'cajero' | 'almacenista' | 'admin_sucursal' | 'admin_celula' | 'admin_general'
  email: string
  sucursalId?: string
  celulaId?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface Product {
  id?: number
  sku: string
  name: string
  description: string
  category: string
  price: number
  cost: number
  stock: number
  minStock: number
  sucursalId: string
  celulaId: string
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface Sale {
  id?: number
  saleNumber: string
  userId: number
  sucursalId: string
  celulaId: string
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr'
  status: 'completada' | 'cancelada' | 'pendiente'
  items: SaleItem[]
  createdAt: Date
  syncedAt?: Date
}

export interface SaleItem {
  productId: number
  sku: string
  name: string
  quantity: number
  price: number
  subtotal: number
}

export interface Sucursal {
  id?: number
  code: string
  name: string
  address: string
  celulaId: string
  isActive: boolean
  createdAt: Date
}

export interface Celula {
  id?: number
  code: string
  name: string
  description: string
  isActive: boolean
  createdAt: Date
}

export interface Transfer {
  id?: number
  transferNumber: string
  fromSucursalId: string
  toSucursalId: string
  purchaseId?: string // Link to a purchase order or reference
  userId: number
  status: 'pendiente' | 'en_transito' | 'completada' | 'cancelada'
  items: TransferItem[]
  notes?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface TransferItem {
  productId: number
  sku: string
  name: string
  quantity: number
}

export interface AuditLog {
  id?: number
  userId: number
  username: string
  action: string
  entity: string
  entityId: string
  changes: string
  ipAddress?: string
  createdAt: Date
}

export interface Account {
  id?: number
  name: string
  type: 'banco' | 'efectivo' | 'terminal' | 'digital'
  bank?: string
  identifier: string // CLABE, Account #, Terminal ID
  isActive: boolean
  createdAt: Date
}

// Database class
class LinuxMarketDB extends Dexie {
  users!: EntityTable<User, 'id'>
  products!: EntityTable<Product, 'id'>
  sales!: EntityTable<Sale, 'id'>
  sucursales!: EntityTable<Sucursal, 'id'>
  celulas!: EntityTable<Celula, 'id'>
  transfers!: EntityTable<Transfer, 'id'>
  accounts!: EntityTable<Account, 'id'>
  auditLogs!: EntityTable<AuditLog, 'id'>

  constructor() {
    super('LinuxMarketDB')
    
    this.version(1).stores({
      users: '++id, username, role, sucursalId, celulaId, isActive',
      products: '++id, sku, name, category, sucursalId, celulaId, isActive',
      sales: '++id, saleNumber, userId, sucursalId, celulaId, status, createdAt',
      sucursales: '++id, code, celulaId, isActive',
      celulas: '++id, code, isActive',
      transfers: '++id, transferNumber, fromSucursalId, toSucursalId, purchaseId, status, createdAt',
      accounts: '++id, name, type, bank, identifier, isActive, createdAt',
      auditLogs: '++id, userId, entity, entityId, createdAt'
    })
  }
}

export const db = new LinuxMarketDB()

// Initialize default data — safe to call multiple times (idempotent)
export async function initializeDefaultData() {
  try {
  const userCount = await db.users.count()
  
  if (userCount === 0) {
    // Create default celula
    const celulaId = await db.celulas.add({
      code: 'CEL001',
      name: 'Célula Principal',
      description: 'Célula principal de operaciones',
      isActive: true,
      createdAt: new Date()
    })

    // Create default sucursal
    const sucursalId = await db.sucursales.add({
      code: 'SUC001',
      name: 'Sucursal Central',
      address: 'Dirección principal',
      celulaId: `CEL001`,
      isActive: true,
      createdAt: new Date()
    })

    // Create admin user
    // Password: admin123
    await db.users.add({
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      name: 'Administrador General',
      role: 'admin_general',
      email: 'admin@linuxmarket.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    })

    // Create sample cashier user
    // Password: cajero123
    await db.users.add({
      username: 'cajero',
      password: bcrypt.hashSync('cajero123', 10),
      name: 'Cajero Principal',
      role: 'cajero',
      email: 'cajero@linuxmarket.com',
      sucursalId: 'SUC001',
      celulaId: 'CEL001',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    })

    // Seed sample products
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

    for (const p of sampleProducts) {
      await db.products.add({
        ...p,
        description: `Producto de alta calidad: ${p.name}`,
        sucursalId: 'SUC001',
        celulaId: 'CEL001',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      })
    }
  }
  } catch (error) {
    // Non-fatal — app can still run without seed data
    console.error('[v0] initializeDefaultData failed:', error)
  }
}
