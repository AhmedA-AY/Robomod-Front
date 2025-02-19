'use client'

import { useEffect } from 'react'

export default function TelegramThemeProvider() {
  useEffect(() => {
    if (window?.Telegram?.WebApp?.themeParams) {
      const theme = window.Telegram.WebApp.themeParams
      // Set background and text colors
      document.documentElement.style.setProperty('--background', theme.bg_color)
      document.documentElement.style.setProperty('--foreground', theme.text_color)
      document.documentElement.style.setProperty('--card', theme.bg_color)
      document.documentElement.style.setProperty('--card-foreground', theme.text_color)
      document.documentElement.style.setProperty('--popover', theme.bg_color)
      document.documentElement.style.setProperty('--popover-foreground', theme.text_color)
      
      // Use the Telegram button colors for primary UI elements
      if (theme.button_color) {
        document.documentElement.style.setProperty('--primary', theme.button_color)
      }
      if (theme.button_text_color) {
        document.documentElement.style.setProperty('--primary-foreground', theme.button_text_color)
      }
      
      // Secondary color: if Telegram provides a secondary background we use it; otherwise fallback to bg_color
      document.documentElement.style.setProperty('--secondary', theme.secondary_bg_color || theme.bg_color)
      document.documentElement.style.setProperty('--secondary-foreground', theme.text_color)
      
      // Use hint_color as a border/input color if available
      if (theme.hint_color) {
        document.documentElement.style.setProperty('--border', theme.hint_color)
        document.documentElement.style.setProperty('--input', theme.hint_color)
      }
      
      // For ring color, we simply use the text color
      document.documentElement.style.setProperty('--ring', theme.text_color)
    }
  }, [])

  return null
} 