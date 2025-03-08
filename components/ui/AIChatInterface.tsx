'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

interface AIChatInterfaceProps {
  chatId?: number;
}

export default function AIChatInterface({ chatId }: AIChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  const handleSendMessage = () => {
    if (!message.trim()) return
    
    // Add user message
    const newMessages = [...messages, { role: 'user' as const, content: message }]
    setMessages(newMessages)
    setMessage('')
    
    // Simulate AI response
    setTimeout(() => {
      setMessages([
        ...newMessages,
        { 
          role: 'assistant' as const, 
          content: `This is a simulated response for chat ID: ${chatId || 'unknown'}. In a real implementation, this would call an API with the chat ID.` 
        }
      ])
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-foreground/70 py-8">
            <p>Start a conversation with the AI assistant</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg max-w-[80%] ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground ml-auto' 
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
      </div>
      <div className="border-t border-input p-4">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="resize-none"
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}