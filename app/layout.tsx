'use client'

import './globals.css'
import Script from 'next/script'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import TelegramThemeProvider from '@/components/TelegramThemeProvider'
import { useState, useEffect } from 'react'
import { fetchChats } from '@/lib/api'

type Chat = {
  id: string
  name: string
  type: 'group' | 'channel'
  members?: number
  subscribers?: number
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Robomod',
  description: 'A Telegram-inspired web application',
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chats, setChats] = useState<Chat[]>([])

  useEffect(() => {
    console.log('Layout mounted')
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      console.log('Window object:', window?.Telegram)
      // Check if Telegram WebApp is available
      if (!window.Telegram?.WebApp) {
        console.log('Telegram WebApp not found')
        setError('This app must be opened from Telegram')
        setIsLoading(false)
        return
      }
      
      // Initialize your app
      try {
        const initData = window.Telegram.WebApp.initData
        console.log('InitData:', initData)
        if (!initData) {
          console.log('No init data found')
          setError('Missing initialization data')
          setIsLoading(false)
          return
        }
        
        // Continue with your existing initialization
        async function loadChats() {
          const webAppInitData = `Bearer ${initData}`
          console.log('Fetching chats with token:', webAppInitData)
          const data = await fetchChats(webAppInitData)
          console.log('Received chats:', data)
          setChats(data || [])
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/70">Loading...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <html lang="en">
      <head>
        {/* Load Telegram Web App JS before interactive */}
        <Script 
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
          onError={(e) => {
            console.error('Failed to load Telegram WebApp script:', e);
          }}
          onLoad={() => {
            console.log('Telegram WebApp script loaded successfully');
          }}
        />
      </head>
      <body className={inter.className}>
        <TelegramThemeProvider />
        {children}
      </body>
    </html>
  )
}