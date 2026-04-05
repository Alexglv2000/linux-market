import { NextRequest, NextResponse } from 'next/server'

// Super Admin authentication — MAC-address gated, .env.local controlled
// Only accessible from pre-approved MAC addresses configured in .env.local

const ALLOWED_MACS = (process.env.SUPERADMIN_ALLOWED_MACS || '').split(',').map(m => m.trim().toLowerCase()).filter(Boolean)
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || ''
const SUPERADMIN_USERNAME = process.env.SUPERADMIN_USERNAME || 'superadmin'
const SESSION_SECRET = process.env.SUPERADMIN_SESSION_SECRET || 'change-this-in-production-env'

function generateSessionToken(mac: string): string {
  const payload = `${mac}:${Date.now()}:${SESSION_SECRET}`
  // Simple base64 encoding — in production replace with JWT + crypto
  return Buffer.from(payload).toString('base64url')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, clientMac } = body

    // 1. Validate required fields
    if (!username || !password || !clientMac) {
      return NextResponse.json(
        { error: 'Credenciales incompletas' },
        { status: 400 }
      )
    }

    // 2. Check environment is configured
    if (!SUPERADMIN_PASSWORD || ALLOWED_MACS.length === 0) {
      return NextResponse.json(
        { error: 'Super Admin no configurado. Revisa tu .env.local' },
        { status: 503 }
      )
    }

    // 3. Validate MAC address
    const normalizedMac = clientMac.toLowerCase().trim()
    if (!ALLOWED_MACS.includes(normalizedMac)) {
      // Log unauthorized attempt (server side)
      console.warn(`[SuperAdmin] Unauthorized MAC attempt: ${normalizedMac} at ${new Date().toISOString()}`)
      return NextResponse.json(
        { error: 'Dispositivo no autorizado' },
        { status: 403 }
      )
    }

    // 4. Validate credentials
    if (username !== SUPERADMIN_USERNAME || password !== SUPERADMIN_PASSWORD) {
      console.warn(`[SuperAdmin] Failed login attempt from MAC: ${normalizedMac}`)
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    // 5. Issue session token
    const token = generateSessionToken(normalizedMac)
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours

    console.log(`[SuperAdmin] Successful login from MAC: ${normalizedMac}`)

    const response = NextResponse.json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        username: SUPERADMIN_USERNAME,
        role: 'superadmin',
        mac: normalizedMac,
      }
    })

    // Set HTTP-only cookie for extra security
    response.cookies.set('sa_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiresAt,
      path: '/superadmin',
    })

    return response
  } catch (error) {
    console.error('[SuperAdmin] Auth error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  // Logout
  const response = NextResponse.json({ success: true })
  response.cookies.delete('sa_session')
  return response
}
