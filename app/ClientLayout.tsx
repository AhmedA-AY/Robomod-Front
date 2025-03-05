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
  const [chats, setChats] = useState<Chat[]>([])

  useEffect(() => {
    console.log('Layout mounted')
    // ... rest of your useEffect code ...
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