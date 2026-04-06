/**
 * __tests__/auth.test.js
 * Integration tests for Auth module and JWT Middleware.
 */

const assert = require('assert')
const jwt = require('jsonwebtoken')
const { signToken, authMiddleware } = require('../server/middlewares/auth.middleware')

async function runAuthTests() {
  console.log('--- RUNNING AUTH TESTS ---')
  
  // 1. Test JWT Serialization
  const mockUser = { id: 1, username: 'test_admin', role: 'admin_general' }
  const token = signToken(mockUser)
  
  assert.ok(token, 'signToken should return a string token')
  assert.equal(token.split('.').length, 3, 'Token should be a valid 3-part JWT')
  
  // 2. Test Middleware passes public routes without token
  let nextCalled = false
  const reqPublic = { path: '/api/auth/login' }
  const resEmpty = {
    status: () => ({ json: () => {} })
  }
  
  authMiddleware(reqPublic, resEmpty, () => { nextCalled = true })
  assert.ok(nextCalled, 'Middleware should skip public paths')
  
  // 3. Test Middleware blocks protected route without token
  let blockStatus = 0
  const reqProtectedNoToken = { path: '/api/users', headers: {}, method: 'GET', connection: {} }
  const resBlock = {
    status: (s) => ({
      json: (data) => { blockStatus = s }
    })
  }
  
  authMiddleware(reqProtectedNoToken, resBlock, () => { throw new Error('Should not reach next') })
  assert.equal(blockStatus, 401, 'Middleware should return 401 when no token is provided')
  
  // 4. Test Middleware accepts protected route with valid token
  let authInjected = null
  const reqProtectedValid = { 
    path: '/api/users', 
    headers: { 'authorization': `Bearer ${token}` }, 
    method: 'GET' 
  }
  
  authMiddleware(reqProtectedValid, {}, () => { authInjected = reqProtectedValid.auth })
  
  assert.ok(authInjected, 'req.auth should be populated by middleware')
  assert.equal(authInjected.username, 'test_admin', 'req.auth should decode JWT payload')
  
  console.log('✅ Auth tests passed.')
}

runAuthTests().catch(err => {
  console.error('❌ Auth tests failed:', err)
  process.exit(1)
})
