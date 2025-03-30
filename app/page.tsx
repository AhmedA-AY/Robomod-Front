'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { MessageCircle, MessageSquare, Menu, HelpCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Chat {
  id: number;
  title: string;
  type: string;
  members?: number;
  subscribers?: number;
}

interface ChatContextType {
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat | null) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  return (
    <ChatContext.Provider value={{ selectedChat, setSelectedChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

// Dynamically import components with ssr: false to avoid hydration issues
const AIChatInterface = dynamic(() => import('@/components/ui/AIChatInterface'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" /></div>
})
const ScheduledMessages = dynamic(() => import('@/components/ui/ScheduledMessages'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" /></div>
})
const FaqSettings = dynamic(() => import('@/components/ui/FaqSettings'), { 
  ssr: false, 
  loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" /></div>
})
const GreetingSettings = dynamic(() => import('@/components/ui/GreetingSettings'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" /></div>
})
const GoodbyeSettings = dynamic(() => import('@/components/ui/GoodbyeSettings'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" /></div>
})

export default function Home() {
  const [activeTab, setActiveTab] = useState('ai')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { selectedChat, setSelectedChat } = useChatContext()

  // Fix hydration issues by only rendering after component mounts
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const tabs = [
    { id: 'ai', label: 'AI Assistant', icon: <MessageCircle className="w-5 h-5" />, color: 'text-blue-500' },
    { id: 'scheduled', label: 'Scheduled Posts', icon: <MessageSquare className="w-5 h-5" />, color: 'text-emerald-500' },
    { id: 'faq', label: 'FAQ Settings', icon: <HelpCircle className="w-5 h-5" />, color: 'text-amber-500' },
    { id: 'greeting', label: 'Greeting', icon: <MessageCircle className="w-5 h-5" />, color: 'text-purple-500' },
    { id: 'goodbye', label: 'Goodbye', icon: <MessageSquare className="w-5 h-5" />, color: 'text-pink-500' },
  ]

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  if (!selectedChat || !isMounted) {
    return null; // Prevent rendering until mounted and chat selected
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? '100%' : typeof window !== 'undefined' && window.innerWidth >= 768 ? '20rem' : '0rem',
          position: typeof window !== 'undefined' && window.innerWidth < 768 ? 'fixed' : 'relative',
          left: 0,
          top: 0,
          height: '100%',
          zIndex: 50
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-screen bg-card overflow-hidden flex flex-col"
      >
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar} 
              className="md:hidden absolute right-4 top-4"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Avatar>
              <div className="bg-primary/10 w-full h-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
            </Avatar>
            <div className="overflow-hidden">
              <h2 className="font-semibold text-lg truncate">{selectedChat.title}</h2>
              <p className="text-sm text-muted-foreground capitalize">{selectedChat.type.replace('super', '')}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4"
            onClick={() => setSelectedChat(null)}
          >
            Change Chat
          </Button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                className={`w-full justify-start text-left h-12 ${activeTab === tab.id ? 'bg-secondary' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (window.innerWidth < 768) {
                    setIsSidebarOpen(false)
                  }
                }}
              >
                <span className={`mr-3 ${tab.color}`}>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </Button>
            ))}
          </div>
        </nav>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <header className="h-16 min-h-16 border-b border-border flex items-center gap-2 px-4 bg-card/50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <span className={`${tabs.find(tab => tab.id === activeTab)?.color}`}>
              {tabs.find(tab => tab.id === activeTab)?.icon}
            </span>
            <h1 className="font-semibold text-lg">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h1>
          </div>
        </header>
        
        <AnimatePresence mode="wait">
          <motion.main 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden"
          >
            {activeTab === 'ai' && <AIChatInterface chatId={selectedChat.id} />}
            {activeTab === 'scheduled' && <ScheduledMessages chatId={selectedChat.id.toString()} />}
            {activeTab === 'faq' && <FaqSettings chatId={selectedChat.id.toString()} />}
            {activeTab === 'greeting' && <GreetingSettings chatId={selectedChat.id.toString()} />}
            {activeTab === 'goodbye' && <GoodbyeSettings chatId={selectedChat.id.toString()} />}
            {activeTab !== 'ai' && activeTab !== 'scheduled' && activeTab !== 'faq' && 
             activeTab !== 'greeting' && activeTab !== 'goodbye' && (
              <div className="h-full flex items-center justify-center p-4">
                <div className="text-foreground/80 bg-card/30 rounded-xl p-8 max-w-4xl border border-border">
                  <div className="flex flex-col items-center justify-center text-center gap-4">
                    <div className={`p-4 rounded-full ${tabs.find(tab => tab.id === activeTab)?.color} bg-background/50`}>
                      {tabs.find(tab => tab.id === activeTab)?.icon}
                    </div>
                    <h3 className="text-xl font-medium">
                      {tabs.find(tab => tab.id === activeTab)?.label} Feature
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      This feature will let you manage {tabs.find(tab => tab.id === activeTab)?.label.toLowerCase()} for {selectedChat.title}.
                    </p>
                    <Button className="mt-2">
                      Configure {tabs.find(tab => tab.id === activeTab)?.label}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  )
}