import './globals.css'
import React from 'react'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Face2 — Video Calls',
  description: 'Simple WebRTC video calls',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' }
}

// 🟢 إعدادات العرض للهاتف (مهم جداً للشكل)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // منع التكبير
  themeColor: '#0f172a', // توحيد لون شريط المتصفح مع الخلفية
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  )
}