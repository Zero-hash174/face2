import React from 'react'

export default function Header() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* 🟢 أيقونة جديدة بدلاً من الكاميرا أو يمكنك وضع شعار نصي بسيط */}
      <div style={{
        width: '38px', height: '38px', background: '#6366f1', // لون أزرق جذاب
        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        color: 'white', fontSize: '20px', fontWeight: '800', // حجم ووزن خط مميز
        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)', // ظل خفيف
      }}>
        ✨
      </div>
      <h3 style={{ fontWeight: '800', fontSize: '22px', color: '#111827', margin: 0 }}>
        Face2
      </h3>
    </div>
  )
}