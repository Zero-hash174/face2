import './globals.css'
import React from 'react'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Face2 — Video Calls',
  description: 'Simple WebRTC video calls',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#111827',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // ✅ 1. إضافة translate="no" هنا لمنع المتصفح من ترجمة الصفحة
    <html lang="ar" dir="rtl" translate="no">
      <head>
        {/* ✅ 2. إضافة هذا السطر لمنع ظهور نافذة "هل تريد الترجمة" في كروم */}
        <meta name="google" content="notranslate" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}