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
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#242933',
  applicationName: 'Habit Tracker',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <OfflineNotification />
        {children}
      </body>
    </html>
  );
}
