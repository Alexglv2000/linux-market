'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type User } from './db'
import { useRouter } from 'next/navigation'
import { authApi, setStoredToken, clearStoredToken } from './api'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string, force?: boolean) => Promise<boolean>
  logout: () => void
  updateProfile: (updatedUser: User) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('linuxmarket_user')
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
        // Validate the stored object has minimum required fields
        if (parsed?.id && parsed?.username && parsed?.role) {
          setUser(parsed)
        } else {
          localStorage.removeItem('linuxmarket_user')
        }
      }
    } catch {
      // Corrupt localStorage entry — clear it
      localStorage.removeItem('linuxmarket_user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string, force: boolean = false): Promise<boolean> => {
    if (!username?.trim() || !password?.trim()) return false
    
    try {
      const result = await authApi.login(username.trim(), password, force)
      const userWithoutPassword = result.user
      setUser(userWithoutPassword)
      localStorage.setItem('linuxmarket_user', JSON.stringify(userWithoutPassword))
      // Store JWT so all subsequent API calls are authenticated
      if (result.token) setStoredToken(result.token)
      return true
    } catch (error: any) {
      console.error('[LinuxMarket] Login error:', error)
      // Propagate the specific error instead of just returning false
      throw error
    }
  }

  const logout = async () => {
    setUser(null)
    try {
      localStorage.removeItem('linuxmarket_user')
      clearStoredToken()  // Invalidate the JWT on the client side
    } catch { /* SSR safety */ }
    router.push('/store/login')
  }

  const updateProfile = (updatedUser: User) => {
    setUser(updatedUser)
    try { localStorage.setItem('linuxmarket_user', JSON.stringify(updatedUser)) } catch { }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
