/**
 * server/services/hardware.service.js
 * Author: Alexis Gabriel Lugo Villeda
 *
 * Isolated hardware detection service.
 * Previously embedded inside server.js's initApp() function.
 * Now testable, importable and independent.
 */

'use strict'

const os     = require('os')
const logger = require('./logger.service')

/**
 * Returns the primary MAC address of the system.
 * Prioritizes physical interfaces over virtual ones.
 * Returns 'UNKNOWN-MAC' only if no valid interface is found.
 *
 * @returns {string} MAC address in uppercase (e.g. "AA:BB:CC:DD:EE:FF")
 */
function getMacAddress() {
  const interfaces  = os.networkInterfaces()
  const validMacs   = []

  logger.debug('Detecting network interfaces for hardware lock...')

  for (const name in interfaces) {
    const iface = interfaces[name].find(
      i => !i.internal && i.mac && i.mac !== '00:00:00:00:00:00'
    )
    if (iface) {
      validMacs.push({ name, mac: iface.mac.toUpperCase() })
    }
    const addresses = interfaces[name].map(i => i.mac).join(', ')
    logger.debug(`Interface found: ${name} → ${addresses}`)
  }

  // Sort alphabetically for stability across reboots
  validMacs.sort((a, b) => a.name.localeCompare(b.name))

  if (validMacs.length > 0) {
    const principal = validMacs[0]
    logger.info(`Hardware lock MAC selected: ${principal.mac} (${principal.name})`)
    return principal.mac
  }

  logger.warn('No valid external network interface detected. Using UNKNOWN-MAC.')
  return 'UNKNOWN-MAC'
}

/**
 * Checks whether the current MAC is among the set of explicitly trusted MACs
 * loaded from the SUPERADMIN_ALLOWED_MACS environment variable.
 * This replaces the file-based bypass mechanism.
 *
 * @param {string} currentMac
 * @param {string[]} allowedMacs — list from config.ALLOWED_MACS
 * @returns {boolean}
 */
function isTrustedMac(currentMac, allowedMacs) {
  if (!allowedMacs || allowedMacs.length === 0) return false
  return allowedMacs.includes(currentMac.toUpperCase())
}

module.exports = { getMacAddress, isTrustedMac }
