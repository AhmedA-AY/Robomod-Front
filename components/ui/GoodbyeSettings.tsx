'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import * as React from "react"
import { Label } from "@/components/ui/label"
import { getGoodbyeSettings, toggleGoodbye, setGoodbyeMessage } from '@/lib/api'

interface GoodbyeSettings {
  enabled: boolean;
  message: string;
}

// Type for tracking API timestamps
interface EndpointTimestamps {
  [key: string]: number;
}

export default function GoodbyeSettings({ chatId }: { chatId: string }) {
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
  const safeApiCall = useCallback(async (endpoint: string, apiCall: () => Promise<GoodbyeSettings>): Promise<GoodbyeSettings> => {
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

  const fetchGoodbyeSettings = useCallback(async () => {
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
      const endpoint = 'goodbye_settings';

      const data = await safeApiCall(endpoint, () => 
        getGoodbyeSettings(tg.initData, parseInt(chatId), userId)
      );
      
      setMessage(data.message || '');
      setEnabled(data.enabled || false);
      setRetryCount(0);
      setFetchFailed(false);
    } catch (error) {
      console.error('Error fetching goodbye settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch goodbye settings')
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
      console.log(`Retrying goodbye settings fetch (${retryCount + 1}/3) after ${backoffTime/1000}s...`)
      
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        fetchGoodbyeSettings().catch(() => {
          // Catch and ignore errors here to prevent unhandled rejections
          console.log('Retry attempt failed')
        })
      }, backoffTime)
      
      return () => clearTimeout(timer)
    }
  }, [error, retryCount, fetchGoodbyeSettings, fetchFailed])

  // Initial fetch of goodbye settings
  useEffect(() => {
    fetchGoodbyeSettings().catch(() => {
      // Catch and ignore initial fetch errors to prevent unhandled rejections
      console.log('Initial fetch failed, will retry if configured')
    })
  }, [fetchGoodbyeSettings])

  const handleToggleGoodbye = async (newEnabledState: boolean) => {
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
      const endpoint = 'toggle_goodbye';

      await safeApiCall(endpoint, () => 
        toggleGoodbye(tg.initData, parseInt(chatId), userId, newEnabledState)
      );
      
      setEnabled(newEnabledState);
    } catch (error) {
      console.error('Error toggling goodbye:', error)
      setError(error instanceof Error ? error.message : 'Failed to toggle goodbye')
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
        throw new Error('Goodbye message cannot be empty')
      }

      const userId = tg.initDataUnsafe.user.id;
      const endpoint = 'set_goodbye_message';

      await safeApiCall(endpoint, () => 
        setGoodbyeMessage(tg.initData, parseInt(chatId), userId, message.trim())
      );
      
      setMessage(message.trim());
    } catch (error) {
      console.error('Error saving goodbye message:', error)
      setError(error instanceof Error ? error.message : 'Failed to save goodbye message')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading && retryCount === 0 && !fetchFailed) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  // Show error message if we've completely failed to fetch and have no settings
  // but also provide a way to continue using the form with default values
  if (error && fetchFailed) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="p-6 border-b border-gray-700/50">
          <h2 className="text-2xl font-semibold tracking-tight">Goodbye Settings</h2>
          <p className="text-sm text-gray-400 mt-1">Manage your automated goodbye messages</p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6 bg-destructive/10 p-6 rounded-lg">
            <p className="text-destructive font-medium text-lg mb-2">Error Loading Settings</p>
            <p className="text-foreground/90 mb-4">{error}</p>
            <p className="text-foreground/70 text-sm mb-4">
              You can still configure your goodbye settings below. Default values have been provided.
            </p>
            <Button 
              onClick={() => {
                setRetryCount(0);
                setFetchFailed(false);
                fetchGoodbyeSettings().catch(() => console.log('Manual retry failed'));
              }}
              className="bg-primary text-white"
              size="sm"
            >
              Retry Loading Settings
            </Button>
          </div>

          {/* Show the form with default values */}
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm mb-8 shadow-xl">
            <CardContent className="p-6">
              {renderGoodbyeForm()}
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
          Goodbye Settings
        </h2>
        <p 
          className="text-sm mt-1"
          style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
        >
          Manage your automated goodbye messages
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label 
                    className="text-lg"
                    style={{ color: 'var(--tg-theme-text-color, white)' }}
                  >
                    Enable Goodbye Message
                  </Label>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
                  >
                    When enabled, the bot will automatically post when members leave
                  </p>
                </div>
                <Switch 
                  checked={enabled} 
                  onCheckedChange={handleToggleGoodbye}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label 
                  className="text-lg"
                  style={{ color: 'var(--tg-theme-text-color, white)' }}
                >
                  Goodbye Message
                </Label>
                <p 
                  className="text-sm mb-2"
                  style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
                >
                  This message will be sent when members leave the group
                </p>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your goodbye message here..."
                  style={{
                    backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
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
                Save Goodbye Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {renderTips()}
      </div>
    </div>
  )

  // Helper function to render the goodbye form
  function renderGoodbyeForm() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-white text-lg">Enable Goodbye Message</Label>
            <p className="text-gray-400 text-sm mt-1">
              When enabled, the bot will automatically post when members leave
            </p>
          </div>
          <Switch 
            checked={enabled} 
            onCheckedChange={handleToggleGoodbye}
            disabled={isSubmitting}
            className="data-[state=checked]:bg-green-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white text-lg">Goodbye Message</Label>
          <p className="text-gray-400 text-sm mb-2">
            This message will be sent when members leave the group
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your goodbye message here..."
            className="bg-[#374151] border-gray-600 text-white min-h-[200px]"
            disabled={isSubmitting}
          />
        </div>

        <Button 
          onClick={handleSaveMessage} 
          disabled={isSubmitting || !message.trim()}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Save Goodbye Message
        </Button>
      </div>
    )
  }

  // Helper function to render tips
  function renderTips() {
    return (
      <div className="space-y-4">
        <Card 
          className="backdrop-blur-sm"
          style={{
            backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
            borderColor: 'var(--tg-theme-hint-color, #4b5563)'
          }}
        >
          <CardContent className="p-6">
            <h3 
              className="text-xl font-medium mb-4"
              style={{ color: 'var(--tg-theme-text-color, white)' }}
            >
              Tips for effective goodbye messages
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span 
                  className="font-bold"
                  style={{ color: 'var(--tg-theme-button-color, #3b82f6)' }}
                >•</span>
                <span style={{ color: 'var(--tg-theme-text-color, white)' }}>
                  Keep the message respectful and positive
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span 
                  className="font-bold"
                  style={{ color: 'var(--tg-theme-button-color, #3b82f6)' }}
                >•</span>
                <span style={{ color: 'var(--tg-theme-text-color, white)' }}>
                  Avoid being overly emotional or negative
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span 
                  className="font-bold"
                  style={{ color: 'var(--tg-theme-button-color, #3b82f6)' }}
                >•</span>
                <span style={{ color: 'var(--tg-theme-text-color, white)' }}>
                  Use appropriate tone based on your community style
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span 
                  className="font-bold"
                  style={{ color: 'var(--tg-theme-button-color, #3b82f6)' }}
                >•</span>
                <span style={{ color: 'var(--tg-theme-text-color, white)' }}>
                  Use <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--tg-theme-bg-color, #1f2937)', color: 'var(--tg-theme-text-color, white)' }}>{'{username}'}</code> to mention the departed member
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span 
                  className="font-bold"
                  style={{ color: 'var(--tg-theme-button-color, #3b82f6)' }}
                >•</span>
                <span style={{ color: 'var(--tg-theme-text-color, white)' }}>
                  Consider mentioning how to rejoin if they want to come back
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }
} 