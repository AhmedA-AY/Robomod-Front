'use client'

import { createContext, useContext, useState } from 'react'
import { Button } from "@/components/ui/button"
import { MessageCircle, Command, Puzzle, HelpCircle, Trophy, Shield, Video, Users, Globe, Calendar, MessageSquare, Menu } from 'lucide-react'
import AIChatInterface from '@/components/ui/AIChatInterface'
import ScheduledMessages from '@/components/ui/ScheduledMessages'

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

export default function Home() {
  const [activeTab, setActiveTab] = useState('ai')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { selectedChat } = useChatContext()

  const tabs = [
    { id: 'ai', label: 'AI', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'commands', label: 'Commands', icon: <Command className="w-4 h-4" /> },
    { id: 'extensions', label: 'Extensions', icon: <Puzzle className="w-4 h-4" /> },
    { id: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'gamification', label: 'Gamification', icon: <Trophy className="w-4 h-4" /> },
    { id: 'gating', label: 'Gating', icon: <Shield className="w-4 h-4" /> },
    { id: 'livestream', label: 'Live Stream', icon: <Video className="w-4 h-4" /> },
    { id: 'moderators', label: 'Moderators', icon: <Users className="w-4 h-4" /> },
    { id: 'portal', label: 'Portal', icon: <Globe className="w-4 h-4" /> },
    { id: 'scheduled', label: 'Scheduled Posts', icon: <Calendar className="w-4 h-4" /> },
    { id: 'salutations', label: 'Salutations', icon: <MessageSquare className="w-4 h-4" /> },
  ]

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  if (!selectedChat) {
    return null; // Let ClientLayout handle the chat selection view
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`bg-background border-r border-input/10 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-0'} md:w-64 overflow-hidden`}>
        <nav className="space-y-0.5 px-2 py-4">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'secondary' : 'ghost'}
              className={`w-full justify-start text-foreground/80 hover:text-foreground ${
                activeTab === tab.id ? 'bg-background/50 text-foreground' : ''
              }`}
              onClick={() => {
                setActiveTab(tab.id)
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(false)
                }
              }}
            >
              {tab.icon}
              <span className="ml-2 font-medium">{tab.label}</span>
            </Button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-background">
        <header className="border-b border-input/10 p-6 flex items-center gap-4 bg-background">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="md:hidden hover:bg-background/50"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            {tabs.find(tab => tab.id === activeTab)?.icon}
            <h2 className="text-xl font-semibold text-foreground/90">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h2>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto bg-background">
          {activeTab === 'ai' && <AIChatInterface chatId={selectedChat.id} />}
          {activeTab === 'scheduled' && <ScheduledMessages chatId={selectedChat.id.toString()} />}
          {activeTab !== 'ai' && activeTab !== 'scheduled' && (
            <div className="text-foreground/80 space-y-4 max-w-4xl mx-auto">
              <p>Content for {tabs.find(tab => tab.id === activeTab)?.label} goes here.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}