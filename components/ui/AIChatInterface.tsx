'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Loader2 } from 'lucide-react'
import { aiQuery } from '@/lib/api'

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface AIChatInterfaceProps {
    chatId: string;
}

export default function AIChatInterface({ chatId }: AIChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: message };
    setHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const tg = window?.Telegram?.WebApp;
      if (!tg || !tg.initData) {
        throw new Error('Telegram Web App is not initialized');
      }

      const response = await aiQuery(tg.initData, message, parseInt(chatId));
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: response.answer || "I'm sorry, I couldn't process your request at this time."
      };
      setHistory(prev => [...prev, assistantMessage]);
    } catch (e) {
      console.error("Failed to send message:", e);
      setError(e instanceof Error ? e.message : 'Failed to send message. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [history])

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: 'var(--tg-theme-bg-color, #1f2937)' }}
    >
      {/* Chat header */}
      <div className="border-b border-border p-3 flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-medium">Robo Assistant</h3>
        </div>
      </div>
      
      {/* Message History Area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[75%] rounded-lg px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,white)] rounded-br-none'
                  : 'bg-[var(--tg-theme-secondary-bg-color,#374151)] text-[var(--tg-theme-text-color,white)] rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
             {msg.role === 'user' && (
               <Avatar className="h-8 w-8">
                 <AvatarImage src="/placeholder-user.jpg" />
                 <AvatarFallback>U</AvatarFallback>
               </Avatar>
             )}
          </div>
        ))}
        {isLoading && history.length === 0 && (
             <div className="flex justify-center items-center h-full">
                 <Loader2 className="w-6 h-6 animate-spin text-[var(--tg-theme-hint-color,#a0aec0)]" />
             </div>
         )}
         {error && (
            <div className="text-center p-4">
                 <p className="text-sm text-red-500">{error}</p>
            </div>
         )}
      </div>
      
      {/* Input Area */}
      <div
        className="p-3 border-t"
        style={{
          backgroundColor: 'var(--tg-theme-secondary-bg-color, #1f2937)',
          borderColor: 'var(--tg-theme-hint-color, #4b5563)'
        }}
        >
        <div className="flex gap-2 items-end">
          <div
            className="flex-1 rounded-lg overflow-hidden border focus-within:ring-1 focus-within:ring-[var(--tg-theme-button-color)]"
             style={{
               backgroundColor: 'var(--tg-theme-bg-color, #111827)',
               borderColor: 'var(--tg-theme-hint-color, #4b5563)',
             }}
          >
            <Textarea
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="min-h-[45px] max-h-[120px] resize-none border-0 focus-visible:ring-0 py-3 px-4 bg-transparent text-[var(--tg-theme-text-color,white)] placeholder:text-[var(--tg-theme-hint-color,#a0aec0)]"
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
            disabled={isLoading || !message.trim()}
             style={{
               backgroundColor: 'var(--tg-theme-button-color, #3b82f6)',
               color: 'var(--tg-theme-button-text-color, white)',
             }}
          >
             {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}