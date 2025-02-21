'use client'

import { useEffect } from 'react'

export default function TelegramThemeProvider() {
  useEffect(() => {
    if (window?.Telegram?.WebApp?.themeParams) {
      const theme = window.Telegram.WebApp.themeParams
      
      // Set the main background color directly from Telegram's bg_color
      document.documentElement.style.setProperty('--background', theme.bg_color)
      document.documentElement.style.setProperty('--foreground', theme.text_color)
      
      // Set other colors
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
      
      // Set secondary colors
      document.documentElement.style.setProperty('--secondary', theme.secondary_bg_color || theme.bg_color)
      document.documentElement.style.setProperty('--secondary-foreground', theme.text_color)
      
      if (theme.hint_color) {
        document.documentElement.style.setProperty('--border', theme.hint_color)
        document.documentElement.style.setProperty('--input', theme.hint_color)
      }
      
      document.documentElement.style.setProperty('--ring', theme.text_color)

      // Force the body background to match Telegram's background
      document.body.style.backgroundColor = theme.bg_color
    }
  }, [])

  return null
} 