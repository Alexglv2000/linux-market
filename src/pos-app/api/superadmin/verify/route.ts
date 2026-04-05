import { NextRequest, NextResponse } from 'next/server'

const SESSION_SECRET = process.env.SUPERADMIN_SESSION_SECRET || 'change-this-in-production-env'
const ALLOWED_MACS = (process.env.SUPERADMIN_ALLOWED_MACS || '').split(',').map(m => m.trim().toLowerCase()).filter(Boolean)

export async function POST(request: NextRequest) {
  try {
    const { token, clientMac } = await request.json()

    if (!token || !clientMac) {
      return NextResponse.json({ valid: false, error: 'Token o MAC faltante' }, { status: 400 })
    }

    // Verify MAC still allowed
    if (!ALLOWED_MACS.includes(clientMac.toLowerCase())) {
      return NextResponse.json({ valid: false, error: 'MAC no autorizada' }, { status: 403 })
    }

    // Decode and verify token
    try {
      const decoded = Buffer.from(token, 'base64url').toString()
      const [mac, timestamp, secret] = decoded.split(':')

      if (secret !== SESSION_SECRET) {
        return NextResponse.json({ valid: false, error: 'Token inválido' }, { status: 401 })
      }

      // Check expiry (8 hours)
      const tokenAge = Date.now() - parseInt(timestamp)
      if (tokenAge > 8 * 60 * 60 * 1000) {
        return NextResponse.json({ valid: false, error: 'Sesión expirada' }, { status: 401 })
      }

      if (mac !== clientMac.toLowerCase()) {
        return NextResponse.json({ valid: false, error: 'MAC no coincide con token' }, { status: 403 })
      }

      return NextResponse.json({ valid: true })
    } catch {
      return NextResponse.json({ valid: false, error: 'Token malformado' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Error de servidor' }, { status: 500 })
  }
}
