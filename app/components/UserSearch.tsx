import { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import { ref, onValue, off, query, limitToLast } from 'firebase/database';

export default function UserSearch({ onCall, inCall }: { onCall: (user: any) => void, inCall: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (inCall) return;
    let currentId = '';
    if (typeof window !== 'undefined') {
        currentId = localStorage.getItem('face2_userId') || '';
    }
    const recentUsersQuery = query(ref(db, 'users'), limitToLast(100));
    const unsubscribe = onValue(recentUsersQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.values(data).filter((u: any) => u.id !== currentId);
        userList.sort((a: any, b: any) => {
            if (a.online === b.online) return 0;
            return a.online ? -1 : 1; 
        });
        setUsers(userList);
      } else { setUsers([]); }
      setLoading(false);
    });
    return () => off(recentUsersQuery);
  }, [inCall]);

  if (inCall) return null;

  const filteredUsers = users.filter(user => 
    user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <input type="text" placeholder="اكتب الاسم للبحث السريع..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field" style={{ textAlign: 'right' }} />
          <span style={{ position: 'absolute', top: '16px', right: '15px', fontSize: '20px', color: '#9ca3af' }}>🔍</span>
        </div>
      </div>

      <div style={{ padding: '5px' }}>
        {loading ? ( <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>جاري تحميل القائمة... 🚀</div> ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const isBusy = user.isBusy && user.online;
            return (
              <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#fff', borderRadius: '20px', marginBottom: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: isBusy ? '1px solid #fecaca' : '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#f9fafb', border: '2px solid #e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}> {user.avatar || '👤'} </div>
                    <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: isBusy ? '#f59e0b' : (user.online ? '#22c55e' : '#9ca3af'), border: '2px solid #fff' }}></span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>{user.username}</h3>
                    {/* 👇👇 التعديل هنا: تغيير "مكالمة أخرى" إلى "مشغول" 👇👇 */}
                    <p style={{ margin: 0, fontSize: '12px', color: isBusy ? '#d97706' : (user.online ? '#16a34a' : '#9ca3af') }}> {isBusy ? 'مشغول' : (user.online ? 'متصل' : 'غير متصل')} </p>
                  </div>
                </div>
                <button onClick={() => onCall(user)} disabled={!user.online} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: isBusy ? '#ffedd5' : (user.online ? '#10b981' : '#e5e7eb'), color: isBusy ? '#ea580c' : '#fff', fontSize: '18px', cursor: user.online ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> {isBusy ? '🔔' : '📞'} </button>
              </div>
            );
          })
        ) : ( <div style={{ textAlign: 'center', padding: '20px', opacity: 0.6 }}>لا يوجد مستخدمين</div> )}
      </div>
    </div>
  );
}