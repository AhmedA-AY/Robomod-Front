'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, Command, Puzzle, HelpCircle, Trophy, Shield, Video, Users, Globe, Calendar, MessageSquare, Menu, UserCircle2, Group } from 'lucide-react'
import AIChatInterface from '@/components/ui/AIChatInterface'
import ScheduledMessages from '@/components/ui/ScheduledMessages'
import { getModeratorChat } from '@/lib/api'

// Add this type definition
type Chat = {
  id: number;
  title: string;
  type: string;
  members?: number;
  subscribers?: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('ai')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedChat, setSelectedChat] = useState<number | null>(null)
  const [chats, setChats] = useState<Chat[]>([])

  useEffect(() => {
    async function loadChats() {
      const initData = window.Telegram?.WebApp?.initData || ''
      // Example: Using a placeholder user ID (123). Adjust as needed.
      const data = await getModeratorChat(initData)
      // Ensure we always set an array
      setChats(Array.isArray(data) ? data : [data])
    }
    loadChats()
  }, [])

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
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-bold text-primary tracking-tight">Robomod</h1>
            <p className="text-foreground/70">Select a group or channel to manage</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chats.map((chat) => (
              <Card 
                key={chat.id}
                className="hover:border-primary/50 cursor-pointer transition-colors"
                onClick={() => setSelectedChat(chat.id)}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  {chat.type === 'group' ? (
                    <Group className="w-12 h-12 text-primary" />
                  ) : (
                    <UserCircle2 className="w-12 h-12 text-primary" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground">{chat.title}</h3>
                    <p className="text-sm text-foreground/70">
                      {chat.type === 'group' 
                        ? `${chat.members?.toLocaleString()} members`
                        : `${chat.subscribers?.toLocaleString()} subscribers`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`bg-background border-r border-input/10 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-0'} md:w-64 overflow-hidden`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary tracking-tight">Robomod</h1>
          <p className="text-sm text-foreground/70 mt-1">
            {chats.find(chat => chat.id === selectedChat)?.title}
          </p>
        </div>
        <nav className="space-y-0.5 px-2">
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
          <Button
            variant="secondary"
            className="w-full justify-start text-foreground/80 hover:text-foreground mt-4 bg-primary/10 hover:bg-primary/20"
            onClick={() => setSelectedChat(null)}
          >
            <Users className="w-4 h-4" />
            <span className="ml-2 font-medium">Change Group/Channel</span>
          </Button>
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
          {activeTab === 'ai' && <AIChatInterface />}
          {activeTab === 'scheduled' && selectedChat && (
            <ScheduledMessages chatId={selectedChat.toString()} />
          )}
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