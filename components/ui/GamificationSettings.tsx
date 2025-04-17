'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import * as React from "react"

interface PointAllocations {
  new_message: number;
  reply_message: number;
  react_message: number;
  unreact_message: number;
  helpful_answer: number;
  share_resource: number;
  create_poll: number;
  welcome_member: number;
  report_issue: number;
  bad_behavior: number;
}

interface LevelSettings {
  level_multiplier: number;
  base_points_per_level: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirements: {
    points?: number;
    level?: number;
    actions?: Record<string, number>;
  };
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  reward_points: number;
  requirements: {
    points?: number;
    level?: number;
    actions?: Record<string, number>;
  };
  start_date: string;
  end_date: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'role' | 'custom';
  data: {
    role_name?: string;
    custom_reward?: string;
  };
  stock?: number;
}

interface BadgeSettings {
  badges_enabled: boolean;
  badge_list: Badge[];
}

interface LeaderboardSettings {
  leaderboard_types: string[];
  reset_times: Record<string, string>;
}

interface ChallengeSettings {
  challenges_enabled: boolean;
  challenge_list: Challenge[];
}

interface RewardSettings {
  rewards_enabled: boolean;
  reward_list: Reward[];
}

interface GamificationSettings {
  enabled: boolean;
  point_allocations: PointAllocations;
  level_settings: LevelSettings;
  badge_settings: BadgeSettings;
  leaderboard_settings: LeaderboardSettings;
  challenge_settings: ChallengeSettings;
  reward_settings: RewardSettings;
}

export default function GamificationSettings({ chatId }: { chatId: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [settings, setSettings] = useState<GamificationSettings>({
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
      bad_behavior: -50
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
      leaderboard_types: [],
      reset_times: {}
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

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        throw new Error('Telegram Web App is not initialized')
      }

      const params = new URLSearchParams()
      params.append('chat_id', chatId)
      
      const response = await fetch(`https://robomod.dablietech.club/gamification/settings?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to fetch gamification settings')
      }

      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching gamification settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch settings')
    } finally {
      setIsLoading(false)
    }
  }, [chatId])

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      const tg = window?.Telegram?.WebApp
      if (!tg || !tg.initData) {
        throw new Error('Telegram Web App is not initialized')
      }

      const params = new URLSearchParams()
      params.append('chat_id', chatId)
      
      const response = await fetch(`https://robomod.dablietech.club/gamification/settings?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tg.initData}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update gamification settings')
      }

      // Refresh settings after successful update
      fetchSettings()
    } catch (error) {
      console.error('Error updating gamification settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to update settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
          Configure points, levels, and rewards
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
              Error
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
                    Enable Gamification
                  </Label>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
                  >
                    Turn on/off all gamification features
                  </p>
                </div>
                <Switch 
                  checked={settings.enabled} 
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-4">
                <h3 
                  className="text-lg font-medium"
                  style={{ color: 'var(--tg-theme-text-color, white)' }}
                >
                  Point Allocations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(settings.point_allocations).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label 
                        className="capitalize"
                        style={{ color: 'var(--tg-theme-text-color, white)' }}
                      >
                        {key.replace(/_/g, ' ')}
                      </Label>
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          point_allocations: {
                            ...prev.point_allocations,
                            [key]: parseInt(e.target.value) || 0
                          }
                        }))}
                        disabled={isSubmitting}
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

              <div className="space-y-4">
                <h3 
                  className="text-lg font-medium"
                  style={{ color: 'var(--tg-theme-text-color, white)' }}
                >
                  Level Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label 
                      style={{ color: 'var(--tg-theme-text-color, white)' }}
                    >
                      Level Multiplier
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.level_settings.level_multiplier}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        level_settings: {
                          ...prev.level_settings,
                          level_multiplier: parseFloat(e.target.value) || 1.5
                        }
                      }))}
                      disabled={isSubmitting}
                      style={{
                        backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
                        borderColor: 'var(--tg-theme-hint-color, #4b5563)',
                        color: 'var(--tg-theme-text-color, white)'
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label 
                      style={{ color: 'var(--tg-theme-text-color, white)' }}
                    >
                      Base Points per Level
                    </Label>
                    <Input
                      type="number"
                      value={settings.level_settings.base_points_per_level}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        level_settings: {
                          ...prev.level_settings,
                          base_points_per_level: parseInt(e.target.value) || 100
                        }
                      }))}
                      disabled={isSubmitting}
                      style={{
                        backgroundColor: 'var(--tg-theme-bg-color, #1f2937)',
                        borderColor: 'var(--tg-theme-hint-color, #4b5563)',
                        color: 'var(--tg-theme-text-color, white)'
                      }}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  backgroundColor: 'var(--tg-theme-button-color, #3b82f6)',
                  color: 'var(--tg-theme-button-text-color, white)'
                }}
                className="w-full"
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