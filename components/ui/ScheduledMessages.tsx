'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Loader2, Image as ImageIcon, Video } from 'lucide-react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import * as React from "react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import dynamic from 'next/dynamic'

// Dynamically import the form to prevent hydration issues
const ScheduleForm = dynamic(() => import('@/components/ui/ScheduleForm').then(mod => mod.ScheduleForm), {
  ssr: false,
  loading: () => <div className="p-4">Loading form...</div>
})

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
  fetched_message_text?: string;
  fetched_media_type?: 'photo' | 'video' | 'document' | 'text';
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
  const [isMounted, setIsMounted] = useState(false)
  const [messageContents, setMessageContents] = useState<Record<string, Partial<ScheduledMessage>>>({}) // Store fetched content

  // Only run client-side to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Function to fetch content for a single message
  const fetchMessageContent = useCallback(async (messageId: number) => {
    // Avoid refetching if already loaded
    if (messageContents[messageId]) return;

    try {
      const tg = window?.Telegram?.WebApp;
      if (!tg || !tg.initData) {
        console.error('Telegram Web App not initialized for fetching message content');
        return;
      }

      // --- URL Construction (already updated) ---
      const baseUrl = `https://robomod.dablietech.club/api/message`;
      const url = new URL(baseUrl);
      url.searchParams.append('chat_id', chatId);
      url.searchParams.append('message_id', messageId.toString());
      // --- End URL Construction ---

      console.log(`Fetching message content from: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error(`Failed to fetch content for message ${messageId}:`, errorData?.message || response.statusText);
        setMessageContents(prev => ({ ...prev, [messageId]: { fetched_media_type: undefined } })); // Mark as failed
        return;
      }

      const data = await response.json();
      console.log(`Fetched content for message ${messageId}:`, data);

      // --- Updated State Update Logic ---
      // Access nested message object from the response
      const messageData = data?.message;

      setMessageContents(prev => ({
        ...prev,
        [messageId]: {
          fetched_message_text: messageData?.text, // Get text from data.message.text
          fetched_media_type: messageData?.media_type || (messageData?.text ? 'text' : undefined), // Get media_type or derive from text
        }
      }));
      // --- End Updated State Update Logic ---

    } catch (error) {
      console.error(`Error fetching content for message ${messageId}:`, error);
      setMessageContents(prev => ({ ...prev, [messageId]: { fetched_media_type: undefined } })); // Mark as failed
    }
  }, [chatId, messageContents]);

  useEffect(() => {
    if (isMounted) {
      fetchScheduledMessages()
    }
  }, [fetchScheduledMessages, isMounted])

  // Fetch message content when messages list changes
  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach(msg => {
        // Check if message_id is valid before fetching
        if (msg.message_id && msg.message_id !== 0) { 
          fetchMessageContent(msg.message_id);
        } else {
          console.warn(`Skipping fetch for message with invalid ID:`, msg);
          // Optionally set a default state for messages with no ID
          setMessageContents(prev => ({
            ...prev,
            [msg.schedule_id]: { // Use schedule_id as key if message_id is invalid
              fetched_message_text: msg.message_text, // Use original text if available
              fetched_media_type: msg.message_text ? 'text' : undefined
            }
          }));
        }
      });
    }
  }, [messages, fetchMessageContent]); // Depend on messages list and the fetch function

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    setError(null) // Clear any previous errors
    
    try {
      console.log("Starting form submission for scheduled message");
      
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
      
      // Check file size limit - max 10MB
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
      if (mediaFile && mediaFile.size > MAX_FILE_SIZE) {
        throw new Error(`File is too large. Maximum size is 10MB. Your file is ${(mediaFile.size / (1024 * 1024)).toFixed(2)}MB.`);
      }

      // Convert interval from minutes to seconds
      const intervalSeconds = intervalMinutes * 60

      // Build the API endpoint
      const isEditing = !!editingMessage;
      const endpoint = isEditing ? "/api/edit_scheduled_message" : "/api/add_scheduled_message";
      const baseUrl = "https://robomod.dablietech.club" + endpoint;
      
      // Prepare the URL parameters
      const params = new URLSearchParams();
      params.append("chat_id", chatId);
      
      if (isEditing && editingMessage) {
        params.append("schedule_id", editingMessage.schedule_id);
        params.append("enabled", isEnabled.toString());
      }
      
      params.append("starting_at", startingAt.toString());
      params.append("interval", intervalSeconds.toString());
      
      const url = `${baseUrl}?${params.toString()}`;
      console.log(`${isEditing ? "Editing" : "Adding"} scheduled message at URL:`, url);
      
      // Prepare the form data
      const formData = new FormData();
      
      if (newMessage.trim()) {
        formData.append('message_text', newMessage.trim());
        console.log("Added message_text to form data:", newMessage.trim());
      }
      
      if (mediaFile) {
        console.log("Adding media file to form data:", mediaFile.name, mediaFile.type, 
                   `${(mediaFile.size / (1024 * 1024)).toFixed(2)}MB`);
        formData.append('media', mediaFile);
      }
      
      // Log all form data fields for debugging
      console.log("Form data entries:", [...formData.entries()].map(e => {
        if (e[0] === 'media') {
          return `${e[0]}: [File ${(e[1] as File).name}, type: ${(e[1] as File).type}, size: ${(e[1] as File).size} bytes]`;
        }
        return `${e[0]}: ${e[1]}`;
      }));
      
      // Make the API request
      console.log("Making API request to:", url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tg.initData}`
          // Note: Do NOT set 'Content-Type' header when using FormData
        },
        body: formData
      });
      
      console.log("API response status:", response.status, response.statusText);
      console.log("API response headers:", Object.fromEntries(response.headers.entries()));
      
      // Process the response
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error Response:`, errorText);
        console.error(`API Error Status:`, response.status);
        console.error(`API Error Headers:`, Object.fromEntries(response.headers.entries()));
        
        let errorMessage = isEditing 
          ? 'Failed to edit scheduled message' 
          : 'Failed to add scheduled message';
        
        // Check for specific status codes
        if (response.status === 413) {
          errorMessage = "File is too large. Please upload a smaller file (maximum 10MB).";
        } else if (response.status === 429) {
          errorMessage = "Too many requests. Please try again later.";
        } else {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData?.detail || errorData?.message || errorMessage;
          } catch {
            // If JSON parsing fails, use the error text
            errorMessage = errorText || errorMessage;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      console.log(`Scheduled message ${isEditing ? "updated" : "created"} successfully`);
      
      // Success - reset form and refresh
      resetForm();
      fetchScheduledMessages();
    } catch (error) {
      console.error('Error with scheduled message:', error)
      setError(error instanceof Error ? error.message : 'Failed to process request')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Helper function to reset the form
  const resetForm = () => {
    setNewMessage('');
    setMediaFile(null);
    setEditingMessage(null);
    setStartDate(new Date());
    setInterval('60');
    setIsEnabled(true);
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
    // Determine the key to use for looking up fetched content
    const contentKey = message.message_id && message.message_id !== 0
      ? message.message_id
      : message.schedule_id; // Fallback to schedule_id if message_id is invalid

    // Get the fetched content from state
    const fetchedContent = messageContents[contentKey];

    // Determine the text to pre-fill in the textarea
    // Use fetched text if available, otherwise empty string
    const editText = fetchedContent?.fetched_message_text || '';

    // Set the form state
    setEditingMessage(message); // Mark that we are editing this message
    setNewMessage(editText);    // Set the textarea content to fetched text
    setMediaFile(null);         // Clear any previously selected media file in the form
    setInterval(Math.round(message.interval / 60).toString()); // Set interval
    setStartDate(new Date(message.starting_at * 1000));         // Set start date
    setIsEnabled(message.enabled);                             // Set enabled status
  };

  // Show loading spinner during SSR or initial mount
  if (!isMounted || isLoading) {
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
    <div 
      className="h-full flex flex-col text-white"
      style={{ backgroundColor: 'var(--tg-theme-bg-color, #1a202c)' }}
    >
      <div className="p-6 border-b border-[var(--tg-theme-hint-color,rgba(255,255,255,0.1))] backdrop-blur-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--tg-theme-text-color,white)]">Scheduled Messages</h2>
        <p className="text-sm text-[var(--tg-theme-hint-color,#a0aec0)] mt-1">Create and manage automated posts</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card 
          className="mb-8 shadow-xl border-none"
          style={{
            backgroundColor: 'var(--tg-theme-secondary-bg-color, #2d3748)',
            borderColor: 'var(--tg-theme-hint-color, rgba(255,255,255,0.1))'
          }}
        >
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
            <div 
              className="text-center py-12 rounded-xl border backdrop-blur-sm"
              style={{
                backgroundColor: 'var(--tg-theme-secondary-bg-color, rgba(0,0,0,0.2))',
                borderColor: 'var(--tg-theme-hint-color, rgba(255,255,255,0.1))'
              }}
            >
              <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-[var(--tg-theme-text-color,white)] mb-2">No Scheduled Messages</h3>
              <p className="text-[var(--tg-theme-hint-color,#a0aec0)] max-w-sm mx-auto">Create your first scheduled post to start automating your content delivery</p>
            </div>
          ) : (
            messages.map((message) => (
              <Card 
                key={message.schedule_id} 
                className="backdrop-blur-sm hover:brightness-110 transition-all border-none shadow-md"
                style={{
                  backgroundColor: 'var(--tg-theme-secondary-bg-color, #2d3748)',
                  borderColor: 'var(--tg-theme-hint-color, rgba(255,255,255,0.1))'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-500/10 p-2 rounded-lg shrink-0">
                      {(() => {
                        // Use schedule_id as fallback key if message_id is 0
                        const contentKey = message.message_id && message.message_id !== 0 ? message.message_id : message.schedule_id;
                        const content = messageContents[contentKey];
                        switch (content?.fetched_media_type) {
                          case 'photo': return <ImageIcon className="w-5 h-5 text-blue-400" />;
                          case 'video': return <Video className="w-5 h-5 text-blue-400" />;
                          // Using Clock as temporary placeholder for document/text icon
                          case 'document': return <Clock className="w-5 h-5 text-blue-400" />;
                          case 'text': return <Clock className="w-5 h-5 text-blue-400" />;
                          default: return <Clock className="w-5 h-5 text-blue-400" />; // Default or loading
                        }
                      })()}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="mb-2 text-[var(--tg-theme-text-color,white)] break-words line-clamp-3">
                        {(() => {
                          // Use schedule_id as fallback key if message_id is 0
                          const contentKey = message.message_id && message.message_id !== 0 ? message.message_id : message.schedule_id;
                          const content = messageContents[contentKey];
                          if (content?.fetched_message_text) {
                            return content.fetched_message_text;
                          } else if (content?.fetched_media_type && content.fetched_media_type !== 'text') {
                            return <span className="italic text-[var(--tg-theme-hint-color,#a0aec0)]">{`${content.fetched_media_type.charAt(0).toUpperCase() + content.fetched_media_type.slice(1)} file`}</span>;
                          } else if (message.message_id === 0 || content === undefined) {
                            // Loading or invalid ID state
                            return <span className="italic text-[var(--tg-theme-hint-color,#a0aec0)]">Loading content...</span>;
                          } else {
                            // Fallback if fetch failed or no content
                            return <span className="italic text-[var(--tg-theme-hint-color,#a0aec0)]">Content unavailable</span>;
                          }
                        })()}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm">
                        <div className="flex items-center gap-2 text-[var(--tg-theme-hint-color,#a0aec0)]">
                          <span className="font-medium text-[var(--tg-theme-text-color,white)]">Starts:</span>
                          {format(new Date(message.starting_at * 1000), "PP p")}
                        </div>
                        <div className="flex items-center gap-2 text-[var(--tg-theme-hint-color,#a0aec0)]">
                          <span className="font-medium text-[var(--tg-theme-text-color,white)]">Interval:</span>
                          {Math.round(message.interval / 60)} min
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${message.enabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <span className="text-[var(--tg-theme-hint-color,#a0aec0)]">
                            {message.enabled ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                        <div className="flex items-center gap-2 text-[var(--tg-theme-hint-color,#a0aec0)]">
                          <span className="font-medium text-[var(--tg-theme-text-color,white)]">Last Run:</span>
                          {message.last_run ? format(new Date(message.last_run * 1000), "PP p") : 'Never'}
                        </div>
                        <div className="flex items-center gap-2 text-[var(--tg-theme-hint-color,#a0aec0)]">
                          <span className="font-medium text-[var(--tg-theme-text-color,white)]">Next Run:</span>
                          {format(new Date(message.next_run * 1000), "PP p")}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(message)}
                        className="h-9 w-9 text-[var(--tg-theme-hint-color,#a0aec0)] hover:bg-[var(--tg-theme-button-color,rgba(255,255,255,0.1))] hover:text-[var(--tg-theme-button-text-color,white)] transition-colors"
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