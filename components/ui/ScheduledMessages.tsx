'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Loader2 } from 'lucide-react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import * as React from "react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ScheduleForm } from "@/components/ui/ScheduleForm"

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
    setIsSubmitting(true)
    setError(null) // Clear any previous errors
    
    try {
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        throw new Error('Telegram Web App is not initialized')
      }

      // Validate required fields
      const startingAt = Math.floor(startDate.getTime() / 1000)
      const intervalMinutes = parseInt(interval)
      
      if (isNaN(intervalMinutes) || intervalMinutes < 1) {
        throw new Error('Interval must be a positive number')
      }

      // Build query parameters
      const params = new URLSearchParams()
      params.append('chat_id', chatId)
      params.append('starting_at', startingAt.toString())
      params.append('interval', intervalMinutes.toString())
      
      if (editingMessage) {
        params.append('schedule_id', editingMessage.id)
      }

      // Build the URL with query parameters
      const baseUrl = editingMessage 
        ? 'https://robomod.dablietech.club/api/edit_scheduled_message'
        : 'https://robomod.dablietech.club/api/add_scheduled_message'
      
      const url = `${baseUrl}?${params.toString()}`
      
      // Create form data for the message content only
      const formData = new FormData()
      if (newMessage) {
        formData.append('message_text', newMessage)
      }
      if (mediaFile) {
        formData.append('media', mediaFile)
      }

      console.log('Submitting to URL:', url)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        
        let errorMessage = 'Failed to schedule message'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail?.[0]?.msg || errorData.detail || errorData.message || errorMessage
        } catch {
          // If JSON parsing fails, use the error text
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      // Success - reset form
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

  if (error && error !== "Please enter a message or select a media file") {
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
    <div className="h-full flex flex-col bg-[#1f2937] text-white">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-medium">Scheduled Messages</h2>
        <p className="text-sm text-gray-400">Create and manage scheduled posts</p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Card className="bg-[#2d3748] border-gray-700 mb-6">
          <CardContent className="p-4">
            <ScheduleForm
              startDate={startDate}
              setStartDate={setStartDate}
              interval={interval}
              setInterval={setInterval}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              mediaFile={mediaFile}
              setMediaFile={setMediaFile}
              isSubmitting={isSubmitting}
              editingMessage={editingMessage}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-10 bg-[#2d3748] rounded-lg border border-gray-700">
              <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-300">No scheduled messages</p>
              <p className="text-sm text-gray-400 mt-1">Create your first scheduled post above</p>
            </div>
          ) : (
            messages.map((message) => (
              <Card key={message.id} className="bg-[#2d3748] border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                    <div className="flex-grow">
                      {message.message_text && (
                        <p className="text-white whitespace-pre-wrap">{message.message_text}</p>
                      )}
                      {message.media && (
                        <p className="text-sm text-gray-400 mt-1">Contains media</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
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
                        className="h-8 w-8 text-gray-300 hover:bg-gray-700"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(message.id)}
                        className="h-8 w-8 text-red-400 hover:bg-gray-700"
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