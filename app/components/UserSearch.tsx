'use client'
import { useState, useEffect } from 'react'
import { db } from '../../firebase/firebase' 
import { ref, onValue } from 'firebase/database'

export default function UserSearch({ onCall }: { onCall: (user: { id: string, username: string }) => void }){
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true) // يبدأ بالتحميل فوراً

  // 🟢 تحميل المستخدمين تلقائياً عند فتح الصفحة
  useEffect(() => {
    const usersRef = ref(db, 'users')
    
    // الاستماع للتغييرات في الوقت الحقيقي
    const unsubscribe = onValue(usersRef, (snap) => {
      const data = snap.val() || {}
      const myId = localStorage.getItem('face2_userId')
      
      const arr = Object.keys(data)
        .map(id => ({ id, ...data[id] }))
        .filter(user => user.id !== myId) // استبعاد نفسي
        .sort((a, b) => (b.online === true ? 1 : 0) - (a.online === true ? 1 : 0)); // ترتيب المتصل أولاً

      setResults(arr)
      setLoading(false)
    });

    return () => unsubscribe(); // تنظيف عند الخروج
  }, []);

  // فلترة النتائج بناءً على البحث (تصفية محلية سريعة)
  const filteredResults = results.filter(user => 
    user.username && user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full">
      <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: '#1e293b' }}>
        🔍 ابحث عن صديق
      </h3>

      {/* شريط البحث */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '25px' }}>
        <input
          className="input-field"
          style={{ marginBottom: 0 }}
          placeholder="اكتب الاسم للبحث السريع..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <p style={{textAlign: 'center', color: '#64748b', animation: 'pulse 1s infinite'}}>
          جاري تحميل القائمة...
        </p>
      )}

      {/* قائمة المستخدمين */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredResults.length === 0 && !loading ? (
           <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
             <p>لا يوجد مستخدمين آخرين حالياً 😴</p>
             <p style={{ fontSize: '12px' }}>شارك الرابط مع أصدقائك!</p>
           </div>
        ) : (
          filteredResults.map((user, index) => (
            <div key={user.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              border: '1px solid #f1f5f9',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
              background: user.online ? '#f0fdf4' : '#fff',
              animation: `slideUp 0.5s ease-out forwards`,
              animationDelay: `${index * 0.1}s`,
              opacity: 0 // يبدأ مخفي ثم يظهر بالأنميشن
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {/* الأفاتار */}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: user.online ? '#dcfce7' : '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: user.online ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none'
                }}>
                  {user.avatar || '👤'}
                </div>
                
                <div>
                  <p style={{ fontWeight: '700', margin: 0, fontSize: '16px', color: '#334155' }}>
                    {user.username}
                  </p>
                  <div style={{ fontSize: '13px', color: user.online ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', marginTop: '4px', gap: '5px' }}>
                    <span className={`status-dot ${user.online ? 'online' : 'offline'}`}></span>
                    {user.online ? (user.isBusy ? "مشغول" : "متصل الآن") : "غير متصل"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onCall(user)}
                // نسمح بالاتصال حتى لو مشغول (ليظهر له الإشعار) لكن نمنع اذا غير متصل
                disabled={!user.online} 
                style={{
                  padding: '10px 20px',
                  background: user.online ? (user.isBusy ? '#f59e0b' : '#10b981') : '#e2e8f0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: user.online ? 'pointer' : 'not-allowed',
                  fontWeight: '700',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  boxShadow: user.online ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {user.online ? (user.isBusy ? '🔔 تنبيه' : '📞 اتصال') : 'غائب'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}