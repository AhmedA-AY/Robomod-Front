'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

export default function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, sender: 'user' }])
      setInput('')
      setTimeout(() => {
        setMessages(prev => [...prev, { text: 'This is a simulated AI response.', sender: 'ai' }])
      }, 1000)
    }
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-background">
      <Card className="flex-1 overflow-hidden border-0 bg-background">
        <CardContent className="h-full overflow-y-auto p-6 space-y-6 bg-background">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`inline-block max-w-[85%] px-4 py-2 rounded-2xl ${
                msg.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary/50 text-secondary-foreground'
              }`}>
                <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                  {msg.text}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <CardFooter className="mt-4 p-0 bg-background">
        <div className="flex w-full space-x-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow bg-black/10 border-0 focus-visible:ring-1 text-foreground placeholder:text-foreground/50"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button 
            onClick={handleSend}
            className="px-6"
          >
            Send
          </Button>
        </div>
      </CardFooter>
    </div>
  )
}