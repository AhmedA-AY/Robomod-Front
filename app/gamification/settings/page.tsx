'use client'

import { useSearchParams } from 'next/navigation'
import GamificationSettings from '@/components/ui/GamificationSettings'

export default function GamificationSettingsPage() {
  const searchParams = useSearchParams()
  const chatId = searchParams?.get('chat_id')

  if (!chatId) {
    return (
      <div 
        className="h-full flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: 'var(--tg-theme-bg-color, #1f2937)' }}
      >
        <p 
          className="text-lg"
          style={{ color: 'var(--tg-theme-text-color, white)' }}
        >
          Chat ID is required
        </p>
      </div>
    )
  }

  return <GamificationSettings chatId={chatId} />
} 