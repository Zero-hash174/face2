import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // 🟢 استيراد مهم جداً لحل مشكلة المكان
import { db } from '../../firebase/firebase';
import { ref, onValue, off, query, limitToLast, set, remove } from 'firebase/database';

export default function UserSearch({ onCall, inCall }: { onCall: (user: any) => void, inCall: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  
  // حالة المستخدم المختار للقائمة
  const [selectedUserForBlock, setSelectedUserForBlock] = useState<any>(null);
  
  // حالة رسالة التنبيه (في الوسط)
  const [centerToast, setCenterToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  // للتأكد أننا في المتصفح (Client Side) لتجنب أخطاء الـ Portal
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (inCall) return;

    let currentId = '';
    if (typeof window !== 'undefined') {
        currentId = localStorage.getItem('face2_userId') || '';
    }

    const recentUsersQuery = query(ref(db, 'users'), limitToLast(100));
    const blockedRef = ref(db, `blocked/${currentId}`);

    const unsubscribeUsers = onValue(recentUsersQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.values(data).filter((u: any) => u.id !== currentId);
        userList.sort((a: any, b: any) => (a.online === b.online ? 0 : a.online ? -1 : 1));
        setUsers(userList);
      } else { setUsers([]); }
      setLoading(false);
    });

    const unsubscribeBlocked = onValue(blockedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setBlockedUsers(Object.keys(data));
      else setBlockedUsers([]);
    });

    return () => { off(recentUsersQuery); off(blockedRef); };
  }, [inCall]);

  // --- دالة إظهار الرسالة في الوسط ---
  const showCenterMsg = (msg: string, type: 'success' | 'error') => {
    setCenterToast({ msg, type });
    setTimeout(() => setCenterToast(null), 2000);
  };

  // --- دوال الحظر ---
  const handleBlock = async (targetId: string) => {
    const myId = localStorage.getItem('face2_userId');
    if (!myId) return;
    await set(ref(db, `blocked/${myId}/${targetId}`), true);
    setSelectedUserForBlock(null); 
    showCenterMsg("🚫 تم حظر المستخدم بنجاح", "error");
  };

  const handleUnblock = async (targetId: string) => {
    const myId = localStorage.getItem('face2_userId');
    if (!myId) return;
    await remove(ref(db, `blocked/${myId}/${targetId}`));
    setSelectedUserForBlock(null); 
    showCenterMsg("✅ تم إلغاء الحظر", "success");
  };

  if (inCall) return null;

  const filteredUsers = users.filter(user => 
    user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ width: '100%' }}>
      
      {/* 👇👇 استخدام Portal لإخراج الرسائل والنوافذ خارج القائمة تماماً 👇👇 */}
      {mounted && createPortal(
        <>
          {centerToast && (
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: centerToast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
                color: 'white',
                padding: '20px 40px',
                borderRadius: '50px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                zIndex: 2147483647, // فوق كل شيء
                fontWeight: 'bold',
                fontSize: '18px',
                animation: 'pop 0.3s ease-out',
                textAlign: 'center',
                minWidth: '250px'
            }}>
                {centerToast.msg}
            </div>
          )}

          {selectedUserForBlock && (
            <div 
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2147483646, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onClick={() => setSelectedUserForBlock(null)}
            >
              <div 
                style={{ background: '#fff', padding: '30px', borderRadius: '25px', width: '300px', textAlign: 'center', animation: 'pop 0.3s ease-out' }} 
                onClick={e => e.stopPropagation()}
              >
                <div style={{ fontSize: '60px', marginBottom: '15px' }}>{selectedUserForBlock.avatar || '👤'}</div>
                <h3 style={{ marginBottom: '10px', fontWeight: '900', fontSize: '20px', color: '#1f2937' }}>{selectedUserForBlock.username}</h3>
                <p style={{ marginBottom: '25px', color: '#6b7280', fontSize: '14px' }}>إعدادات الخصوصية لهذا المستخدم</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {blockedUsers.includes(selectedUserForBlock.id) ? (
                        <button onClick={() => handleUnblock(selectedUserForBlock.id)} className="btn" style={{ backgroundColor: '#10b981', padding: '12px' }}>🔓 إلغاء الحظر</button>
                    ) : (
                        <button onClick={() => handleBlock(selectedUserForBlock.id)} className="btn-danger" style={{ padding: '12px' }}>🚫 حظر المستخدم</button>
                    )}
                    
                    <button onClick={() => setSelectedUserForBlock(null)} style={{ marginTop: '10px', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px' }}>تراجع</button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body // 🟢 يرمي النافذة في جسم الصفحة مباشرة
      )}

      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <input type="text" placeholder="اكتب الاسم للبحث السريع..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field" style={{ textAlign: 'right' }} />
        <span style={{ position: 'absolute', top: '16px', right: '15px', fontSize: '20px', color: '#9ca3af' }}>🔍</span>
      </div>

      <div style={{ padding: '5px' }}>
        {loading ? ( <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>جاري تحميل القائمة... 🚀</div> ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const isBusy = user.isBusy && user.online;
            const isBlockedByMe = blockedUsers.includes(user.id);

            return (
              <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: isBlockedByMe ? '#fee2e2' : '#fff', borderRadius: '20px', marginBottom: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: isBusy ? '1px solid #fecaca' : '1px solid #f3f4f6' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div 
                    onClick={() => setSelectedUserForBlock(user)} 
                    style={{ position: 'relative', cursor: 'pointer' }}
                    title="اضغط للحظر/إلغاء الحظر"
                  >
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#f9fafb', border: '2px solid #e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', filter: isBlockedByMe ? 'grayscale(100%)' : 'none', transition: 'transform 0.2s' }}> 
                        {user.avatar || '👤'} 
                    </div>
                    {!isBlockedByMe && <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: isBusy ? '#f59e0b' : (user.online ? '#22c55e' : '#9ca3af'), border: '2px solid #fff' }}></span>}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
                        {user.username} {isBlockedByMe && <span style={{fontSize:'10px', color: '#ef4444', border:'1px solid #ef4444', padding:'2px 5px', borderRadius:'5px'}}>محظور</span>}
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: isBlockedByMe ? '#9ca3af' : (isBusy ? '#d97706' : (user.online ? '#16a34a' : '#9ca3af')) }}> 
                        {isBlockedByMe ? 'تم حظره' : (isBusy ? 'مشغول' : (user.online ? 'متصل' : 'غير متصل'))} 
                    </p>
                  </div>
                </div>

                <button 
                    onClick={() => !isBlockedByMe && onCall(user)} 
                    disabled={!user.online || isBlockedByMe} 
                    style={{ 
                        width: '45px', height: '45px', borderRadius: '50%', border: 'none', 
                        backgroundColor: isBlockedByMe ? '#fee2e2' : (isBusy ? '#ffedd5' : (user.online ? '#10b981' : '#e5e7eb')), 
                        color: isBlockedByMe ? '#ef4444' : (isBusy ? '#ea580c' : '#fff'), 
                        fontSize: '20px', cursor: (user.online && !isBlockedByMe) ? 'pointer' : 'not-allowed', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: (user.online && !isBlockedByMe) ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                    }}
                > 
                    {isBlockedByMe ? '🚫' : (isBusy ? '🔔' : '📞')} 
                </button>

              </div>
            );
          })
        ) : ( <div style={{ textAlign: 'center', padding: '20px', opacity: 0.6 }}>لا يوجد مستخدمين</div> )}
      </div>
    </div>
  );
}