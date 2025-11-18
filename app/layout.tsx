import './globals.css'
import React from 'react'

export const metadata = {
  title: 'face2 — Video Calls',
  description: 'Simple WebRTC video calls with Firebase signaling',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar">
      <body>
        {children}
      </body>
    </html>
  )
}