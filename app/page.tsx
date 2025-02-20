'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { MessageCircle, Command, Puzzle, HelpCircle, Trophy, Shield, Video, Users, Globe, Calendar, MessageSquare, Menu } from 'lucide-react'
import AIChatInterface from '@/components/ui/AIChatInterface'

export default function Home() {
  const [activeTab, setActiveTab] = useState('ai')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`bg-background shadow-md transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-0'} md:w-64 overflow-hidden`}>
        <div className="p-4">
          <h1 className="text-2xl font-bold text-primary">Robomod</h1>
        </div>
        <nav>
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => {
                setActiveTab(tab.id)
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(false)
                }
              }}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </Button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-background shadow-md p-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden mr-2">
            <Menu className="h-6 w-6" />
          </Button>
          <h2 className="text-2xl font-bold text-primary">{tabs.find(tab => tab.id === activeTab)?.label}</h2>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          {activeTab === 'ai' && <AIChatInterface />}
          {activeTab !== 'ai' && (
            <div>
              <p>Content for {tabs.find(tab => tab.id === activeTab)?.label} goes here.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}