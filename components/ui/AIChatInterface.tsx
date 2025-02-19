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
      // Here you would typically call your AI backend
      // For now, we'll just simulate a response
      setTimeout(() => {
        setMessages(prev => [...prev, { text: 'This is a simulated AI response.', sender: 'ai' }])
      }, 1000)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 overflow-hidden">
        <CardContent className="h-full overflow-y-auto p-4">
          {messages.map((msg, index) => (
            <div key={index} className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block p-2 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-secondary text-primary'}`}>
                {msg.text}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
      <CardFooter className="mt-4">
        <div className="flex w-full space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} className="bg-primary text-white hover:bg-primary/90">Send</Button>
        </div>
      </CardFooter>
    </div>
  )
}