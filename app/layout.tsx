import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import OfflineNotification from "@/components/OfflineNotification";
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Monitore seus hábitos",
  description: "Com apenas 2 cliques, monitore seus hábitos",
  manifest: '/manifest.json',
  themeColor: '#242933',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Habit Tracker"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    shortcut: '/caracol.png',
    apple: [
      { url: '/caracol.png' }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
        <meta name="theme-color" content="#242933" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <OfflineNotification />
        {children}
      </body>
    </html>
  );
}
