'use client'

import { useState, useEffect } from 'react'
import { getModeratorChat } from '@/lib/api'
import { UserCircle2, Group, Loader2 } from 'lucide-react'
import { useChatContext } from './page'
import { motion } from 'framer-motion'

interface Chat {
  id: number;
  title: string;
  type: string;
}

interface ModeratorChatResponse {
  chats: Array<{
    moderation_id: string;
    chat_id: number;
    name: string;
    type: string;
  }>;
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
  const { selectedChat, setSelectedChat } = useChatContext()

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
              const transformedChats = (data as ModeratorChatResponse).chats.map((chat) => ({
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

  if (selectedChat) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-background"
      >
        <div className="container mx-auto py-4 px-4 sm:px-6">
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-foreground/70 text-lg">Loading your chats...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-destructive/10 p-6 rounded-lg max-w-md">
          <p className="text-destructive font-medium text-lg mb-2">Error</p>
          <p className="text-foreground/90">{error}</p>
        </div>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-secondary/50 p-8 rounded-lg max-w-md">
          <h2 className="text-xl font-semibold mb-4">No Groups or Channels Found</h2>
          <p className="text-foreground/70">Make sure Robomod is added as an admin to your groups or channels.</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">Robomod</h1>
            <p className="text-foreground/70">Select a group or channel to manage</p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {chats.map((chat, index) => (
              <motion.div 
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-card hover:bg-card/80 border border-border hover:border-primary rounded-xl shadow-sm transition-all duration-200 transform hover:-translate-y-1 cursor-pointer overflow-hidden"
                onClick={() => setSelectedChat(chat)}
              >
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      {chat.type.includes('group') ? (
                        <Group className="w-8 h-8 text-primary" />
                      ) : (
                        <UserCircle2 className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{chat.title}</h3>
                      <p className="text-sm text-foreground/70 capitalize">
                        {chat.type.replace('super', '')}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}