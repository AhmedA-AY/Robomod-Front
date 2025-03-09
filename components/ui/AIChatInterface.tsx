'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'

interface AIChatInterfaceProps {
  chatId?: number;
}

export default function AIChatInterface({ chatId }: AIChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!message.trim()) return
    
    // Add user message
    const newMessages = [...messages, { role: 'user' as const, content: message }]
    setMessages(newMessages)
    setMessage('')
    
    // Simulate AI typing
    setIsTyping(true)
    
    // Simulate AI response with a more natural delay
    setTimeout(() => {
      setIsTyping(false)
      setMessages([
        ...newMessages,
        { 
          role: 'assistant' as const, 
          content: `This is a simulated response for chat ID: ${chatId || 'unknown'}. In a real implementation, this would call an API with the chat ID.` 
        }
      ])
    }, 1500)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b border-border p-3 flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-medium">AI Assistant</h3>
        </div>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Robo Assistant</h3>
            <p className="text-muted-foreground max-w-md">
              Ask any questions about managing your group or channel.
            </p>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-secondary text-secondary-foreground rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input area */}
      <div className="border-t border-border p-3 bg-background">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-background rounded-lg overflow-hidden border border-input focus-within:ring-1 focus-within:ring-primary">
            <Textarea
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="min-h-[45px] max-h-[120px] resize-none border-0 focus-visible:ring-0 py-3 px-4"
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
          </div>
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            className="rounded-full h-10 w-10 shrink-0"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}