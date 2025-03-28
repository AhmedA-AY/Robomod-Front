'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import * as React from "react"
import { Label } from "@/components/ui/label"

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
          <h2 className="text-2xl font-semibold tracking-tight">FAQ Settings</h2>
          <p className="text-sm text-gray-400 mt-1">Manage your automated FAQ responses</p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6 bg-destructive/10 p-6 rounded-lg">
            <p className="text-destructive font-medium text-lg mb-2">Error Loading Settings</p>
            <p className="text-foreground/90 mb-4">{error}</p>
            <p className="text-foreground/70 text-sm mb-4">
              You can still configure your FAQ settings below. Default values have been provided.
            </p>
            <Button 
              onClick={() => {
                setRetryCount(0);
                setFetchFailed(false);
                fetchFaqSettings().catch(() => console.log('Manual retry failed'));
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
              {renderFaqForm()}
            </CardContent>
          </Card>

          {renderTips()}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="p-6 border-b border-gray-700/50">
        <h2 className="text-2xl font-semibold tracking-tight">FAQ Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Manage your automated FAQ responses</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-6 bg-yellow-500/10 p-4 rounded-lg">
            <p className="text-yellow-400 font-medium mb-1">Warning</p>
            <p className="text-foreground/90 text-sm">{error}</p>
          </div>
        )}

        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm mb-8 shadow-xl">
          <CardContent className="p-6">
            {renderFaqForm()}
          </CardContent>
        </Card>

        {renderTips()}
      </div>
    </div>
  )

  // Helper function to render the FAQ form
  function renderFaqForm() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-white text-lg">Enable FAQ</Label>
            <p className="text-gray-400 text-sm mt-1">
              When enabled, the bot will automatically respond to common questions
            </p>
          </div>
          <Switch 
            checked={enabled} 
            onCheckedChange={handleToggleFaq}
            disabled={isSubmitting}
            className="data-[state=checked]:bg-green-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white text-lg">FAQ Message</Label>
          <p className="text-gray-400 text-sm mb-2">
            This message will be used to answer questions from users
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your FAQ message here..."
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
          Save FAQ Message
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
            <h3 className="text-xl font-medium text-white mb-4">Tips for effective FAQ messages</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                Keep your FAQ message clear and concise
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                Include the most frequently asked questions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                Organize questions and answers in a logical order
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                Use formatting to improve readability (bold, lists, etc.)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                Update your FAQ regularly based on new questions
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }
} 