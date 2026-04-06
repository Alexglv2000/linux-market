/**
 * server.js — Linux-Market Bootstrap
 * Author: Alexis Gabriel Lugo Villeda
 *
 * This file is now a CLEAN BOOTSTRAP.
 * All business logic has been extracted into server/ modules.
 *
 * Previous monolith: 874 lines
 * This file: ~70 lines
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  SECURITY CHANGES (FASE 1)                               │
 * │                                                          │
 * │  ❌ REMOVED: hardcoded backdoor 'admin-root-2026'        │
 * │  ❌ REMOVED: file-based hardware bypass                  │
 * │  ✅ ADDED:   env-based MAC whitelist (ALLOWED_MACS)      │
 * │  ✅ FIXED:   SSE events only fire after DB commit        │
 * └─────────────────────────────────────────────────────────┘
 */

'use strict'

const express = require('express')
const cors    = require('cors')
const path    = require('path')
const fs      = require('fs')

// ── Load config first (fail-fast on missing env vars) ─────────────────────
const config  = require('./server/config/env')
const logger  = require('./server/services/logger.service')

// ── Route modules ─────────────────────────────────────────────────────────
const authRoutes      = require('./server/routes/auth.routes')
const productsRoutes  = require('./server/routes/products.routes')
const salesRoutes     = require('./server/routes/sales.routes')
const usersRoutes     = require('./server/routes/users.routes')
const transfersRoutes = require('./server/routes/transfers.routes')
const settingsRoutes  = require('./server/routes/settings.routes')
const systemRoutes    = require('./server/routes/system.routes')

// ── Middlewares ────────────────────────────────────────────────────────────
const { loggerMiddleware } = require('./server/middlewares/logger.middleware')
const { errorMiddleware }  = require('./server/middlewares/error.middleware')

// ── Database ──────────────────────────────────────────────────────────────
const { connect } = require('./server/db/index')

async function bootstrap() {
  // 1. Establish database connection (retries 3x internally)
  await connect()
  logger.info('Database ready. Starting HTTP server...')

  const app = express()

  // 2. Global middlewares
  app.use(cors({ origin: '*' }))
  app.use(express.json({ limit: '10mb' }))
  app.use(loggerMiddleware)

  // 3. API Routes — all paths identical to original server.js
  app.use('/api/auth',      authRoutes)
  app.use('/api/products',  productsRoutes)
  app.use('/api/sales',     salesRoutes)
  app.use('/api/users',     usersRoutes)
  app.use('/api',           transfersRoutes)   // /api/sucursales, /api/accounts, /api/transfers
  app.use('/api',           settingsRoutes)    // /api/settings, /api/audit, /api/stats
  app.use('/api',           systemRoutes)      // /api/events, /api/health, /api/info, /api/logs

  // 4. Serve static Next.js frontend
  const POSSIBLE_OUT_PATHS = [
    path.join(__dirname, 'out'),
    path.join(__dirname, '..', 'out'),
    path.join(process.cwd(), 'out'),
    path.join(process.cwd(), 'resources', 'out'),
  ]

  const OUT_PATH = POSSIBLE_OUT_PATHS.find(p => fs.existsSync(p)) || path.join(__dirname, 'out')
  logger.info(`Serving static frontend from: ${OUT_PATH}`)

  app.use(express.static(OUT_PATH, {
    extensions: ['html'],
    index: 'index.html',
    redirect: false
  }))

  // Root redirect to POS login (same behavior as original)
  app.get('/', (req, res) => res.redirect('/store/login'))

  // SPA fallback
  app.get(/^((?!\/api\/).)*$/, (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Endpoint API no encontrado' })
    }
    const cleanPath  = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path
    const htmlPath   = path.join(OUT_PATH, cleanPath + '.html')
    if (fs.existsSync(htmlPath)) return res.sendFile(htmlPath)
    res.sendFile(path.join(OUT_PATH, 'index.html'))
  })

  // 5. Global error handler — MUST be last
  app.use(errorMiddleware)

  // 6. Start listening
  app.listen(config.PORT, '0.0.0.0', () => {
    logger.info(`Linux-Market API running on http://0.0.0.0:${config.PORT}`)
    logger.info(`Database: ${config.DB_PATH}`)
    logger.info('SSE real-time events: active')
  })
}

// Start — crash on unrecoverable error (fail-fast)
bootstrap().catch(err => {
  console.error('❌ FATAL: Server failed to start.', err.message)
  process.exit(1)
})
