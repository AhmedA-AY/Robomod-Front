import Script from 'next/script'

export default function Head() {
  return (
    <>
      <Script 
        src="https://telegram.org/js/telegram-web-app.js?56" 
        strategy="beforeInteractive" 
      />
    </>
  );
}