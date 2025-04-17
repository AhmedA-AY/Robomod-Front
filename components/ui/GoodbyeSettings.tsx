'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import * as React from "react"
import { Label } from "@/components/ui/label"

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

  const fetchGoodbyeSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        throw new Error('Telegram Web App is not initialized')
      }

      // Use URLSearchParams to properly format query parameters
      const params = new URLSearchParams()
      params.append('chat_id', chatId)
      
      const endpoint = '/api/goodbye'
      const urlString = `https://robomod.dablietech.club${endpoint}?${params.toString()}`
      console.log('Fetching goodbye settings with URL:', urlString)

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
        console.error('Error fetching goodbye settings:', errorText)
        let errorMessage = 'Failed to fetch goodbye settings'
        
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
      console.log('Raw goodbye settings response:', responseText)
      
      let data: GoodbyeSettings | null = null
      
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
      
      console.log('Processed goodbye settings:', data)
      
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

      const params = new URLSearchParams()
      params.append('chat_id', chatId)
      
      const endpoint = '/api/goodbye'
      const urlString = `https://robomod.dablietech.club${endpoint}?${params.toString()}`

      const response = await safeApiCall(endpoint, () => fetch(urlString, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: newEnabledState,
          message: message
        })
      }))
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to update goodbye settings'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData?.message || errorData?.detail || `${response.status} ${response.statusText}`
        } catch {
          errorMessage = errorText || `${response.status} ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }

      setEnabled(newEnabledState)
      console.log('Goodbye settings updated successfully')
    } catch (error) {
      console.error('Error updating goodbye settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to update goodbye settings')
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

      if (!message.trim()) {
        throw new Error('Goodbye message cannot be empty')
      }

      const params = new URLSearchParams()
      params.append('chat_id', chatId)
      
      const endpoint = '/api/goodbye'
      const urlString = `https://robomod.dablietech.club${endpoint}?${params.toString()}`

      const response = await safeApiCall(endpoint, () => fetch(urlString, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: enabled,
          message: message.trim()
        })
      }))
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to save goodbye message'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData?.message || errorData?.detail || `${response.status} ${response.statusText}`
        } catch {
          errorMessage = errorText || `${response.status} ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }
      
      setMessage(message.trim())
      console.log('Goodbye message saved successfully')
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
            {renderGoodbyeForm()}
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
            className="data-[state=checked]:bg-green-500"
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
    )
  }

  // Helper function to render tips
  function renderTips() {
    return (
      <div className="space-y-4">
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="text-xl font-medium text-white mb-4">Tips for effective goodbye messages</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                Keep the message respectful and positive
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                Avoid being overly emotional or negative
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                Use appropriate tone based on your community style
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                Use <code>{'{username}'}</code> to mention the departed member
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                Consider mentioning how to rejoin if they want to come back
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }
} 