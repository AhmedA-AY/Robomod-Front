'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from 'lucide-react'
import * as React from "react"

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
  const safeApiCall = useCallback(async (endpoint: string, apiCall: () => Promise<Response>): Promise<Response> => {
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

      // Use URLSearchParams to properly format query parameters
      const params = new URLSearchParams()
      params.append('chat_id', chatId)
      
      const endpoint = '/api/get_faq_settings'
      const urlString = `https://robomod.dablietech.club${endpoint}?${params.toString()}`
      console.log('Fetching FAQ settings from URL:', urlString)

      try {
        // Use the safe API call function with endpoint tracking
        const response = await safeApiCall(endpoint, () => fetch(urlString, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tg.initData}`,
            'Content-Type': 'application/json',
          },
        }))
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Error response from API:', errorText)
          let errorMessage = 'Failed to fetch FAQ settings'
          
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData?.message || errorData?.detail || errorData?.error || `${response.status} ${response.statusText}`
          } catch {
            // If JSON parsing fails, use the error text
            errorMessage = errorText || `${response.status} ${response.statusText}`
          }
          
          throw new Error(errorMessage)
        }

        // Get response as text first so we can inspect and handle malformed JSON
        const responseText = await response.text()
        console.log('Raw API response:', responseText)
        
        let data
        
        if (!responseText || responseText.trim() === '') {
          console.warn('Empty response from API, using default values')
          data = { enabled: false, message: '' }
        } else {
          try {
            // Try to parse the response as JSON
            data = JSON.parse(responseText)
          } catch (parseError) {
            console.error('Error parsing JSON response:', parseError)
            console.warn('Attempting to fix malformed JSON response')
            
            // Basic fix for known malformed response format
            // The API sometimes returns: "faq": ( "enabled": false, "message_id*: null
            // Try to extract values using regex as a fallback
            let enabled = false
            let message = ''
            
            try {
              // Try to extract "enabled" value
              const enabledMatch = responseText.match(/"enabled"\s*:\s*(true|false)/)
              if (enabledMatch && enabledMatch[1]) {
                enabled = enabledMatch[1] === 'true'
              }
              
              // Try to extract message
              const messageMatch = responseText.match(/"message(?:_id)?"\s*:\s*"([^"]*)"/)
              if (messageMatch && messageMatch[1]) {
                message = messageMatch[1]
              }
              
              // Create a valid data object
              data = { enabled, message }
              console.log('Extracted data from malformed JSON:', data)
            } catch (extractError) {
              console.error('Failed to extract data from malformed JSON:', extractError)
              // Fallback to default values
              data = { enabled: false, message: '' }
            }
          }
        }
        
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

      // Use URLSearchParams to properly format query parameters
      const params = new URLSearchParams()
      params.append('chat_id', chatId)
      params.append('enabled', newEnabledState.toString())
      
      const endpoint = '/api/toggle_faq'
      const urlString = `https://robomod.dablietech.club${endpoint}?${params.toString()}`
      console.log('Toggling FAQ with URL:', urlString)
      console.log('Request details:', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
          'Content-Type': 'application/json',
        },
      })

      // Use the safe API call function with endpoint tracking
      const response = await safeApiCall(endpoint, () => {
        console.log('Making API call to:', urlString)
        return fetch(urlString, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tg.initData}`,
            'Content-Type': 'application/json',
          },
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error toggling FAQ:', errorText)
        let errorMessage = 'Failed to toggle FAQ settings'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData?.message || errorData?.detail || errorData?.error || `${response.status} ${response.statusText}`
        } catch {
          // If JSON parsing fails, use the error text
          errorMessage = errorText || `${response.status} ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }

      // Update local state after successful API call
      setEnabled(newEnabledState)
      
      // Update the settings object after successful API call
      setMessage(message.trim())
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

      // Validate message
      if (!message.trim()) {
        throw new Error('FAQ message cannot be empty')
      }

      // Use URLSearchParams to properly format query parameters
      const params = new URLSearchParams()
      params.append('chat_id', chatId)
      params.append('message', message.trim())
      
      const endpoint = '/api/set_faq_message'
      const urlString = `https://robomod.dablietech.club${endpoint}?${params.toString()}`
      console.log('Saving FAQ message with URL:', urlString)

      // Use the safe API call function with endpoint tracking
      const response = await safeApiCall(endpoint, () => fetch(urlString, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
          'Content-Type': 'application/json',
        },
      }))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error saving FAQ message:', errorText)
        let errorMessage = 'Failed to save FAQ message'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData?.message || errorData?.detail || errorData?.error || `${response.status} ${response.statusText}`
        } catch {
          // If JSON parsing fails, use the error text
          errorMessage = errorText || `${response.status} ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }

      // Update the settings object after successful API call
      setMessage(message.trim())
      
      // Show success notification or feedback to the user
      console.log('FAQ message saved successfully')
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