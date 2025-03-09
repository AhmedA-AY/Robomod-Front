import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          src="https://telegram.org/js/telegram-web-app.js"
          defer={false}
          async={false}
          type="text/javascript"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 