'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import * as React from "react"
import { Label } from "@/components/ui/label"
import { getScheduleSettings, toggleSchedule, setScheduleMessage } from '@/lib/api'

interface ScheduleSettings {
  enabled: boolean;
  message: string;
  scheduleTime: string;
}

// Type for tracking API timestamps
interface EndpointTimestamps {
  [key: string]: number;
}

export default function ScheduleSettings({ chatId }: { chatId: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [fetchFailed, setFetchFailed] = useState(false)
  
  // Use a ref to track API call timestamps by endpoint
  const lastApiCallsRef = useRef<EndpointTimestamps>({})

  // Helper function to ensure rate limiting compliance
  const safeApiCall = useCallback(async (endpoint: string, apiCall: () => Promise<any>): Promise<any> => {
    const now = Date.now()
    const lastCallTime = lastApiCallsRef.current[endpoint] || 0
    const timeSinceLastCall = now - lastCallTime
    
    // Ensure at least 1100ms between API calls to the same endpoint (adding 100ms buffer)
    if (timeSinceLastCall < 1100) {
      const waitTime = 1100 - timeSinceLastCall
      console.log(`Rate limiting for ${endpoint}: waiting ${waitTime}ms before API call`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    // Update the timestamp for this endpoint
    lastApiCallsRef.current[endpoint] = Date.now()
    
    try {
      return await apiCall()
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error)
      throw error
    }
  }, [])

  const fetchScheduleSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const tg = window?.Telegram?.WebApp
      if (!tg?.initData || !tg?.initDataUnsafe?.user?.id) {
        throw new Error('Telegram Web App is not initialized or user not authenticated')
      }

      const userId = tg.initDataUnsafe.user.id
      if (!userId) {
        throw new Error('User ID is not available')
      }

      // Use the safe API call function with endpoint tracking
      const data = await safeApiCall('getScheduleSettings', () => 
        getScheduleSettings(tg.initData, parseInt(chatId), userId)
      )
      
      console.log('Processed schedule settings:', data)
      
      // Set the state with the retrieved settings
      if (data) {
        setMessage(data.message || '')
        setEnabled(data.enabled || false)
        setScheduleTime(data.scheduleTime || '')
        // Reset retry count and fetch failed flag on success
        setRetryCount(0)
        setFetchFailed(false)
      } else {
        // Handle empty response
        console.warn('Received empty data from API')
        setMessage('')
        setEnabled(false)
        setScheduleTime('')
      }
    } catch (error) {
      console.error('Error fetching schedule settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch schedule settings')
      setFetchFailed(true)
    } finally {
      setIsLoading(false)
    }
  }, [chatId, safeApiCall])

  // Retry mechanism with exponential backoff for failed fetches
  useEffect(() => {
    if (error && retryCount < 3 && !fetchFailed) {
      // Exponential backoff: 2s, 4s, 8s
      const backoffTime = Math.pow(2, retryCount + 1) * 1000
      console.log(`Retrying schedule settings fetch (${retryCount + 1}/3) after ${backoffTime/1000}s...`)
      
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        fetchScheduleSettings().catch(() => {
          // Catch and ignore errors here to prevent unhandled rejections
          console.log('Retry attempt failed')
        })
      }, backoffTime)
      
      return () => clearTimeout(timer)
    }
  }, [error, retryCount, fetchScheduleSettings, fetchFailed])

  // Initial fetch of schedule settings
  useEffect(() => {
    fetchScheduleSettings().catch(() => {
      // Catch and ignore initial fetch errors to prevent unhandled rejections
      console.log('Initial fetch failed, will retry if configured')
    })
  }, [fetchScheduleSettings])

  const handleToggleSchedule = async (newEnabledState: boolean) => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      const tg = window?.Telegram?.WebApp
      if (!tg?.initData || !tg?.initDataUnsafe?.user?.id) {
        throw new Error('Telegram Web App is not initialized or user not authenticated')
      }

      const userId = tg.initDataUnsafe.user.id
      if (!userId) {
        throw new Error('User ID is not available')
      }

      // Use the safe API call function with endpoint tracking
      await safeApiCall('toggleSchedule', () => 
        toggleSchedule(tg.initData, parseInt(chatId), userId, newEnabledState)
      )
      
      setEnabled(newEnabledState)
    } catch (error) {
      console.error('Error toggling schedule:', error)
      setError(error instanceof Error ? error.message : 'Failed to toggle schedule')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveMessage = async () => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      const tg = window?.Telegram?.WebApp
      if (!tg?.initData || !tg?.initDataUnsafe?.user?.id) {
        throw new Error('Telegram Web App is not initialized or user not authenticated')
      }

      const userId = tg.initDataUnsafe.user.id
      if (!userId) {
        throw new Error('User ID is not available')
      }

      // Use the safe API call function with endpoint tracking
      await safeApiCall('setScheduleMessage', () => 
        setScheduleMessage(tg.initData, parseInt(chatId), userId, message, scheduleTime)
      )
      
      // No need to update local state as the message is already set
    } catch (error) {
      console.error('Error saving schedule message:', error)
      setError(error instanceof Error ? error.message : 'Failed to save schedule message')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading && retryCount === 0 && !fetchFailed) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--tg-theme-text-color)]" />
      </div>
    )
  }

  // Show error message if we've completely failed to fetch and have no settings
  // but also provide a way to continue using the form with default values
  if (error && fetchFailed) {
    return (
      <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--tg-theme-bg-color, #1f2937)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--tg-theme-hint-color, #4b5563)' }}>
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--tg-theme-text-color, white)' }}>Schedule Settings</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>Manage your scheduled messages</p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6 p-6 rounded-lg" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)' }}>
            <p className="font-medium text-lg mb-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>Error Loading Settings</p>
            <p className="mb-4" style={{ color: 'var(--tg-theme-text-color, white)' }}>{error}</p>
            <p className="text-sm mb-4" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
              You can still configure your schedule settings below. Default values have been provided.
            </p>
            <Button 
              onClick={() => {
                setRetryCount(0);
                setFetchFailed(false);
                fetchScheduleSettings().catch(() => console.log('Manual retry failed'));
              }}
              style={{
                backgroundColor: 'var(--tg-theme-button-color, #3b82f6)',
                color: 'var(--tg-theme-button-text-color, white)'
              }}
              size="sm"
            >
              Retry Loading Settings
            </Button>
          </div>

          {/* Show the form with default values */}
          <Card className="mb-8 shadow-xl backdrop-blur-sm" style={{
            backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
            borderColor: 'var(--tg-theme-hint-color, #4b5563)'
          }}>
            <CardContent className="p-6">
              {renderScheduleForm()}
            </CardContent>
          </Card>

          {renderTips()}
        </div>
      </div>
    )
  }

  return (
    <div 
      className="h-full flex flex-col"
      style={{ backgroundColor: 'var(--tg-theme-bg-color, #1f2937)' }}
    >
      <div 
        className="p-6 border-b"
        style={{ borderColor: 'var(--tg-theme-hint-color, #4b5563)' }}
      >
        <h2 
          className="text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--tg-theme-text-color, white)' }}
        >
          Schedule Settings
        </h2>
        <p 
          className="text-sm mt-1"
          style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
        >
          Manage your scheduled messages
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div 
            className="mb-6 p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
              borderColor: 'var(--tg-theme-hint-color, #4b5563)'
            }}
          >
            <p 
              className="font-medium mb-1"
              style={{ color: 'var(--tg-theme-text-color, white)' }}
            >
              Warning
            </p>
            <p 
              className="text-sm"
              style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
            >
              {error}
            </p>
          </div>
        )}

        <Card 
          className="mb-8 shadow-xl backdrop-blur-sm"
          style={{
            backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
            borderColor: 'var(--tg-theme-hint-color, #4b5563)'
          }}
        >
          <CardContent className="p-6">
            {renderScheduleForm()}
          </CardContent>
        </Card>

        {renderTips()}
      </div>
    </div>
  )

  // Helper function to render the schedule form
  function renderScheduleForm() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label style={{ color: 'var(--tg-theme-text-color, white)' }} className="text-lg">Enable Scheduled Message</Label>
            <p className="text-sm mt-1" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
              When enabled, the bot will automatically send messages at the scheduled time
            </p>
          </div>
          <Switch 
            checked={enabled} 
            onCheckedChange={handleToggleSchedule}
            disabled={isSubmitting}
            style={{
              backgroundColor: enabled ? 'var(--tg-theme-button-color, #3b82f6)' : 'var(--tg-theme-hint-color, #4b5563)'
            }}
          />
        </div>

        <div className="space-y-2">
          <Label style={{ color: 'var(--tg-theme-text-color, white)' }} className="text-lg">Schedule Time</Label>
          <p className="text-sm mb-2" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
            Set the time when the message should be sent (24-hour format)
          </p>
          <input
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="w-full p-2 rounded border"
            style={{
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
              borderColor: 'var(--tg-theme-hint-color, #4b5563)',
              color: 'var(--tg-theme-text-color, white)'
            }}
            disabled={isSubmitting}
            title="Schedule time in 24-hour format"
          />
        </div>

        <div className="space-y-2">
          <Label style={{ color: 'var(--tg-theme-text-color, white)' }} className="text-lg">Scheduled Message</Label>
          <p className="text-sm mb-2" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
            This message will be sent at the scheduled time
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your scheduled message here..."
            style={{
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
              borderColor: 'var(--tg-theme-hint-color, #4b5563)',
              color: 'var(--tg-theme-text-color, white)'
            }}
            className="min-h-[200px]"
            disabled={isSubmitting}
          />
        </div>

        <Button 
          onClick={handleSaveMessage} 
          disabled={isSubmitting || !message.trim() || !scheduleTime}
          style={{
            backgroundColor: 'var(--tg-theme-button-color, #3b82f6)',
            color: 'var(--tg-theme-button-text-color, white)'
          }}
          className="w-full"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Save Schedule Settings
        </Button>
      </div>
    )
  }

  // Helper function to render tips
  function renderTips() {
    return (
      <div className="space-y-4">
        <Card style={{
          backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
          borderColor: 'var(--tg-theme-hint-color, #4b5563)'
        }} className="backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="text-xl font-medium mb-4" style={{ color: 'var(--tg-theme-text-color, white)' }}>Tips for effective scheduled messages</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>
                <span style={{ color: 'var(--tg-theme-link-color, #3b82f6)' }} className="font-bold">•</span>
                Schedule important announcements or reminders
              </li>
              <li className="flex items-start gap-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>
                <span style={{ color: 'var(--tg-theme-link-color, #3b82f6)' }} className="font-bold">•</span>
                Set regular updates or daily messages
              </li>
              <li className="flex items-start gap-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>
                <span style={{ color: 'var(--tg-theme-link-color, #3b82f6)' }} className="font-bold">•</span>
                Use scheduled messages for time-sensitive content
              </li>
              <li className="flex items-start gap-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>
                <span style={{ color: 'var(--tg-theme-link-color, #3b82f6)' }} className="font-bold">•</span>
                Plan ahead for special events or announcements
              </li>
              <li className="flex items-start gap-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>
                <span style={{ color: 'var(--tg-theme-link-color, #3b82f6)' }} className="font-bold">•</span>
                Keep messages concise and clear
              </li>
              <li className="flex items-start gap-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>
                <span style={{ color: 'var(--tg-theme-link-color, #3b82f6)' }} className="font-bold">•</span>
                Use <code style={{ color: 'var(--tg-theme-text-color, white)' }}>{'{username}'}</code> to mention specific users
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }
} 