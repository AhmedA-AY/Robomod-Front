'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import * as React from "react"
import { Label } from "@/components/ui/label"
import { getGreetingSettings, toggleGreeting, setGreetingMessage } from '@/lib/api'

interface GreetingSettings {
  enabled: boolean;
  message: string;
}

// Type for tracking API timestamps
interface EndpointTimestamps {
  [key: string]: number;
}

export default function GreetingSettings({ chatId }: { chatId: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [fetchFailed, setFetchFailed] = useState(false)
  
  // Use a ref to track API call timestamps by endpoint
  const lastApiCallsRef = useRef<EndpointTimestamps>({})

  // Helper function to ensure rate limiting compliance
  const safeApiCall = useCallback(async (endpoint: string, apiCall: () => Promise<GreetingSettings>): Promise<GreetingSettings> => {
    const now = Date.now()
    const lastCallTime = lastApiCallsRef.current[endpoint] || 0
    const timeSinceLastCall = now - lastCallTime
    
    if (timeSinceLastCall < 1100) {
      const waitTime = 1100 - timeSinceLastCall
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    lastApiCallsRef.current[endpoint] = Date.now()
    
    try {
      return await apiCall()
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error)
      throw error
    }
  }, [])

  const fetchGreetingSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        throw new Error('Telegram Web App is not initialized')
      }
      
      if (!tg.initDataUnsafe.user?.id) {
        throw new Error('User ID not available')
      }

      const userId = tg.initDataUnsafe.user.id;
      const endpoint = 'greeting_settings';

      const data = await safeApiCall(endpoint, () => 
        getGreetingSettings(tg.initData, parseInt(chatId), userId)
      );
      
      setMessage(data.message || '');
      setEnabled(data.enabled || false);
      setRetryCount(0);
      setFetchFailed(false);
    } catch (error) {
      console.error('Error fetching greeting settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch greeting settings')
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
      console.log(`Retrying greeting settings fetch (${retryCount + 1}/3) after ${backoffTime/1000}s...`)
      
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        fetchGreetingSettings().catch(() => {
          // Catch and ignore errors here to prevent unhandled rejections
          console.log('Retry attempt failed')
        })
      }, backoffTime)
      
      return () => clearTimeout(timer)
    }
  }, [error, retryCount, fetchGreetingSettings, fetchFailed])

  // Initial fetch of greeting settings
  useEffect(() => {
    fetchGreetingSettings().catch(() => {
      // Catch and ignore initial fetch errors to prevent unhandled rejections
      console.log('Initial fetch failed, will retry if configured')
    })
  }, [fetchGreetingSettings])

  const handleToggleGreeting = async (newEnabledState: boolean) => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        throw new Error('Telegram Web App is not initialized')
      }
      
      if (!tg.initDataUnsafe.user?.id) {
        throw new Error('User ID not available')
      }

      const userId = tg.initDataUnsafe.user.id;
      const endpoint = 'toggle_greeting';

      await safeApiCall(endpoint, () => 
        toggleGreeting(tg.initData, parseInt(chatId), userId, newEnabledState)
      );
      
      setEnabled(newEnabledState);
    } catch (error) {
      console.error('Error toggling greeting:', error)
      setError(error instanceof Error ? error.message : 'Failed to toggle greeting')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveMessage = async () => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        throw new Error('Telegram Web App is not initialized')
      }
      
      if (!tg.initDataUnsafe.user?.id) {
        throw new Error('User ID not available')
      }

      if (!message.trim()) {
        throw new Error('Greeting message cannot be empty')
      }

      const userId = tg.initDataUnsafe.user.id;
      const endpoint = 'set_greeting_message';

      await safeApiCall(endpoint, () => 
        setGreetingMessage(tg.initData, parseInt(chatId), userId, message.trim())
      );
      
      setMessage(message.trim());
    } catch (error) {
      console.error('Error saving greeting message:', error)
      setError(error instanceof Error ? error.message : 'Failed to save greeting message')
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
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--tg-theme-text-color, white)' }}>Greeting Settings</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>Manage your automated welcome messages</p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6 p-6 rounded-lg" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)' }}>
            <p className="font-medium text-lg mb-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>Error Loading Settings</p>
            <p className="mb-4" style={{ color: 'var(--tg-theme-text-color, white)' }}>{error}</p>
            <p className="text-sm mb-4" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
              You can still configure your greeting settings below. Default values have been provided.
            </p>
            <Button 
              onClick={() => {
                setRetryCount(0);
                setFetchFailed(false);
                fetchGreetingSettings().catch(() => console.log('Manual retry failed'));
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
              {renderGreetingForm()}
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
          Greeting Settings
        </h2>
        <p 
          className="text-sm mt-1"
          style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
        >
          Manage your automated welcome messages
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
            {renderGreetingForm()}
          </CardContent>
        </Card>

        {renderTips()}
      </div>
    </div>
  )

  // Helper function to render the greeting form
  function renderGreetingForm() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label style={{ color: 'var(--tg-theme-text-color, white)' }} className="text-lg">Enable Welcome Message</Label>
            <p className="text-sm mt-1" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
              When enabled, the bot will automatically greet new members
            </p>
          </div>
          <Switch 
            checked={enabled} 
            onCheckedChange={handleToggleGreeting}
            disabled={isSubmitting}
            style={{
              backgroundColor: enabled ? 'var(--tg-theme-button-color, #3b82f6)' : 'var(--tg-theme-hint-color, #4b5563)'
            }}
          />
        </div>

        <div className="space-y-2">
          <Label style={{ color: 'var(--tg-theme-text-color, white)' }} className="text-lg">Greeting Message</Label>
          <p className="text-sm mb-2" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
            This message will be sent to new members when they join
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your greeting message here..."
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
          disabled={isSubmitting || !message.trim()}
          style={{
            backgroundColor: 'var(--tg-theme-button-color, #3b82f6)',
            color: 'var(--tg-theme-button-text-color, white)'
          }}
          className="w-full"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Save Greeting Message
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
            <h3 className="text-xl font-medium mb-4" style={{ color: 'var(--tg-theme-text-color, white)' }}>Tips for effective greeting messages</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>
                <span style={{ color: 'var(--tg-theme-link-color, #3b82f6)' }} className="font-bold">•</span>
                Welcome new members warmly and make them feel included
              </li>
              <li className="flex items-start gap-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>
                <span style={{ color: 'var(--tg-theme-link-color, #3b82f6)' }} className="font-bold">•</span>
                Introduce the purpose of your group or channel
              </li>
              <li className="flex items-start gap-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>
                <span style={{ color: 'var(--tg-theme-link-color, #3b82f6)' }} className="font-bold">•</span>
                Share important rules or guidelines
              </li>
              <li className="flex items-start gap-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>
                <span style={{ color: 'var(--tg-theme-link-color, #3b82f6)' }} className="font-bold">•</span>
                Include helpful resources for newcomers
              </li>
              <li className="flex items-start gap-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>
                <span style={{ color: 'var(--tg-theme-link-color, #3b82f6)' }} className="font-bold">•</span>
                Keep it concise but informative
              </li>
              <li className="flex items-start gap-2" style={{ color: 'var(--tg-theme-text-color, white)' }}>
                <span style={{ color: 'var(--tg-theme-link-color, #3b82f6)' }} className="font-bold">•</span>
                Use <code style={{ color: 'var(--tg-theme-text-color, white)' }}>{'{username}'}</code> to mention the new member
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }
} 