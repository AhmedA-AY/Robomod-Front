'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from 'lucide-react'
import * as React from "react"
import { getFaqSettings, toggleFaq, setFaqMessage } from '@/lib/api'

interface FaqSettings {
  enabled: boolean;
  message: string;
}

// Rate limiting timestamps by endpoint
interface EndpointTimestamps {
  [endpoint: string]: number;
}

export default function FaqSettings({ chatId }: { chatId: string }) {
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
  const safeApiCall = useCallback(async (endpoint: string, apiCall: () => Promise<{ message: string; enabled: boolean }>): Promise<{ message: string; enabled: boolean }> => {
    const now = Date.now()
    const lastCallTime = lastApiCallsRef.current[endpoint] || 0
    const timeSinceLastCall = now - lastCallTime
    
    // Ensure at least 1100ms between API calls to the same endpoint (adding 100ms buffer)
    if (timeSinceLastCall < 1100) {
      const waitTime = 1100 - timeSinceLastCall
      console.log(`Rate limiting for ${endpoint}: waiting ${waitTime}ms before API call`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    // Update the timestamp for this endpoint (synchronously with ref)
    lastApiCallsRef.current[endpoint] = Date.now()
    
    try {
      return await apiCall()
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error)
      throw error
    }
  }, [])

  const fetchFaqSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        console.error('Telegram Web App not initialized')
        setError('Telegram Web App is not initialized')
        setFetchFailed(true)
        return
      }
      
      if (!tg.initDataUnsafe.user?.id) {
        console.error('User ID not available')
        setError('User ID not available')
        setFetchFailed(true)
        return
      }

      const userId = tg.initDataUnsafe.user.id;
      const endpoint = 'faq_settings'
      
      try {
        // Use the safe API call function with endpoint tracking
        const data = await safeApiCall(endpoint, () => 
          getFaqSettings(tg.initData, parseInt(chatId), userId)
        );
        
        console.log('Processed FAQ settings:', data)
        
        // Set the state with the retrieved settings
        if (data) {
          setMessage(data.message || '')
          setEnabled(data.enabled || false)
          // Reset retry count and fetch failed flag on success
          setRetryCount(0)
          setFetchFailed(false)
        } else {
          // Handle empty response
          console.warn('Received empty data from API')
          setMessage('')
          setEnabled(false)
        }
      } catch (fetchError) {
        console.error('Error during fetch:', fetchError)
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch FAQ settings')
        
        // Mark fetch as failed but don't reset retry count
        setFetchFailed(true)
        throw fetchError
      }
    } catch (error) {
      console.error('Error fetching FAQ settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch FAQ settings')
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
      console.log(`Retrying FAQ settings fetch (${retryCount + 1}/3) after ${backoffTime/1000}s...`)
      
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        fetchFaqSettings().catch(() => {
          // Catch and ignore errors here to prevent unhandled rejections
          console.log('Retry attempt failed')
        })
      }, backoffTime)
      
      return () => clearTimeout(timer)
    } else if (retryCount >= 3) {
      // After 3 retries, mark the fetch as permanently failed
      console.log('Maximum retry attempts reached, giving up')
      setFetchFailed(true)
    }
  }, [error, retryCount, fetchFaqSettings, fetchFailed])

  // Initial fetch
  useEffect(() => {
    fetchFaqSettings().catch(() => {
      // Catch and ignore errors here to prevent unhandled rejections
      console.log('Initial fetch failed')
    })
  }, [fetchFaqSettings])

  const handleToggleFaq = async (newEnabledState: boolean) => {
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
      const endpoint = 'toggle_faq'
      
      // Use the safe API call function with endpoint tracking
      await safeApiCall(endpoint, () => 
        toggleFaq(tg.initData, parseInt(chatId), userId, newEnabledState)
      );
      
      // Update local state if the API call succeeded
      setEnabled(newEnabledState)
      console.log(`FAQ has been ${newEnabledState ? 'enabled' : 'disabled'}`)
      
    } catch (error) {
      console.error('Error toggling FAQ:', error)
      setError(error instanceof Error ? error.message : 'Failed to toggle FAQ')
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

      const userId = tg.initDataUnsafe.user.id;
      const endpoint = 'set_faq_message'
      
      // Use the safe API call function with endpoint tracking
      await safeApiCall(endpoint, () => 
        setFaqMessage(tg.initData, parseInt(chatId), userId, message)
      );
      
      console.log('FAQ message has been updated')
      
    } catch (error) {
      console.error('Error saving FAQ message:', error)
      setError(error instanceof Error ? error.message : 'Failed to save FAQ message')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading && retryCount === 0 && !fetchFailed) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--tg-theme-bg-color, #1f2937)' }}>
        <Loader2 className="w-6 h-6 animate-spin text-[var(--tg-theme-hint-color,#a0aec0)]" />
      </div>
    )
  }

  // Show error message if we've completely failed to fetch and have no settings
  // but also provide a way to continue using the form with default values
  if (error && fetchFailed) {
    return (
      <div className="flex items-center justify-center h-full p-4" style={{ backgroundColor: 'var(--tg-theme-bg-color, #1f2937)' }}>
         <div
           className="p-6 rounded-lg max-w-md text-center border"
           style={{
             backgroundColor: 'rgba(239, 68, 68, 0.1)', // Reddish background for error
             borderColor: 'rgba(239, 68, 68, 0.5)', // Reddish border
           }}
         >
           <p className="font-medium text-lg mb-2" style={{ color: 'var(--tg-theme-destructive-text-color, #ef4444)'}}>Error</p>
           <p className="" style={{ color: 'var(--tg-theme-text-color, white)'}}>{error}</p>
         </div>
      </div>
    )
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: 'var(--tg-theme-bg-color, #1f2937)' }}
    >
      {/* Header */}
      <div
        className="p-6 border-b"
        style={{ borderColor: 'var(--tg-theme-hint-color, #4b5563)' }}
      >
        <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--tg-theme-text-color, white)' }}>FAQ Settings</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>Manage automated responses to frequently asked questions.</p>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Enable Toggle */}
          <div
            className="flex items-center justify-between p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
              borderColor: 'var(--tg-theme-hint-color, #4b5563)'
            }}
           >
            <div>
              <Label className="text-lg" style={{ color: 'var(--tg-theme-text-color, white)' }}>Enable FAQ</Label>
              <p className="text-sm mt-1" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
                When enabled, the bot will automatically respond.
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggleFaq}
              disabled={isSubmitting}
              // Assuming Switch component uses theme variables or accepts style prop for colors
              // If not, may need custom styling or component modification
              // Example using data attributes if shadcn switch:
              className="data-[state=checked]:bg-[var(--tg-theme-button-color,#3b82f6)] data-[state=unchecked]:bg-[var(--tg-theme-secondary-bg-color,#4b5563)]"
            />
          </div>

          {/* Message Textarea */}
          <div className="space-y-2">
            <Label className="text-lg" style={{ color: 'var(--tg-theme-text-color, white)' }}>FAQ Message</Label>
            <p className="text-sm mb-2" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
              This message will be used to answer questions.
            </p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your FAQ message here..."
              className="border min-h-[200px] text-[var(--tg-theme-text-color,white)] placeholder:text-[var(--tg-theme-hint-color,#a0aec0)] focus-visible:ring-offset-0 focus-visible:ring-[var(--tg-theme-button-color,#3b82f6)]"
              style={{
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
                borderColor: 'var(--tg-theme-hint-color, #4b5563)'
              }}
              disabled={isSubmitting}
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveMessage}
            disabled={isSubmitting || !message.trim()}
            className="w-full disabled:opacity-50"
             style={{
               backgroundColor: 'var(--tg-theme-button-color, #3b82f6)',
               color: 'var(--tg-theme-button-text-color, white)',
             }}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Save FAQ Message
          </Button>
        </div>
      </div>
    </div>
  )
} 