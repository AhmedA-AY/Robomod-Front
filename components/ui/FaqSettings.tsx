'use client'

import { useState, useEffect, useCallback } from 'react'
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

export default function FaqSettings({ chatId }: { chatId: string }) {
  const [settings, setSettings] = useState<FaqSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchFaqSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        throw new Error('Telegram Web App is not initialized')
      }

      // Construct the URL with query parameters
      const url = new URL('https://robomod.dablietech.club/api/get_faq_settings')
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
        throw new Error(errorData?.message || 'Failed to fetch FAQ settings')
      }

      const data = await response.json()
      
      // Set the state with the retrieved settings
      if (data) {
        setSettings(data)
        setMessage(data.message || '')
        setEnabled(data.enabled || false)
      }
    } catch (error) {
      console.error('Error fetching FAQ settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch FAQ settings')
    } finally {
      setIsLoading(false)
    }
  }, [chatId])

  useEffect(() => {
    fetchFaqSettings()
  }, [fetchFaqSettings])

  const handleToggleFaq = async (newEnabledState: boolean) => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        throw new Error('Telegram Web App is not initialized')
      }

      // Construct the URL with query parameters
      const url = new URL('https://robomod.dablietech.club/api/toggle_faq')
      url.searchParams.append('chat_id', chatId)
      url.searchParams.append('enabled', newEnabledState.toString())

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to toggle FAQ')
      }

      // Update local state
      setEnabled(newEnabledState)
      if (settings) {
        setSettings({
          ...settings,
          enabled: newEnabledState
        })
      }
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

      // Construct the URL with query parameters
      const url = new URL('https://robomod.dablietech.club/api/set_faq_message')
      url.searchParams.append('chat_id', chatId)
      url.searchParams.append('message', message.trim())

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to save FAQ message')
      }

      // Update local state
      if (settings) {
        setSettings({
          ...settings,
          message: message.trim()
        })
      }
    } catch (error) {
      console.error('Error saving FAQ message:', error)
      setError(error instanceof Error ? error.message : 'Failed to save FAQ message')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
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
        <h2 className="text-2xl font-semibold tracking-tight">FAQ Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Manage your automated FAQ responses</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm mb-8 shadow-xl">
          <CardContent className="p-6">
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
          </CardContent>
        </Card>

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
      </div>
    </div>
  )
} 