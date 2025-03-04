import './globals.css'
import Script from 'next/script'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import TelegramThemeProvider from '@/components/TelegramThemeProvider'
import dynamic from "next/dynamic"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Robomod',
  description: 'A Telegram-inspired web application',
}

const TelegramScript = dynamic(() => import("./TelegramScript"), { ssr: false })

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Load Telegram Web App JS before interactive */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className={inter.className}>
        <TelegramThemeProvider />
        <TelegramScript />
        {children}
      </body>
    </html>
  )
}