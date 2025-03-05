'use client'

import { useState, useEffect } from 'react'
import { fetchChats } from '@/lib/api'

type Chat = {
  id: string
  name: string
  type: 'group' | 'channel'
  members?: number
  subscribers?: number
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('Layout mounted')
    if (typeof window !== 'undefined') {
      console.log('Window object:', window?.Telegram)
      if (!window.Telegram?.WebApp) {
        console.log('Telegram WebApp not found')
        setError('This app must be opened from Telegram')
        setIsLoading(false)
        return
      }
      
      try {
        const initData = window.Telegram.WebApp.initData
        console.log('InitData:', initData)
        if (!initData) {
          console.log('No init data found')
          setError('Missing initialization data')
          setIsLoading(false)
          return
        }
        
        async function loadChats() {
          const webAppInitData = `Bearer ${initData}`
          console.log('Fetching chats with token:', webAppInitData)
          const data = await fetchChats(webAppInitData)
          console.log('Received chats:', data)
          setIsLoading(false)
        }
        loadChats()
      } catch (err) {
        console.error('Initialization error:', err)
        setError('Failed to initialize the app')
        setIsLoading(false)
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/70">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return <>{children}</>
} 