'use client'

import { useEffect, useState } from 'react'

export default function TelegramScript() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkTelegramApp = () => {
      if (!window.Telegram?.WebApp) {
        setError('This app must be opened from Telegram')
        return
      }
      
      try {
        // Try to access Telegram WebApp properties
        const { initData, initDataUnsafe } = window.Telegram.WebApp
        if (!initData || !initDataUnsafe) {
          setError('Invalid Telegram Web App initialization')
        }
      } catch (e) {
        setError('Failed to initialize Telegram Web App')
      }
    }

    // Check immediately
    checkTelegramApp()

    // Also check after a short delay to ensure script has loaded
    const timeoutId = setTimeout(checkTelegramApp, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  if (error) {
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