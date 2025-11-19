'use client'
import React, { useEffect, useState } from 'react'

export default function Header() {
  const [myAvatar, setMyAvatar] = useState('👤');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAvatar = localStorage.getItem('face2_avatar');
      if (storedAvatar) setMyAvatar(storedAvatar);
    }
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* 🟢 عرض صورتي الشخصية هنا */}
      <div style={{
        width: '45px', height: '45px', background: '#f1f5f9', 
        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        fontSize: '26px', border: '2px solid #e0e7ff'
      }}>
        {myAvatar}
      </div>
      <h3 style={{ fontWeight: '800', fontSize: '22px', color: '#111827', margin: 0 }}>
        Face2
      </h3>
    </div>
  )
}