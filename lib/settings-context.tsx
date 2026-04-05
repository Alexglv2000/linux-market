'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { settingsApi, connectRealtime, RealtimeEvent } from '@/lib/api'
import { useTheme } from 'next-themes'

interface AppSettings {
  theme_primary?: string
  theme_accent?: string
  global_logo_url?: string
  transparent_bg?: string
  [key: string]: any
}

interface SettingsContextType {
  settings: AppSettings
  loading: boolean
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType>({ 
  settings: {}, 
  loading: true, 
  refreshSettings: async () => {} 
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({})
  const [loading, setLoading] = useState(true)
  const { setTheme, theme } = useTheme()

  const fetchAndApplySettings = async () => {
    try {
      const data = await settingsApi.get()
      setSettings(data)

      // Color syncing
      if (data.theme_primary) {
        document.documentElement.style.setProperty('--primary', data.theme_primary)
      }
      if (data.theme_accent) {
        document.documentElement.style.setProperty('--accent', data.theme_accent)
      }
      
      // Global Theme combining
      if (data.global_theme) {
        if (theme !== data.global_theme) {
          setTheme(data.global_theme)
        }
      }

      // App transparency
      if (data.transparent_bg === 'true') {
        document.documentElement.classList.add('bg-transparent')
        document.body.classList.add('bg-transparent')
      } else {
        document.documentElement.classList.remove('bg-transparent')
        document.body.classList.remove('bg-transparent')
      }

    } catch (e) {
      console.error('Failed to load global settings', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAndApplySettings()
    const d = connectRealtime((e: RealtimeEvent, data: any) => {
      if (e === 'settings_updated') {
        fetchAndApplySettings()
      }
    })
    return () => d()
  }, [theme, setTheme])

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchAndApplySettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
