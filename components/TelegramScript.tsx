'use client'

import Script from 'next/script'

export function TelegramScript() {
  return (
    <Script
      src="https://telegram.org/js/telegram-web-app.js"
      strategy="afterInteractive"
      onLoad={() => {
        console.log('Telegram WebApp script loaded.')
        // You might perform initializations here if needed
        // e.g., window.Telegram?.WebApp?.ready();
      }}
      onError={(e) => {
        console.error('Failed to load Telegram WebApp script:', e)
      }}
    />
  )
} 