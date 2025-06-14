'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { GamificationSettings as GamificationSettingsType, PointAllocations, LevelSettings } from '@/types/gamification'
import { getGamificationSettings, updateGamificationSettings } from '@/lib/api'

interface EndpointTimestamps {
  [key: string]: number;
}

export default function GamificationSettings({ chatId }: { chatId: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [fetchFailed, setFetchFailed] = useState(false)
  const [settings, setSettings] = useState<GamificationSettingsType>({
    enabled: true,
    point_allocations: {
      new_message: 3,
      reply_message: 5,
      react_message: 2,
      unreact_message: -2,
      helpful_answer: 15,
      share_resource: 10,
      create_poll: 7,
      welcome_member: 8,
      report_issue: 7,
      bad_behavior: -50,
      warning_received: -25
    },
    level_settings: {
      level_multiplier: 1.5,
      base_points_per_level: 100
    },
    badge_settings: {
      badges_enabled: false,
      badge_list: []
    },
    leaderboard_settings: {
      leaderboard_types: ['all_time', 'daily', 'weekly', 'monthly', 'yearly'],
      reset_times: {
        daily: '00:00',
        weekly: 'Monday 00:00',
        monthly: '00:00',
        yearly: '00:00'
      }
    },
    challenge_settings: {
      challenges_enabled: false,
      challenge_list: []
    },
    reward_settings: {
      rewards_enabled: false,
      reward_list: []
    }
  })

  const lastApiCallsRef = useRef<EndpointTimestamps>({})

  const safeApiCall = useCallback(async (endpoint: string, apiCall: () => Promise<GamificationSettingsType>): Promise<GamificationSettingsType> => {
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

  const fetchGamificationSettings = useCallback(async () => {
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
      const endpoint = 'gamification_settings';

      const data = await safeApiCall(endpoint, () => 
        getGamificationSettings(tg.initData, parseInt(chatId), userId)
      );
      
      setSettings(data)
      setRetryCount(0)
      setFetchFailed(false)
    } catch (error) {
      console.error('Error fetching gamification settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch gamification settings')
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
        fetchGamificationSettings().catch(() => {})
      }, backoffTime)
      
      return () => clearTimeout(timer)
    }
  }, [error, retryCount, fetchGamificationSettings, fetchFailed])

  useEffect(() => {
    fetchGamificationSettings().catch(() => {})
  }, [fetchGamificationSettings])

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

      const userId = tg.initDataUnsafe.user.id;
      const endpoint = 'update_gamification_settings';

      await safeApiCall(endpoint, () => 
        updateGamificationSettings(tg.initData, parseInt(chatId), userId, settings)
      );
      
      console.log('Gamification settings saved successfully')
    } catch (error) {
      console.error('Error saving gamification settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to save gamification settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePointChange = (key: keyof PointAllocations, value: string) => {
    setSettings(prev => ({
      ...prev,
      point_allocations: {
        ...prev.point_allocations,
        [key]: parseInt(value) || 0
      }
    }))
  }

  const handleLevelSettingChange = (key: keyof LevelSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      level_settings: {
        ...prev.level_settings,
        [key]: parseFloat(value) || 0
      }
    }))
  }

  const handleToggleGamification = async (enabled: boolean) => {
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
      const endpoint = 'toggle_gamification';

      const updatedSettings = { ...settings, enabled };
      
      await safeApiCall(endpoint, () => 
        updateGamificationSettings(tg.initData, parseInt(chatId), userId, updatedSettings)
      );
      
      setSettings(updatedSettings);
      console.log(`Gamification has been ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling gamification:', error)
      setError(error instanceof Error ? error.message : 'Failed to update gamification settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  function renderLevelSettings() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label 
              className="text-lg"
              style={{ color: 'var(--tg-theme-text-color, white)' }}
            >
              Level Multiplier
            </Label>
            <p 
              className="text-sm mt-1"
              style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
            >
              Points required for each level will be multiplied by this value
            </p>
          </div>
          <Input
            type="number"
            value={settings.level_settings.level_multiplier}
            onChange={(e) => handleLevelSettingChange('level_multiplier', e.target.value)}
            style={{
              backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
              borderColor: 'var(--tg-theme-hint-color, #4b5563)',
              color: 'var(--tg-theme-text-color, white)'
            }}
            className="w-24"
            step="0.1"
            min="1"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label 
              className="text-lg"
              style={{ color: 'var(--tg-theme-text-color, white)' }}
            >
              Base Points per Level
            </Label>
            <p 
              className="text-sm mt-1"
              style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
            >
              Base points required to reach each level
            </p>
          </div>
          <Input
            type="number"
            value={settings.level_settings.base_points_per_level}
            onChange={(e) => handleLevelSettingChange('base_points_per_level', e.target.value)}
            style={{
              backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
              borderColor: 'var(--tg-theme-hint-color, #4b5563)',
              color: 'var(--tg-theme-text-color, white)'
            }}
            className="w-24"
            min="1"
          />
        </div>
      </div>
    )
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
              fetchGamificationSettings().catch(() => {})
            }}
            style={{
              backgroundColor: 'var(--tg-theme-button-color, #3b82f6)',
              color: 'var(--tg-theme-button-text-color, white)'
            }}
          >
            Retry
          </Button>
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
          Gamification Settings
        </h2>
        <p 
          className="text-sm mt-1"
          style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
        >
          Configure points, levels, badges, and rewards for your community
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
              {/* Enable/Disable Gamification */}
              <div className="flex items-center justify-between">
                <div>
                  <Label 
                    className="text-lg"
                    style={{ color: 'var(--tg-theme-text-color, white)' }}
                  >
                    Enable Gamification
                  </Label>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
                  >
                    Toggle the gamification system for your community
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={handleToggleGamification}
                  disabled={isSubmitting}
                />
              </div>

              {/* Point Allocations */}
              <div>
                <h3 
                  className="text-lg font-medium mb-4"
                  style={{ color: 'var(--tg-theme-text-color, white)' }}
                >
                  Point Allocations
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(settings.point_allocations).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label 
                        className="text-sm"
                        style={{ color: 'var(--tg-theme-text-color, white)' }}
                      >
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => handlePointChange(key as keyof PointAllocations, e.target.value)}
                        style={{
                          backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
                          borderColor: 'var(--tg-theme-hint-color, #4b5563)',
                          color: 'var(--tg-theme-text-color, white)'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Settings */}
              <div>
                <h3 
                  className="text-lg font-medium mb-4"
                  style={{ color: 'var(--tg-theme-text-color, white)' }}
                >
                  Level Settings
                </h3>
                {renderLevelSettings()}
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
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 