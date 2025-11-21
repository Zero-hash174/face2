'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../firebase/firebase' 
import { ref, set, onDisconnect, serverTimestamp } from 'firebase/database'

// 🟢 تم تحديث القائمة فقط وإضافة إيموجيات جديدة
const AVATARS = [
  "🦁", "🐯", "🐱", "🐶", "🦊", "🐻", "🐨", "🐼",
  "🐸", "🦄", "🐲", "🦖", "🐳", "🐙", "🦉", "🦅",
  "🧑‍🚀", "🦸‍♂️", "🥷", "🧙‍♂️", "🧛‍♂️", "🧟‍♂️", "🧞‍♂️", "🧚‍♀️",
  "🤖", "👾", "👻", "👽", "🤡", "💀", "🎃", "🤠",
  "😎", "🤓", "🥳", "🥶", "🤯", "🤑", "😷", "🤒",
  "👨‍💻", "👩‍💻", "👶", "👮‍♂️", "👷‍♂️", "🤴", "👸", "👳‍♂️"
];

export default function SetupPage() {
  const [username, setUsername] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]) 
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const storedId = localStorage.getItem('face2_userId');
    if (storedId) router.push('/call');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    
    const userId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    try {
      localStorage.setItem('face2_userId', userId);
      localStorage.setItem('face2_username', username);
      localStorage.setItem('face2_avatar', selectedAvatar);

      const userRef = ref(db, `users/${userId}`);
      
      await set(userRef, {
        username: username,
        avatar: selectedAvatar,
        id: userId,
        online: true,
        isBusy: false,
        lastSeen: serverTimestamp()
      });

      // 🟢 التعديل هنا: عند الانفصال، يصبح "غير متصل" فقط ولا يُحذف
      onDisconnect(userRef).update({ 
        online: false, 
        lastSeen: serverTimestamp() 
      });

      router.push('/call');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%)' 
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>{selectedAvatar}</div>
        
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#111827' }}>
          أهلاً بك في Face2
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>اختر شخصيتك واسمك</p>

        {/* تم إضافة overflow-y لجعل القائمة قابلة للتمرير لأن العدد زاد */}
        <div style={{ 
            display: 'flex', 
            gap: '10px', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            marginBottom: '20px',
            maxHeight: '200px', // تحديد ارتفاع
            overflowY: 'auto', // إضافة سكرول
            padding: '5px'
        }}>
          {AVATARS.map((avatar) => (
            <button
              key={avatar}
              type="button"
              onClick={() => setSelectedAvatar(avatar)}
              style={{
                fontSize: '24px', padding: '10px', border: selectedAvatar === avatar ? '2px solid #4f46e5' : '2px solid transparent',
                borderRadius: '12px', background: selectedAvatar === avatar ? '#e0e7ff' : '#f9fafb', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {avatar}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            className="input-field"
            type="text"
            placeholder="اسم المستخدم (مثل: أحمد)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'ابدأ الآن 🚀'}
          </button>
        </form>
      </div>
    </div>
  )
}