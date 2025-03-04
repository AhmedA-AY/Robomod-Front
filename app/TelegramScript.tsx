"use client"

import { useEffect } from "react"

export default function TelegramScript() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-web-app.js?56"
    script.async = true
    document.head.appendChild(script)
  }, [])

  return null
}
