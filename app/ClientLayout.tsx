'use client'

import { useState, useEffect } from 'react'
import { getChatsModeratedByUser, getCurrentUserInfo } from '@/lib/api'
import { UserCircle2, Group, Loader2 } from 'lucide-react'
import { useChatContext } from './page'
import { motion } from 'framer-motion'

interface Chat {
  id: number;
  title: string;
  type: string;
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
        
        if (!initData) {
          console.log('No init data found')
          setError('Missing initialization data')
          setIsLoading(false)
          return
        }
        
        async function loadUserAndChats() {
          try {
            // First get current user info
            const userInfo = await getCurrentUserInfo(initData);
            console.log('User info:', userInfo);
            
            // Then get the user's moderated chats
            const chatsData = await getChatsModeratedByUser(initData);
            console.log('Received chats:', chatsData);
            
            // Transform the response to match our Chat type
            const transformedChats = chatsData.map((chat: any) => ({
              id: chat.chat_id,
              title: chat.name,
              type: chat.type.toLowerCase()
            }));
            
            setChats(transformedChats);
            setIsLoading(false);
          } catch (err) {
            console.error('Failed to load user data or chats:', err)
            setError('Failed to load your chat data')
            setIsLoading(false)
          }
        }
        
        loadUserAndChats()
      } catch (err) {
        console.error('Initialization error:', err)
        setError('Failed to initialize the app')
        setIsLoading(false)
      }
    }
  }, [])

  if (selectedChat) {
    return children; // Let the Home component handle everything
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-foreground/70 text-lg">Loading your chats...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-background">
        <div className="bg-destructive/10 p-6 rounded-lg max-w-md">
          <p className="text-destructive font-medium text-lg mb-2">Error</p>
          <p className="text-foreground/90">{error}</p>
        </div>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-background">
        <div className="bg-secondary/50 p-8 rounded-lg max-w-md">
          <h2 className="text-xl font-semibold mb-4">No Groups or Channels Found</h2>
          <p className="text-foreground/70">Make sure Robomod is added as an admin to your groups or channels.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-background">
      <div className="h-full flex flex-col">
        <div className="text-center py-6 px-4">
          <h1 className="text-3xl font-bold text-primary mb-2">Robomod</h1>
          <p className="text-foreground/70">Select a group or channel to manage</p>
        </div>
        
        <div className="flex-1 overflow-auto px-4 pb-5">
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
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
    </div>
  )
}