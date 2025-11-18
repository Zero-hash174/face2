'use client'
import { useState } from 'react'
import { db } from '../../firebase/firebase' 
import { ref, onValue } from 'firebase/database'

export default function UserSearch({ onCall }: { onCall: (user: { id: string, username: string }) => void }){
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  function searchUsers(){
    if(!search.trim()) return
    setLoading(true)
    setHasSearched(true)
    const usersRef = ref(db, 'users')

    onValue(usersRef, snap => {
      const data = snap.val() || {}
      const myId = localStorage.getItem('face2_userId')
      
      const arr = Object.keys(data)
        .map(id => ({ id, ...data[id] }))
        .filter(user => 
          user.id !== myId && 
          user.username &&
          user.username.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => (b.online === true ? 1 : 0) - (a.online === true ? 1 : 0));

      setResults(arr)
      setLoading(false)
    }, { onlyOnce: true })
  }

  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: '#1e293b' }}>
        🔍 ابحث عن صديق
      </h3>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '25px' }}>
        <input
          className="input-field"
          style={{ marginBottom: 0 }}
          placeholder="اكتب الاسم للبحث..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
        />
        <button
          className="btn"
          style={{ width: 'auto', padding: '0 30px' }}
          onClick={searchUsers}
        >
          {loading ? '...' : 'بحث'}
        </button>
      </div>

      {loading && <p style={{textAlign: 'center', color: '#64748b', animation: 'pulse 1s infinite'}}>جاري البحث في الشبكة...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {results.map((user, index) => (
          <div key={user.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            border: '1px solid #f1f5f9',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            background: user.online ? '#f0fdf4' : '#fff', // خلفية خضراء فاتحة للمتصل
            /* 🟢 أنميشن ظهور متتابع للعناصر */
            animation: `slideUp 0.5s ease-out forwards`,
            animationDelay: `${index * 0.1}s`, // تأخير زمني لكل عنصر
            opacity: 0 // البداية مخفي
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* دائرة الحرف الأول */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: user.online ? '#dcfce7' : '#f1f5f9',
                color: user.online ? '#15803d' : '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: '20px',
                boxShadow: user.online ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none'
              }}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <p style={{ fontWeight: '700', margin: 0, fontSize: '16px', color: '#334155' }}>{user.username}</p>
                <div style={{ fontSize: '13px', color: user.online ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                  <span className={`status-dot ${user.online ? 'online' : 'offline'}`}></span>
                  {user.online ? "نشط الآن" : "غير متصل"}
                </div>
              </div>
            </div>

            <button
              onClick={() => onCall(user)}
              disabled={!user.online}
              style={{
                padding: '10px 20px',
                background: user.online ? '#10b981' : '#e2e8f0',
                color: user.online ? 'white' : '#94a3b8',
                border: 'none',
                borderRadius: '12px',
                cursor: user.online ? 'pointer' : 'not-allowed',
                fontWeight: '700',
                fontSize: '14px',
                transition: 'all 0.2s',
                boxShadow: user.online ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              {user.online ? '📞 اتصال' : 'مشغول'}
            </button>
          </div>
        ))}
      </div>
      
      {hasSearched && results.length === 0 && !loading && (
        <div style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8', animation: 'fadeIn 0.5s' }}>
          <p style={{ fontSize: '40px', marginBottom: '10px' }}>😕</p>
          <p>لم يتم العثور على مستخدم بهذا الاسم.</p>
        </div>
      )}
    </div>
  )
}