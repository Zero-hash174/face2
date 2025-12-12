'use client'
import dynamic from 'next/dynamic'

// 🟢 تحميل المكون ديناميكياً وتعطيل SSR (مهم جداً لـ WebRTC)
const CallClient = dynamic(() => import('./CallClient'), { 
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexDirection: 'column', gap: '10px' }}>
        <div style={{width: 40, height: 40, border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s infinite linear'}}></div>
        <p>جاري تحميل الاتصال...</p>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
})

export default function CallPage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
      <CallClient />
    </main>
  )
}