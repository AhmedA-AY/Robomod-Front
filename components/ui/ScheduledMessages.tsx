'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Plus, Image as ImageIcon, Loader2, Bold, Italic, Code, Link } from 'lucide-react'
import * as React from "react"
import { cn } from "@/lib/utils"

type ScheduledMessage = {
  id: string
  message_text?: string
  media?: string
  scheduled_time: string
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

export default function ScheduledMessages({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<ScheduledMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchScheduledMessages = useCallback(async () => {
    try {
      const initData = window?.Telegram?.WebApp?.initData
      const response = await fetch(`/api/scheduled_messages?chat_id=${chatId}&current_user=${initData}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled messages')
      }

      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Error fetching scheduled messages:', error)
    } finally {
      setIsLoading(false)
    }
  }, [chatId])

  useEffect(() => {
    fetchScheduledMessages()
  }, [fetchScheduledMessages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage && !mediaFile) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('chat_id', chatId)
      formData.append('current_user', window?.Telegram?.WebApp?.initData || '')
      
      if (newMessage) {
        formData.append('message_text', newMessage)
      }
      if (mediaFile) {
        formData.append('media', mediaFile)
      }

      const response = await fetch('/api/add_scheduled_message', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to schedule message')
      }

      setNewMessage('')
      setMediaFile(null)
      fetchScheduledMessages()
    } catch (error) {
      console.error('Error scheduling message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const insertFormatting = (format: string) => {
    const textarea = document.querySelector('textarea')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value

    let prefix = ''
    let suffix = ''

    switch (format) {
      case 'bold':
        prefix = '**'
        suffix = '**'
        break
      case 'italic':
        prefix = '_'
        suffix = '_'
        break
      case 'code':
        prefix = '`'
        suffix = '`'
        break
      case 'link':
        prefix = '['
        suffix = '](url)'
        break
    }

    const newText = text.substring(0, start) + prefix + text.substring(start, end) + suffix + text.substring(end)
    setNewMessage(newText)
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    }, 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border border-input/10">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('bold')}
                className="px-2"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('italic')}
                className="px-2"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('code')}
                className="px-2"
              >
                <Code className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('link')}
                className="px-2"
              >
                <Link className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-4">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your scheduled message..."
                className="flex-grow min-h-[100px] bg-black/5"
              />
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  id="media"
                  className="hidden"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMediaFile(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('media')?.click()}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button type="submit" disabled={isSubmitting || (!newMessage && !mediaFile)}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            {mediaFile && (
              <p className="text-sm text-foreground/70">
                Selected file: {mediaFile.name}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-foreground/70">No scheduled messages</p>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="border border-input/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div className="flex-grow">
                    {message.message_text && (
                      <p className="text-foreground">{message.message_text}</p>
                    )}
                    {message.media && (
                      <p className="text-sm text-foreground/70">Contains media</p>
                    )}
                    <p className="text-sm text-foreground/70 mt-1">
                      Scheduled for: {new Date(message.scheduled_time).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}