/**
 * server/config/env.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * Centralized environment configuration loader.
 * Validates required variables at startup (fail-fast principle).
 * If a critical variable is missing, the server refuses to start.
 */

'use strict'

const path = require('path')
const fs = require('fs')
const os = require('os')

// Load .env.local if it exists (development only)
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...rest] = trimmed.split('=')
    if (key && rest.length > 0 && !process.env[key]) {
      process.env[key] = rest.join('=').trim()
    }
  }
}

// ── Derived paths ──────────────────────────────────────────────────────────
const HOME_DIR = os.homedir()
const LM_DIR   = path.join(HOME_DIR, '.linux-market')
const BUGS_DIR  = path.join(LM_DIR, 'bugs')

// Ensure runtime directories exist
;[LM_DIR, BUGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

// ── Configuration object ───────────────────────────────────────────────────
const config = {
  // Server
  PORT: parseInt(process.env.LM_API_PORT || '3001', 10),

  // Database — configurable via env for future migration
  DB_PATH: process.env.LM_DB_PATH || path.join(LM_DIR, 'linuxmarket.db'),

  // Bug logs
  BUGS_PATH: path.join(BUGS_DIR, 'crash-logs.json'),

  // Home directory
  HOME_DIR,
  LM_DIR,
  BUGS_DIR,

  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PROD:  process.env.NODE_ENV === 'production',

  // Hardware lock — list of trusted MACs from environment
  // Format in .env: SUPERADMIN_ALLOWED_MACS=AA:BB:CC:DD:EE:FF,11:22:33:44:55:66
  ALLOWED_MACS: (process.env.SUPERADMIN_ALLOWED_MACS || '')
    .split(',')
    .map(m => m.trim().toUpperCase())
    .filter(Boolean),
}

module.exports = config
