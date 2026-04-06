/**
 * server/middlewares/auth.middleware.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * JWT authentication middleware.
 * Protects all /api/* routes except /api/auth/login and /api/health.
 *
 * Flow:
 *   1. Client calls POST /api/auth/login → receives { user, token }
 *   2. Client stores token in localStorage
 *   3. Client sends Authorization: Bearer <token> on every request
 *   4. This middleware validates the token before the request reaches any route
 *
 * BACKWARD COMPATIBILITY:
 *   - /api/auth/login   — always public (needed to obtain a token)
 *   - /api/health       — always public (monitoring, no data exposure)
 *   - /api/events (SSE) — public (EventSource API cannot set custom headers)
 *   - All other routes  — require valid JWT
 */

'use strict'

const jwt    = require('jsonwebtoken')
const config = require('../config/env')
const logger = require('../services/logger.service')

// ── Routes that don't require a token ──────────────────────────────────────
const PUBLIC_PATHS = new Set([
  '/api/auth/login',   // login endpoint — token not yet obtained
  '/api/health',       // health check — no sensitive data
  '/api/events',       // SSE — EventSource cannot set headers
  '/api/system/info',  // Hardware lock MAC address fetch before login
  '/api/settings',     // Store settings (logo, branding) fetch before login
])

/**
 * Validates the JWT Bearer token on every incoming request.
 * Injects req.auth = { id, username, role } on success.
 */
function authMiddleware(req, res, next) {
  // Bypass middleware for non-API paths (static files, Next.js pages)
  if (!req.path.startsWith('/api/')) return next()

  // Always allow public API paths
  if (PUBLIC_PATHS.has(req.path)) return next()

  // Extract token from Authorization header
  const header = req.headers['authorization']
  if (!header || !header.startsWith('Bearer ')) {
    logger.warn(`[Auth Middleware] No token on ${req.method} ${req.path}`, {
      ip: req.ip || req.connection.remoteAddress
    })
    return res.status(401).json({ error: 'Acceso no autorizado: se requiere token de sesión.' })
  }

  const token = header.slice(7) // Remove 'Bearer '

  try {
    const payload = jwt.verify(token, getJwtSecret())
    req.auth = payload   // Inject { id, username, role } into request
    next()
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError'
    logger.warn(`[Auth Middleware] Invalid token on ${req.method} ${req.path}`, {
      reason: err.name,
      ip: req.ip
    })
    return res.status(401).json({
      error: isExpired
        ? 'Sesión expirada. Por favor inicia sesión nuevamente.'
        : 'Token de sesión inválido.'
    })
  }
}

/**
 * Returns the JWT secret from config/env.
 * Falls back to a generated-at-runtime secret in development.
 * In production, LM_JWT_SECRET MUST be set as an env variable.
 */
function getJwtSecret() {
  if (config.JWT_SECRET) return config.JWT_SECRET
  if (config.IS_PROD) {
    // Crash fast in production if the secret is not set
    throw new Error('FATAL: LM_JWT_SECRET environment variable is not set in production.')
  }
  // Development fallback — NOT safe for production
  return 'linux-market-dev-secret-change-in-prod'
}

/**
 * Signs a new JWT for the given user payload.
 * Called by auth.routes.js after successful login.
 *
 * @param {{ id: number, username: string, role: string }} user
 * @returns {string} signed JWT
 */
function signToken(user) {
  const secret = getJwtSecret()
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    secret,
    { expiresIn: '12h' }  // Sessions expire after 12 hours — POS shift duration
  )
}

module.exports = { authMiddleware, signToken }
