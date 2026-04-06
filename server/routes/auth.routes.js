/**
 * server/routes/auth.routes.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * Authentication endpoints.
 * - POST /api/auth/login
 * - POST /api/auth/profile
 *
 * SECURITY FIXES (FASE 1):
 * 1. REMOVED hardcoded backdoor password 'admin-root-2026'
 * 2. REMOVED file-based (.linux-market-bypass) hardware bypass
 * 3. Hardware trust is now ONLY via SUPERADMIN_ALLOWED_MACS env variable
 * 4. Events broadcast ONLY after confirmed DB writes
 *
 * All endpoint paths and response shapes are IDENTICAL to the original server.js.
 */

'use strict'

const express   = require('express')
const bcrypt    = require('bcryptjs')
const router    = express.Router()
const config    = require('../config/env')
const logger    = require('../services/logger.service')
const broadcast = require('../services/broadcast.service')
const { getMacAddress, isTrustedMac } = require('../services/hardware.service')
const repo      = require('../db/repository')

// Resolve MAC once at module load (stable per process lifetime)
const SERVER_MAC = getMacAddress()

// ── POST /api/auth/login ─────────────────────────────────────────────────
router.post('/login', (req, res) => {
  try {
    const { username, password, force } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Credenciales requeridas' })
    }

    // 1. Find active user
    const user = repo.findOne('users', 'username = ? AND isActive = 1', [username.trim()])
    if (!user) {
      logger.warn(`[Auth] Login failed: user not found (${username})`)
      return res.status(401).json({ error: 'Usuario no encontrado' })
    }

    // 2. Validate password with bcrypt — NO BACKDOORS
    const match = bcrypt.compareSync(password, user.password)
    if (!match) {
      logger.warn(`[Auth] Login failed: wrong password for ${username}`)
      return res.status(401).json({ error: 'Contraseña incorrecta' })
    }

    // 3. Hardware lock validation
    const isAdmin = user.role === 'admin_general' || user.role === 'superuser'
    const allowedMacRow = repo.findOne('system_settings', 'key = ?', ['allowed_mac'])
    let currentAllowedMac = allowedMacRow ? allowedMacRow.value : 'ANY'

    // Auto-register MAC on first run
    if (currentAllowedMac === 'auto' && SERVER_MAC !== 'UNKNOWN-MAC') {
      repo.run('UPDATE system_settings SET value = ? WHERE key = ?', [SERVER_MAC, 'allowed_mac'])
      currentAllowedMac = SERVER_MAC
      logger.info(`Hardware Lock initialized: ${SERVER_MAC}`)
    }

    // Admin force-reset of hardware lock (replaces file bypass — now requires valid login)
    if (isAdmin && force && SERVER_MAC !== 'UNKNOWN-MAC') {
      repo.run('UPDATE system_settings SET value = ? WHERE key = ?', [SERVER_MAC, 'allowed_mac'])
      currentAllowedMac = SERVER_MAC
      logger.warn(`[Force] Hardware Lock reset by ${username} to MAC: ${SERVER_MAC}`)
    }

    const isLocked =
      currentAllowedMac &&
      currentAllowedMac !== 'auto' &&
      currentAllowedMac !== 'ANY' &&
      SERVER_MAC !== 'UNKNOWN-MAC' &&
      currentAllowedMac !== SERVER_MAC &&
      !isTrustedMac(SERVER_MAC, config.ALLOWED_MACS) // env-based whitelist replaces file bypass

    if (isLocked) {
      if (!isAdmin) {
        logger.warn(`[Auth] Hardware lock blocked ${username}. Current: ${SERVER_MAC}, Locked: ${currentAllowedMac}`)
        return res.status(403).json({
          error: 'ERROR DE HARDWARE: Este sistema está bloqueado para un equipo específico.',
          macDetected: SERVER_MAC,
          macAllowed: currentAllowedMac,
          isSuperuser: false
        })
      } else {
        logger.warn(`[Auth] Admin ${username} on unauthorized hardware. Current: ${SERVER_MAC}`)
        return res.status(403).json({
          error: 'HARDWARE_RESTRINGIDO',
          message: 'Hardware no autorizado para el administrador. Use el switch "Forzar Reset" para recuperar acceso.',
          macDetected: SERVER_MAC,
          macAllowed: currentAllowedMac,
          isSuperuser: true
        })
      }
    }

    // 4. Audit log + respond (strip password from response)
    const { password: _pw, ...safe } = user
    repo.run(
      'INSERT INTO audit_logs (userId, username, action, entity, entityId, changes) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.username, 'login', 'auth', String(user.id), JSON.stringify({ role: user.role })]
    )

    logger.info(`[Auth] Login successful: ${username} (${user.role})`)
    res.json({ user: safe })

  } catch (err) {
    logger.safeError('[Auth Login]', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ── POST /api/auth/profile ───────────────────────────────────────────────
router.post('/profile', (req, res) => {
  try {
    const { id, currentPassword, newUsername, newPassword, newName, newEmail } = req.body

    if (!id || !currentPassword) {
      return res.status(400).json({ error: 'Datos incompletos: Se requiere ID y contraseña actual.' })
    }

    const user = repo.findOne('users', 'id = ?', [id])
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' })
    }

    const updates = []
    const params  = []

    if (newUsername?.trim()) { updates.push('username=?');                  params.push(newUsername.trim()) }
    if (newPassword?.trim()) { updates.push('password=?');                  params.push(bcrypt.hashSync(newPassword, 10)) }
    if (newName?.trim())     { updates.push('name=?');                      params.push(newName.trim()) }
    if (newEmail?.trim())    { updates.push('email=?');                     params.push(newEmail.trim()) }

    if (updates.length > 0) {
      updates.push("updatedAt=datetime('now')")
      params.push(id)
      repo.run(`UPDATE users SET ${updates.join(',')} WHERE id=?`, params)

      const updatedUser = repo.queryOne(
        'SELECT id,username,name,role,email,sucursalId,celulaId,isActive,createdAt FROM users WHERE id = ?',
        [id]
      )

      // Broadcast AFTER confirmed DB write
      broadcast.broadcast('user_updated', updatedUser)
      return res.json({ success: true, user: updatedUser })
    }

    res.json({ success: true, message: 'Sin cambios realizados' })

  } catch (err) {
    if (err.message?.includes('UNIQUE constraint failed: users.username')) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso por otro empleado.' })
    }
    logger.safeError('[Auth Profile]', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
