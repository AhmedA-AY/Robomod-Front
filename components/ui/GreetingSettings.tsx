'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import * as React from "react"
import { Label } from "@/components/ui/label"

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
    
    // Update the timestamp for this endpoint
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

      // Use URLSearchParams to properly format query parameters
      const params = new URLSearchParams()
      params.append('chat_id', chatId)
      
      const endpoint = '/api/greeting'
      const urlString = `https://robomod.dablietech.club${endpoint}?${params.toString()}`
      console.log('Fetching greeting settings with URL:', urlString)

      // Use the safe API call function with endpoint tracking
      const response = await safeApiCall(endpoint, () => fetch(urlString, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
          'Content-Type': 'application/json',
        }
      }))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error fetching greeting settings:', errorText)
        let errorMessage = 'Failed to fetch greeting settings'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData?.message || errorData?.detail || `${response.status} ${response.statusText}`
        } catch {
          // If JSON parsing fails, use the error text
          errorMessage = errorText || `${response.status} ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }

      // Get the response as text first to check for malformed JSON
      const responseText = await response.text()
      console.log('Raw greeting settings response:', responseText)
      
      let data: GreetingSettings | null = null
      
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
      
      console.log('Processed greeting settings:', data)
      
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

      // Use URLSearchParams to properly format query parameters
      const params = new URLSearchParams()
      params.append('chat_id', chatId)
      params.append('enabled', newEnabledState.toString())
      
      const endpoint = '/api/toggle_greeting'
      const urlString = `https://robomod.dablietech.club${endpoint}?${params.toString()}`
      console.log('Toggling greeting with URL:', urlString)
      console.log('Request details:', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
          'Content-Type': 'application/json',
        },
      })

      // Use the safe API call function with endpoint tracking
      const response = await safeApiCall(endpoint, () => {
        console.log('Making API call to:', urlString)
        return fetch(urlString, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tg.initData}`,
            'Content-Type': 'application/json',
          },
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error toggling greeting:', errorText)
        let errorMessage = 'Failed to toggle greeting'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData?.message || errorData?.detail || `${response.status} ${response.statusText}`
        } catch {
          // If JSON parsing fails, use the error text
          errorMessage = errorText || `${response.status} ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }

      // Update local state after successful API call
      setEnabled(newEnabledState)
      
      // Show success notification or feedback to the user
      console.log('Greeting toggled successfully')
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

      // Validate message
      if (!message.trim()) {
        throw new Error('Greeting message cannot be empty')
      }

      // Use URLSearchParams to properly format query parameters
      const params = new URLSearchParams()
      params.append('chat_id', chatId)
      params.append('message', message.trim())
      
      const endpoint = '/api/set_greeting_message'
      const urlString = `https://robomod.dablietech.club${endpoint}?${params.toString()}`
      console.log('Saving greeting message with URL:', urlString)

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
        console.error('Error saving greeting message:', errorText)
        let errorMessage = 'Failed to save greeting message'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData?.message || errorData?.detail || errorData?.error || `${response.status} ${response.statusText}`
        } catch {
          // If JSON parsing fails, use the error text
          errorMessage = errorText || `${response.status} ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }
      
      // Update the local state
      setMessage(message.trim())
      
      // Show success notification or feedback to the user
      console.log('Greeting message saved successfully')
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