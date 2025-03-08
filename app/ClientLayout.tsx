'use client'

import { useState, useEffect } from 'react'
import { getModeratorChat } from '@/lib/api'
interface Chat {
  id: number
}

interface TelegramWebApp {
  ready: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
  };
  themeParams: {
    bg_color: string;
    text_color: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    hint_color?: string;
  };
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chats, setChats] = useState<Chat[]>([])

  useEffect(() => {
    console.log('Layout mounted')
    if (typeof window !== 'undefined') {
      const tg = window.Telegram?.WebApp as TelegramWebApp | undefined
      console.log('Window object:', window?.Telegram)
      
      if (!tg) {
        console.log('Telegram WebApp not found')
        setError('This app must be opened from Telegram')
        setIsLoading(false)
        return
      }
      
      try {
        tg.ready()
        const initData = tg.initData
        console.log('InitData:', initData)
        console.log('InitDataUnsafe:', tg.initDataUnsafe)
        
        if (!initData || !tg.initDataUnsafe.user?.id) {
          console.log('No init data or user found')
          setError('Missing initialization data')
          setIsLoading(false)
          return
        }
        
        async function loadChats() {
          try {
            if (tg && tg.initDataUnsafe.user?.id) {
              const userId = tg.initDataUnsafe.user.id;
              const data = await getModeratorChat(initData, userId);
              console.log('Received chats:', data);
              
              // Transform the response to match our Chat type
              const transformedChats = data.chats.map((chat: any) => ({
                id: chat.chat_id,
                title: chat.name,
                type: chat.type.toLowerCase()
              }));
              
              setChats(transformedChats);
              setIsLoading(false);
            } else {
              setError('User ID not available');
              setIsLoading(false);
            }
          } catch (err) {
            console.error('Failed to load chats:', err)
            setError('Failed to load chats')
            setIsLoading(false)
          }
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
        <p className="text-foreground/70">Loading your chats...</p>
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

  if (chats.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/70">No groups or channels found. Make sure Robomod is added as an admin to your groups or channels.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Your Chats</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chats.map((chat) => (
              <div 
                key={chat.id} 
                className="p-4 rounded-lg bg-card border border-border hover:border-primary transition-colors"
              >
              </div>
            ))}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}