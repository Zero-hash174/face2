'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../firebase/firebase' 
import { ref, set, serverTimestamp, onDisconnect } from 'firebase/database'

export default function SetupPage() {
  const [username, setUsername] = useState('')
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

      const userRef = ref(db, `users/${userId}`);
      await set(userRef, {
        username: username,
        id: userId,
        online: true,
        lastSeen: serverTimestamp()
      });
      onDisconnect(userRef).update({ online: false });

      router.push('/call');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%)' 
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        {/* أيقونة تعبيرية */}
        <div style={{ fontSize: '50px', marginBottom: '10px' }}>👋</div>
        
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#111827' }}>
          أهلاً بك في Face2
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>
          تطبيق مكالمات فيديو بسيط وسريع. <br/> ابدأ بكتابة اسمك.
        </p>

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