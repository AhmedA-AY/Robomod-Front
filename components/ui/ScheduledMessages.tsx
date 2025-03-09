'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Loader2, Bold, Italic, Code, Link } from 'lucide-react'
import { FiEdit2, FiTrash2, FiUpload } from 'react-icons/fi'
import * as React from "react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ScheduledMessage {
  id: string;
  message_text?: string;
  media?: string;
  starting_at: number;
  interval: number;
  enabled: boolean;
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
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [interval, setInterval] = useState('60') // Default 60 minutes
  const [editingMessage, setEditingMessage] = useState<ScheduledMessage | null>(null)

  const fetchScheduledMessages = useCallback(async () => {
    try {
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        setError('Telegram Web App is not initialized')
        setIsLoading(false)
        return
      }

      const response = await fetch(`https://robomod.dablietech.club/api/scheduled_messages?chat_id=${chatId}`, {
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled messages')
      }

      const data = await response.json()
      // Ensure data.messages exists and is an array, otherwise use empty array
      setMessages(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching scheduled messages:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch messages')
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
    setError(null) // Clear any previous errors
    
    try {
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        throw new Error('Telegram Web App is not initialized')
      }

      const formData = new FormData()
      if (newMessage) {
        formData.append('message_text', newMessage)
      }
      if (mediaFile) {
        formData.append('media', mediaFile)
      }

      const startingAt = Math.floor(startDate.getTime() / 1000)
      const intervalMinutes = parseInt(interval)
      
      if (isNaN(intervalMinutes) || intervalMinutes < 1) {
        throw new Error('Invalid interval value')
      }

      const url = editingMessage 
        ? `https://robomod.dablietech.club/api/edit_scheduled_message`
        : `https://robomod.dablietech.club/api/add_scheduled_message`

      // Add parameters to formData instead of URL
      formData.append('chat_id', chatId)
      formData.append('starting_at', startingAt.toString())
      formData.append('interval', intervalMinutes.toString())
      
      if (editingMessage) {
        formData.append('schedule_id', editingMessage.id)
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          errorData?.message || 
          (editingMessage ? 'Failed to edit message' : 'Failed to schedule message')
        )
      }

      setNewMessage('')
      setMediaFile(null)
      setEditingMessage(null)
      setStartDate(new Date())
      setInterval('60')
      fetchScheduledMessages()
    } catch (error) {
      console.error('Error with scheduled message:', error)
      setError(error instanceof Error ? error.message : 'Failed to process request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (scheduleId: string) => {
    setError(null) // Clear any previous errors
    try {
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        throw new Error('Telegram Web App is not initialized')
      }

      const formData = new FormData()
      formData.append('chat_id', chatId)
      formData.append('schedule_id', scheduleId)

      const response = await fetch(
        'https://robomod.dablietech.club/api/delete_scheduled_message',
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${tg.initData}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to delete message')
      }

      fetchScheduledMessages()
    } catch (error) {
      console.error('Error deleting message:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete message')
    }
  }

  const handleEdit = (message: ScheduledMessage) => {
    setEditingMessage(message)
    setNewMessage(message.message_text || '')
    setInterval(message.interval.toString())
    setStartDate(new Date(message.starting_at * 1000))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-destructive/10 p-6 rounded-lg max-w-md text-center">
          <p className="text-destructive font-medium text-lg mb-2">Error</p>
          <p className="text-foreground/90">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-medium">Scheduled Messages</h2>
        <p className="text-sm text-muted-foreground">Create and manage scheduled posts</p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Card className="border border-input/10 mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const textarea = document.querySelector('textarea')
                    if (!textarea) return
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const text = textarea.value
                    const newText = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end)
                    setNewMessage(newText)
                  }}
                  className="px-2 h-8"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const textarea = document.querySelector('textarea')
                    if (!textarea) return
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const text = textarea.value
                    const newText = text.substring(0, start) + '_' + text.substring(start, end) + '_' + text.substring(end)
                    setNewMessage(newText)
                  }}
                  className="px-2 h-8"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const textarea = document.querySelector('textarea')
                    if (!textarea) return
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const text = textarea.value
                    const newText = text.substring(0, start) + '`' + text.substring(start, end) + '`' + text.substring(end)
                    setNewMessage(newText)
                  }}
                  className="px-2 h-8"
                >
                  <Code className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const textarea = document.querySelector('textarea')
                    if (!textarea) return
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const text = textarea.value
                    const newText = text.substring(0, start) + '[' + text.substring(start, end) + '](url)' + text.substring(end)
                    setNewMessage(newText)
                  }}
                  className="px-2 h-8"
                >
                  <Link className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Message</Label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your scheduled message..."
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date & Time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {format(startDate, "PPP p")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => date && setStartDate(date)}
                          initialFocus
                        />
                        <div className="p-3 border-t">
                          <Input
                            type="time"
                            value={format(startDate, "HH:mm")}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':')
                              const newDate = new Date(startDate)
                              newDate.setHours(parseInt(hours))
                              newDate.setMinutes(parseInt(minutes))
                              setStartDate(newDate)
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Interval (minutes)</Label>
                    <Input
                      type="number"
                      value={interval}
                      onChange={(e) => setInterval(e.target.value)}
                      min="1"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
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
                      className="w-full"
                    >
                      <FiUpload className="w-4 h-4 mr-2" />
                      {mediaFile ? mediaFile.name : 'Upload Media'}
                    </Button>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || (!newMessage && !mediaFile)}
                    className="px-8"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingMessage ? (
                      'Update Message'
                    ) : (
                      'Schedule Message'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-10 bg-card/30 rounded-lg border border-border">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground/70">No scheduled messages</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first scheduled post above</p>
            </div>
          ) : (
            messages.map((message) => (
              <Card key={message.id} className="border border-input/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary shrink-0 mt-1" />
                    <div className="flex-grow">
                      {message.message_text && (
                        <p className="text-foreground whitespace-pre-wrap">{message.message_text}</p>
                      )}
                      {message.media && (
                        <p className="text-sm text-foreground/70 mt-1">Contains media</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-foreground/70">
                        <p>Starts: {format(new Date(message.starting_at * 1000), "PPP p")}</p>
                        <span>•</span>
                        <p>Interval: {message.interval} minutes</p>
                        <span>•</span>
                        <p>Status: {message.enabled ? 'Active' : 'Paused'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(message)}
                        className="h-8 w-8"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(message.id)}
                        className="h-8 w-8 text-destructive"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}