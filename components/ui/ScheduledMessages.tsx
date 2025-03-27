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
  schedule_id: string;
  chat_id: number;
  message_id: number;
  enabled: boolean;
  type: string;
  starting_at: number;
  interval: number;
  last_run: number;
  next_run: number;
  message_text?: string;
  media?: string;
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
  const [isEnabled, setIsEnabled] = useState<boolean>(true)

  const fetchScheduledMessages = useCallback(async () => {
    try {
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        setError('Telegram Web App is not initialized')
        setIsLoading(false)
        return
      }

      // Construct the URL with query parameters
      const url = new URL('https://robomod.dablietech.club/api/scheduled_messages')
      url.searchParams.append('chat_id', chatId)

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to fetch scheduled messages')
      }

      const data = await response.json()
      
      // Handle the API response structure
      if (data && typeof data === 'object' && 'scheduled_messages' in data) {
        // Ensure scheduled_messages is an array
        const messages = Array.isArray(data.scheduled_messages) 
          ? data.scheduled_messages 
          : []
        
        // Transform the data to match our interface
        const transformedMessages = messages.map((msg: Partial<ScheduledMessage>) => ({
          schedule_id: msg.schedule_id || '',
          chat_id: msg.chat_id || 0,
          message_id: msg.message_id || 0,
          enabled: msg.enabled || false,
          type: msg.type || 'message',
          starting_at: msg.starting_at || 0,
          interval: msg.interval || 0,
          last_run: msg.last_run || 0,
          next_run: msg.next_run || 0,
          message_text: msg.message_text,
          media: msg.media
        }))
        
        setMessages(transformedMessages)
      } else {
        setMessages([])
      }
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
      
      // API requires at least one of message_text or media
      if (!editingMessage && !newMessage.trim() && !mediaFile) {
        throw new Error('Either message text or media must be provided')
      }

      // Convert interval from minutes to seconds
      const intervalSeconds = intervalMinutes * 60

      // Construct the URL with query parameters
      const url = new URL(editingMessage 
        ? 'https://robomod.dablietech.club/api/edit_scheduled_message'
        : 'https://robomod.dablietech.club/api/add_scheduled_message'
      )

      // Add required query parameters
      url.searchParams.append('chat_id', chatId)
      
      if (editingMessage) {
        // Add required parameters for edit operation
        url.searchParams.append('schedule_id', editingMessage.schedule_id)
        
        // Add optional parameters if they have changed
        if (startingAt !== editingMessage.starting_at) {
          url.searchParams.append('starting_at', startingAt.toString())
        }
        if (intervalSeconds !== editingMessage.interval) {
          url.searchParams.append('interval', intervalSeconds.toString())
        }
        // Add enabled status
        url.searchParams.append('enabled', isEnabled.toString())
      } else {
        // Add required parameters for add operation
        url.searchParams.append('starting_at', startingAt.toString())
        url.searchParams.append('interval', intervalSeconds.toString())
      }
     
      // Create a new FormData instance 
      const formData = new FormData();
      
      // Add the message text if it exists
      if (newMessage.trim()) {
        formData.append('message_text', newMessage.trim());
      }
      
      // Special handling for file upload
      if (mediaFile) {
        // Reset the file input and just use the file directly
        // This is the key step - we need to make sure we're sending an actual file
        // with its original content-type intact
        const fileInput = document.getElementById('media') as HTMLInputElement;
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          // Get the file directly from the input element
          const file = fileInput.files[0];
          formData.append('media', file);
        } else if (mediaFile) {
          // Fallback to the state variable
          formData.append('media', mediaFile);
        }
      }

      // For debugging - log the form data content
      console.log('Form data entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? `File(${value.name}, ${value.type}, ${value.size} bytes)` : value}`);
      }

      // Make the request with the form data
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
          // Don't set Content-Type - the browser will set it with the correct boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        
        let errorMessage = editingMessage 
          ? 'Failed to edit scheduled message'
          : 'Failed to add scheduled message'
        
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
      setIsEnabled(true)
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

      // Construct the URL with query parameters
      const url = new URL('https://robomod.dablietech.club/api/delete_scheduled_message')
      url.searchParams.append('chat_id', chatId)
      url.searchParams.append('schedule_id', scheduleId)

      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
        },
      })

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
    setInterval(Math.round(message.interval / 60).toString())
    setStartDate(new Date(message.starting_at * 1000))
    setIsEnabled(message.enabled)
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
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="p-6 border-b border-gray-700/50">
        <h2 className="text-2xl font-semibold tracking-tight">Scheduled Messages</h2>
        <p className="text-sm text-gray-400 mt-1">Create and manage automated posts</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm mb-8 shadow-xl">
          <CardContent className="p-6">
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
              isEnabled={isEnabled}
              setIsEnabled={setIsEnabled}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
              <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No Scheduled Messages</h3>
              <p className="text-gray-400 max-w-sm mx-auto">Create your first scheduled post to start automating your content delivery</p>
            </div>
          ) : (
            messages.map((message) => (
              <Card key={message.schedule_id} className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/70 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-500/10 p-2 rounded-lg shrink-0">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="font-medium text-white">Message ID:</span>
                          {message.message_id}
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="font-medium text-white">Starts:</span>
                          {format(new Date(message.starting_at * 1000), "PPP p")}
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="font-medium text-white">Interval:</span>
                          {Math.round(message.interval / 60)} minutes
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${message.enabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <span className="text-gray-400">
                            {message.enabled ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="font-medium text-white">Last Run:</span>
                          {format(new Date(message.last_run * 1000), "PPP p")}
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="font-medium text-white">Next Run:</span>
                          {format(new Date(message.next_run * 1000), "PPP p")}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(message)}
                        className="h-9 w-9 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(message.schedule_id)}
                        className="h-9 w-9 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
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