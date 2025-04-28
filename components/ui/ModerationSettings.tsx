'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, MessageCircle, Shield } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getModerationSettings, updateModerationSettings } from '@/lib/api'
import type { ModerationSettings as ModerationSettingsType } from '@/types/moderation'

interface ModerationSettings {
  warning_system_enabled: boolean;
  max_warnings: number;
  warning_action: string;
  warning_mute_duration: number;
  filters_enabled: boolean;
  forbidden_words: string[];
  forbidden_links: string[];
  anti_flood_enabled: boolean;
  flood_message_limit: number;
  flood_time_limit: number;
  flood_action: string;
  flood_restrict_duration: number;
}

interface EndpointTimestamps {
  [key: string]: number;
}

export default function ModerationSettings({ chatId }: { chatId: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [fetchFailed, setFetchFailed] = useState(false)
  const [settings, setSettings] = useState<ModerationSettings>({
    warning_system_enabled: true,
    max_warnings: 3,
    warning_action: "mute",
    warning_mute_duration: 3600,
    filters_enabled: false,
    forbidden_words: [],
    forbidden_links: [],
    anti_flood_enabled: false,
    flood_message_limit: 5,
    flood_time_limit: 5,
    flood_action: "restrict",
    flood_restrict_duration: 60
  })
  
  // For editing forbidden words and links
  const [forbiddenWordsText, setForbiddenWordsText] = useState('')
  const [forbiddenLinksText, setForbiddenLinksText] = useState('')

  const lastApiCallsRef = useRef<EndpointTimestamps>({})

  const safeApiCall = useCallback(async (endpoint: string, apiCall: () => Promise<ModerationSettingsType>): Promise<ModerationSettingsType> => {
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

  const fetchModerationSettings = useCallback(async () => {
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
      const endpoint = 'moderation_settings';

      const data = await safeApiCall(endpoint, () => 
        getModerationSettings(tg.initData, parseInt(chatId), userId)
      );
      
      setSettings(data);
      
      // Update text areas for easier editing
      setForbiddenWordsText(data.forbidden_words.join('\n'));
      setForbiddenLinksText(data.forbidden_links.join('\n'));
      
      setRetryCount(0)
      setFetchFailed(false)
    } catch (error) {
      console.error('Error fetching moderation settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch moderation settings')
      setFetchFailed(true)
    } finally {
      setIsLoading(false)
    }
  }, [chatId, safeApiCall])

  useEffect(() => {
    if (error && retryCount < 3 && !fetchFailed) {
      const backoffTime = Math.pow(2, retryCount + 1) * 1000
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        fetchModerationSettings().catch(() => {})
      }, backoffTime)
      
      return () => clearTimeout(timer)
    }
  }, [error, retryCount, fetchModerationSettings, fetchFailed])

  useEffect(() => {
    fetchModerationSettings().catch(() => {})
  }, [fetchModerationSettings])

  const handleSaveSettings = async () => {
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

      // Process forbidden words and links from text areas
      const formattedSettings = {
        ...settings,
        forbidden_words: forbiddenWordsText.split('\n').filter(word => word.trim() !== ''),
        forbidden_links: forbiddenLinksText.split('\n').filter(link => link.trim() !== '')
      };

      const userId = tg.initDataUnsafe.user.id;
      const endpoint = 'update_moderation_settings';

      await safeApiCall(endpoint, () => 
        updateModerationSettings(tg.initData, parseInt(chatId), userId, formattedSettings)
      );
      
      // Update the local state with the formatted values
      setSettings(formattedSettings);
      
      console.log('Moderation settings saved successfully')
    } catch (error) {
      console.error('Error saving moderation settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to save moderation settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleWarningSystem = async (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      warning_system_enabled: enabled
    }))
  }

  const handleToggleFilters = async (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      filters_enabled: enabled
    }))
  }

  const handleToggleAntiFlood = async (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      anti_flood_enabled: enabled
    }))
  }

  const handleNumberChange = (field: keyof ModerationSettings, value: string) => {
    const numValue = parseInt(value) || 0;
    setSettings(prev => ({
      ...prev,
      [field]: numValue
    }))
  }

  const handleSelectChange = (field: keyof ModerationSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (isLoading && retryCount === 0 && !fetchFailed) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--tg-theme-hint-color,#a0aec0)]" />
      </div>
    )
  }

  if (error && fetchFailed) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div
          className="p-6 rounded-lg max-w-md text-center border"
          style={{
            backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
            borderColor: 'var(--tg-theme-hint-color, #4b5563)'
          }}
        >
          <p className="font-medium text-lg mb-2" style={{ color: 'var(--tg-theme-text-color, white)'}}>Error</p>
          <p className="mb-4" style={{ color: 'var(--tg-theme-text-color, white)'}}>{error}</p>
          <Button
            onClick={() => {
              setRetryCount(0)
              setFetchFailed(false)
              fetchModerationSettings().catch(() => {})
            }}
            style={{
              backgroundColor: 'var(--tg-theme-button-color, #3b82f6)',
              color: 'var(--tg-theme-button-text-color, white)'
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-4xl mx-auto">
        <Card 
          style={{
            backgroundColor: 'var(--tg-theme-secondary-bg-color, #374151)',
            borderColor: 'var(--tg-theme-hint-color, #4b5563)'
          }}
        >
          <CardContent className="p-6">
            <div className="space-y-8">
              {/* Warning System */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label 
                      className="text-lg flex items-center"
                      style={{ color: 'var(--tg-theme-text-color, white)' }}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Warning System
                    </Label>
                    <p 
                      className="text-sm mt-1"
                      style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
                    >
                      Automatically track and manage user warnings
                    </p>
                  </div>
                  <Switch
                    checked={settings.warning_system_enabled}
                    onCheckedChange={handleToggleWarningSystem}
                    disabled={isSubmitting}
                  />
                </div>

                {settings.warning_system_enabled && (
                  <div className="space-y-4 ml-7">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label style={{ color: 'var(--tg-theme-text-color, white)' }}>
                          Max Warnings
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={settings.max_warnings}
                          onChange={(e) => handleNumberChange('max_warnings', e.target.value)}
                          style={{
                            backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
                            borderColor: 'var(--tg-theme-hint-color, #4b5563)',
                            color: 'var(--tg-theme-text-color, white)'
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label style={{ color: 'var(--tg-theme-text-color, white)' }}>
                          Warning Action
                        </Label>
                        <select
                          value={settings.warning_action}
                          onChange={(e) => handleSelectChange('warning_action', e.target.value)}
                          className="w-full p-2 rounded"
                          style={{
                            backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
                            borderColor: 'var(--tg-theme-hint-color, #4b5563)',
                            color: 'var(--tg-theme-text-color, white)'
                          }}
                          aria-label="Warning Action"
                        >
                          <option value="mute">Mute</option>
                          <option value="kick">Kick</option>
                          <option value="ban">Ban</option>
                        </select>
                      </div>
                    </div>
                    
                    {settings.warning_action === 'mute' && (
                      <div className="space-y-2">
                        <Label style={{ color: 'var(--tg-theme-text-color, white)' }}>
                          Mute Duration (seconds)
                        </Label>
                        <Input
                          type="number"
                          min="30"
                          value={settings.warning_mute_duration}
                          onChange={(e) => handleNumberChange('warning_mute_duration', e.target.value)}
                          style={{
                            backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
                            borderColor: 'var(--tg-theme-hint-color, #4b5563)',
                            color: 'var(--tg-theme-text-color, white)'
                          }}
                        />
                        <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
                          {settings.warning_mute_duration >= 60 ? 
                            `${Math.floor(settings.warning_mute_duration / 60)} minutes ${settings.warning_mute_duration % 60} seconds` : 
                            `${settings.warning_mute_duration} seconds`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Content Filters */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label 
                      className="text-lg flex items-center"
                      style={{ color: 'var(--tg-theme-text-color, white)' }}
                    >
                      <Shield className="w-5 h-5 mr-2" />
                      Content Filters
                    </Label>
                    <p 
                      className="text-sm mt-1"
                      style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
                    >
                      Block forbidden words and links
                    </p>
                  </div>
                  <Switch
                    checked={settings.filters_enabled}
                    onCheckedChange={handleToggleFilters}
                    disabled={isSubmitting}
                  />
                </div>

                {settings.filters_enabled && (
                  <div className="space-y-4 ml-7">
                    <div className="space-y-2">
                      <Label style={{ color: 'var(--tg-theme-text-color, white)' }}>
                        Forbidden Words
                      </Label>
                      <Textarea
                        placeholder="Enter one word per line"
                        value={forbiddenWordsText}
                        onChange={(e) => setForbiddenWordsText(e.target.value)}
                        style={{
                          backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
                          borderColor: 'var(--tg-theme-hint-color, #4b5563)',
                          color: 'var(--tg-theme-text-color, white)',
                          minHeight: '100px'
                        }}
                      />
                      <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
                        Enter one word or phrase per line to be blocked
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label style={{ color: 'var(--tg-theme-text-color, white)' }}>
                        Forbidden Links
                      </Label>
                      <Textarea
                        placeholder="Enter one URL or domain per line"
                        value={forbiddenLinksText}
                        onChange={(e) => setForbiddenLinksText(e.target.value)}
                        style={{
                          backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
                          borderColor: 'var(--tg-theme-hint-color, #4b5563)',
                          color: 'var(--tg-theme-text-color, white)',
                          minHeight: '100px'
                        }}
                      />
                      <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
                        Enter one URL or domain per line to be blocked
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Anti-Flood Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label 
                      className="text-lg flex items-center"
                      style={{ color: 'var(--tg-theme-text-color, white)' }}
                    >
                      Anti-Flood Protection
                    </Label>
                    <p 
                      className="text-sm mt-1"
                      style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
                    >
                      Prevent message flooding
                    </p>
                  </div>
                  <Switch
                    checked={settings.anti_flood_enabled}
                    onCheckedChange={handleToggleAntiFlood}
                    disabled={isSubmitting}
                  />
                </div>

                {settings.anti_flood_enabled && (
                  <div className="space-y-4 ml-7">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label style={{ color: 'var(--tg-theme-text-color, white)' }}>
                          Message Limit
                        </Label>
                        <Input
                          type="number"
                          min="2"
                          value={settings.flood_message_limit}
                          onChange={(e) => handleNumberChange('flood_message_limit', e.target.value)}
                          style={{
                            backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
                            borderColor: 'var(--tg-theme-hint-color, #4b5563)',
                            color: 'var(--tg-theme-text-color, white)'
                          }}
                        />
                        <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
                          Maximum number of messages allowed
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label style={{ color: 'var(--tg-theme-text-color, white)' }}>
                          Time Limit (seconds)
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={settings.flood_time_limit}
                          onChange={(e) => handleNumberChange('flood_time_limit', e.target.value)}
                          style={{
                            backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
                            borderColor: 'var(--tg-theme-hint-color, #4b5563)',
                            color: 'var(--tg-theme-text-color, white)'
                          }}
                        />
                        <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
                          Time window to count messages
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label style={{ color: 'var(--tg-theme-text-color, white)' }}>
                          Flood Action
                        </Label>
                        <select
                          value={settings.flood_action}
                          onChange={(e) => handleSelectChange('flood_action', e.target.value)}
                          className="w-full p-2 rounded"
                          style={{
                            backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
                            borderColor: 'var(--tg-theme-hint-color, #4b5563)',
                            color: 'var(--tg-theme-text-color, white)'
                          }}
                          aria-label="Flood Action"
                        >
                          <option value="restrict">Restrict</option>
                          <option value="mute">Mute</option>
                          <option value="kick">Kick</option>
                          <option value="ban">Ban</option>
                        </select>
                      </div>
                      {(settings.flood_action === 'restrict' || settings.flood_action === 'mute') && (
                        <div className="space-y-2">
                          <Label style={{ color: 'var(--tg-theme-text-color, white)' }}>
                            Restriction Duration (seconds)
                          </Label>
                          <Input
                            type="number"
                            min="30"
                            value={settings.flood_restrict_duration}
                            onChange={(e) => handleNumberChange('flood_restrict_duration', e.target.value)}
                            style={{
                              backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
                              borderColor: 'var(--tg-theme-hint-color, #4b5563)',
                              color: 'var(--tg-theme-text-color, white)'
                            }}
                          />
                          <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}>
                            {settings.flood_restrict_duration >= 60 ? 
                              `${Math.floor(settings.flood_restrict_duration / 60)} minutes ${settings.flood_restrict_duration % 60} seconds` : 
                              `${settings.flood_restrict_duration} seconds`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveSettings}
                disabled={isSubmitting}
                className="w-full"
                style={{
                  backgroundColor: 'var(--tg-theme-button-color, #3b82f6)',
                  color: 'var(--tg-theme-button-text-color, white)'
                }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save Moderation Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 