'use client'
import dynamic from 'next/dynamic'

// 🟢 استخدام dynamic import مع تعطيل ssr
// هذا يخبر Next.js بتحميل المكون فقط في المتصفح
const CallClient = dynamic(() => import('./CallClient'), { 
  ssr: false,
  loading: () => <p className="text-center p-4">جاري تحميل مكونات الاتصال...</p>
})

export default function CallPage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <CallClient />
    </main>
  )
}