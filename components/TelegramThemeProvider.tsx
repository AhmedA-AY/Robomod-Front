'use client'

import { useEffect, useState } from 'react'

export default function TelegramThemeProvider() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (window?.Telegram?.WebApp?.themeParams) {
      const theme = window.Telegram.WebApp.themeParams
      
      // Set CSS variables for theme
      const root = document.documentElement
      root.style.setProperty('--background', theme.bg_color)
      root.style.setProperty('--foreground', theme.text_color)
      root.style.setProperty('--card', theme.bg_color)
      root.style.setProperty('--card-foreground', theme.text_color)
      root.style.setProperty('--popover', theme.bg_color)
      root.style.setProperty('--popover-foreground', theme.text_color)
      
      if (theme.button_color) {
        root.style.setProperty('--primary', theme.button_color)
      }
      if (theme.button_text_color) {
        root.style.setProperty('--primary-foreground', theme.button_text_color)
      }
      
      root.style.setProperty('--secondary', theme.secondary_bg_color || theme.bg_color)
      root.style.setProperty('--secondary-foreground', theme.text_color)
      
      if (theme.hint_color) {
        root.style.setProperty('--border', theme.hint_color)
        root.style.setProperty('--input', theme.hint_color)
      }
      
      root.style.setProperty('--ring', theme.text_color)
    }
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering anything on server
  if (!mounted) {
    return null
  }

  return null
} 