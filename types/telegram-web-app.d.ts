interface TelegramWebApps {
  WebApp: {
    themeParams: {
      bg_color: string
      text_color: string
      button_color?: string
      button_text_color?: string
      secondary_bg_color?: string
      hint_color?: string
    }
  }
}

interface Window {
  Telegram: TelegramWebApps
} 