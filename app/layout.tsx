import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import TelegramThemeProvider from '@/components/TelegramThemeProvider'
import TelegramScript from '@/components/TelegramScript'
import ClientLayout from './ClientLayout'
import { ChatProvider } from './page'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Robomod',
  description: 'A Telegram-web application',
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TelegramScript />
        <TelegramThemeProvider />
        <ChatProvider>
          <ClientLayout>{children}</ClientLayout>
        </ChatProvider>
      </body>
    </html>
  )
}