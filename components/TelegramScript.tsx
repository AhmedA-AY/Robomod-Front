'use client'

import { useEffect, useState } from 'react'

export default function TelegramScript() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    const checkTelegramApp = () => {
      // Allow development mode without Telegram
      if (isDevelopment) {
        return
      }

      if (!window.Telegram?.WebApp) {
        setError('This app must be opened from Telegram')
        return
      }
      
      try {
        // Try to access Telegram WebApp properties
        const webApp = window.Telegram.WebApp
        if (!webApp.initData || !webApp.initDataUnsafe) {
          setError('Invalid Telegram Web App initialization')
          return
        }

        // Initialize WebApp
        // @ts-ignore - Telegram WebApp methods
        webApp.ready?.()
        // @ts-ignore - Telegram WebApp methods
        webApp.expand?.()
      } catch (error) {
        console.error('Telegram Web App initialization error:', error)
        setError('Failed to initialize Telegram Web App')
      }
    }

    // Initial check
    checkTelegramApp()

    // Retry a few times with increasing delays
    const retryTimes = [100, 500, 1000, 2000]
    retryTimes.forEach((delay) => {
      setTimeout(() => {
        if (!window.Telegram?.WebApp && !isDevelopment) {
          checkTelegramApp()
        }
      }, delay)
    })
  }, [])

  if (error && process.env.NODE_ENV !== 'development') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="bg-destructive/10 p-6 rounded-lg max-w-md text-center">
          <p className="text-destructive font-medium text-lg mb-2">Error</p>
          <p className="text-foreground/90">{error}</p>
          <p className="text-sm text-muted-foreground mt-4">
            Please open this application through Telegram
          </p>
        </div>
      </div>
    )
  }

  return null
} 