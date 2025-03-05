import React, { useState, useEffect } from 'react'

export default function Error({ statusCode }) {
  const [isWebAppReady, setIsWebAppReady] = useState(false)

  useEffect(() => {
    // Check if Telegram WebApp is available
    if (window.Telegram?.WebApp) {
      setIsWebAppReady(true)
    } else {
      // If not available, show an error or fallback
      console.error('Telegram WebApp is not initialized')
    }
  }, [])

  // Show loading state if WebApp is not ready
  if (!isWebAppReady) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-foreground/70">Loading Telegram WebApp...</p>
      </div>
    )
  }

  return (
    <div className="error-message">
      <style jsx>{`
        .error-message {
          color: red;
          font-size: 20px;
          text-align: center;
          margin-top: 20px;
        }
      `}</style>
      <p>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </p>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
