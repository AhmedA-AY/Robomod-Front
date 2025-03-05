import './globals.css'
import Script from 'next/script'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import TelegramThemeProvider from '@/components/TelegramThemeProvider'
import ClientLayout from './ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Robomod',
  description: 'A Telegram-inspired web application',
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script 
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
          onError={(e) => {
            console.error('Failed to load Telegram WebApp script:', e);
          }}
          onLoad={() => {
            console.log('Telegram WebApp script loaded successfully');
          }}
        />
      </head>
      <body className={inter.className}>
        <TelegramThemeProvider />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}