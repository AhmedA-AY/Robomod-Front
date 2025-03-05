import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import TelegramThemeProvider from '@/components/TelegramThemeProvider'
import ClientLayout from './ClientLayout'
import TelegramScript from '@/components/TelegramScript'

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
        <TelegramScript />
      </head>
      <body className={inter.className}>
        <TelegramThemeProvider />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}