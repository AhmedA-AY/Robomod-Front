'use client'

import Script from 'next/script'

export default function TelegramScript() {
  return (
    <Script
      src="https://telegram.org/js/telegram-web-app.js"
      strategy="beforeInteractive"
      onError={(e) => {
        console.error('Failed to load Telegram Web App script:', e)
      }}
    />
  )
} 