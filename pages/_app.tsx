import { AppProps } from 'next/app'
import { SessionProvider } from "next-auth/react"
import Head from 'next/head'
import '../app/globals.css'

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#242933" />
        <meta name="application-name" content="Habit Tracker" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Habit Tracker" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/caracol.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/caracol.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/caracol.png" />
      </Head>
      <Component {...pageProps} />
    </SessionProvider>
  )
}

export default MyApp