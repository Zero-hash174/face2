'use client'
import { useState, useEffect } from 'react'
import { db } from '../../firebase/firebase'
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database'

// --- الأيقونات الكلاسيكية ---
const SearchIcons = {
  Video: () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> ),
  Phone: () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> ),
  Chat: () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> ),
  Block: () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> ),
  StarFilled: () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> ),
  StarOutline: () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> ),
  Plus: () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> ),
  Warning: () => ( <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> )
};

interface UserSearchProps {
  onCall: (user: any, type: 'video' | 'audio') => void;
  onChat: (user: any) => void;
  inCall: boolean;
  blockedUsers: string[];
  toggleBlock: (id: string) => void;
  loadingTargetId: string | null;
  unreadCounts: {[key: string]: number};
}

export default function UserSearch({ onCall, onChat, inCall, blockedUsers, toggleBlock, loadingTargetId, unreadCounts }: UserSearchProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataLimit, setDataLimit] = useState(20); 
  const [recentContacts, setRecentContacts] = useState<string[]>([]);
  const [pendingBlockUser, setPendingBlockUser] = useState<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);

  useEffect(() => {
    const storedRecents = localStorage.getItem('face2_recents');
    if (storedRecents) setRecentContacts(JSON.parse(storedRecents));

    const myId = localStorage.getItem('face2_userId');

    const usersRef = query(
        ref(db, 'users'), 
        orderByChild('lastSeen'), 
        limitToLast(dataLimit)
    );

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const totalFetched = Object.keys(data).length;
        if (totalFetched < dataLimit) {
            setHasMoreUsers(false);
        } else {
            setHasMoreUsers(true);
        }

        const usersList = Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key],
            username: data[key].username || 'مستخدم مجهول',
            avatar: data[key].avatar || '👤'
          }))
          .filter(u => u.id !== myId); 
        
        // الترتيب الأولي (الأحدث أولاً)
        setUsers(usersList.reverse());
        setIsLoadingMore(false);
      } else {
          setUsers([]);
          setHasMoreUsers(false);
      }
    });

    return () => unsubscribe();
  }, [dataLimit]); 

  const loadMoreUsers = () => {
      if (!hasMoreUsers) return;
      setIsLoadingMore(true);
      setDataLimit(prev => prev + 20);
  };

  const toggleFavorite = (userId: string) => {
      let newRecents = [...recentContacts];
      if (newRecents.includes(userId)) {
          newRecents = newRecents.filter(id => id !== userId);
      } else {
          newRecents.unshift(userId);
      }
      setRecentContacts(newRecents);
      localStorage.setItem('face2_recents', JSON.stringify(newRecents));
  };

  // ✅✅ الترتيب الصحيح: المتصلين أولاً، ثم المفضلين ✅✅
  const sortedUsers = [...users].sort((a, b) => {
      // 1. الأولوية القصوى للمتصلين (Online)
      if (a.online && !b.online) return -1;
      if (!a.online && b.online) return 1;

      // 2. داخل المتصلين (وغير المتصلين)، رتب حسب المفضلة
      const isARecent = recentContacts.includes(a.id);
      const isBRecent = recentContacts.includes(b.id);
      if (isARecent && !isBRecent) return -1;
      if (!isARecent && isBRecent) return 1;

      // 3. أخيراً، رتب حسب الوقت (الأحدث)
      return (b.lastSeen || 0) - (a.lastSeen || 0);
  });

  const filteredUsers = sortedUsers.filter(user => {
    const nameToSearch = (user.username || '').toString(); 
    return nameToSearch.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const displayedUsers = searchTerm ? filteredUsers : filteredUsers; 

  const handleAvatarClick = (user: any) => {
      setPendingBlockUser(user);
  };

  const confirmBlockAction = () => {
      if (pendingBlockUser) {
          toggleBlock(pendingBlockUser.id);
          setPendingBlockUser(null);
      }
  };

  const handleCallClick = (user: any, type: 'video' | 'audio') => {
      if (!user.online) return; 
      onCall(user, type);
  };

  return (
    <div className="search-wrapper">
      <input 
        type="text" 
        placeholder="بحث عن صديق..." 
        className="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <div style={{marginTop: 15, display: 'flex', flexDirection: 'column', gap: 10}}>
        {displayedUsers.length === 0 ? (
            <p style={{textAlign: 'center', color: '#9ca3af', fontSize: '14px', marginTop: '20px'}}>
                {searchTerm ? 'لا توجد نتائج' : 'جاري تحميل القائمة...'}
            </p>
        ) : (
            displayedUsers.map(user => {
                const isBlocked = blockedUsers.includes(user.id);
                const isLoading = loadingTargetId === user.id;
                const hasUnread = unreadCounts[user.id] > 0;
                const isCallDisabled = inCall || isBlocked || isLoading;
                const isRecent = recentContacts.includes(user.id);

                return (
                    <div key={user.id} className="user-card-row" style={{border: isRecent ? '1px solid rgba(251, 191, 36, 0.4)' : undefined}}>
                        <div className="user-info-right">
                            <div className="user-avatar-circle" onClick={() => handleAvatarClick(user)} title="اضغط للحظر">
                                {user.avatar}
                                <div className={`status-dot-on-avatar ${user.online ? 'online' : 'offline'}`} 
                                     style={{background: user.online ? '#10b981' : '#9ca3af', borderColor: '#1f2937'}}></div>
                                {isBlocked && <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px'}}>🚫</div>}
                            </div>
                            <div className="user-details">
                                <span className="user-name">
                                    {user.username}
                                </span>
                                <span style={{fontSize: 11, color: user.isBusy ? '#ef4444' : (user.online ? '#10b981' : '#6b7280')}}>
                                    {isBlocked ? 'محظور' : (user.online ? (user.isBusy ? 'مشغول' : 'متصل الآن') : 'غير متصل')} 
                                </span>
                            </div>
                        </div>

                        <div className="action-buttons-row">
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(user.id); }}
                                className="btn-action-circle"
                                title={isRecent ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                                style={{background: 'transparent', width: '30px', height: '30px', padding: 0}}
                            >
                                {isRecent ? <SearchIcons.StarFilled /> : <SearchIcons.StarOutline />}
                            </button>

                            <button onClick={() => onChat(user)} className="btn-action-circle chat-btn" style={{position: 'relative'}} disabled={inCall || isLoading}>
                                <SearchIcons.Chat />
                                {hasUnread && <div className="unread-dot"></div>}
                            </button>

                            <button 
                                onClick={() => handleCallClick(user, 'audio')} 
                                className="btn-call-modern"
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                                    opacity: (isCallDisabled || !user.online) ? 0.5 : 1, 
                                    cursor: (isCallDisabled || !user.online) ? 'not-allowed' : 'pointer'
                                }}
                                disabled={isCallDisabled || !user.online}
                                title="اتصال صوتي"
                            >
                                <SearchIcons.Phone />
                            </button>

                            <button 
                                onClick={() => handleCallClick(user, 'video')} 
                                className="btn-call-modern online"
                                style={{
                                    opacity: (isCallDisabled || !user.online) ? 0.5 : 1, 
                                    cursor: (isCallDisabled || !user.online) ? 'not-allowed' : 'pointer'
                                }}
                                disabled={isCallDisabled || !user.online}
                                title="اتصال فيديو"
                            >
                                <SearchIcons.Video />
                            </button>
                        </div>
                    </div>
                )
            })
        )}

        {!searchTerm && (
            hasMoreUsers ? (
                <button 
                    onClick={loadMoreUsers}
                    disabled={isLoadingMore}
                    style={{
                        width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', 
                        color: '#9ca3af', border: '1px dashed rgba(255,255,255,0.2)', 
                        borderRadius: '15px', cursor: 'pointer', marginTop: '10px',
                        fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        opacity: isLoadingMore ? 0.5 : 1
                    }}
                >
                    {isLoadingMore ? 'جاري التحميل...' : <span>عرض المزيد ({dataLimit})</span>}
                    {!isLoadingMore && <SearchIcons.Plus />}
                </button>
            ) : (
                <p style={{textAlign: 'center', color: '#6b7280', fontSize: '13px', marginTop: '15px', paddingBottom: '20px'}}>
                    🎉 لا يوجد أشخاص آخرون
                </p>
            )
        )}
      </div>

      {pendingBlockUser && (
          <div className="modal-overlay" onClick={() => setPendingBlockUser(null)}>
              <div className="modern-modal" onClick={e => e.stopPropagation()} style={{textAlign: 'center', border: '1px solid #374151', width: '300px'}}>
                  <div style={{display:'flex', justifyContent:'center', marginBottom: '15px'}}><SearchIcons.Warning /></div>
                  <h3 style={{color: 'white', marginBottom: '10px'}}>
                      {blockedUsers.includes(pendingBlockUser.id) ? 'إلغاء الحظر؟' : 'حظر المستخدم؟'}
                  </h3>
                  <p style={{color: '#9ca3af', fontSize: '14px', marginBottom: '20px'}}>
                      {blockedUsers.includes(pendingBlockUser.id) 
                        ? `السماح لـ ${pendingBlockUser.username} بالاتصال؟`
                        : `منع ${pendingBlockUser.username} من الاتصال؟`
                      }
                  </p>
                  <div style={{display: 'flex', gap: '10px'}}>
                      <button onClick={confirmBlockAction} className="btn-pill-red" style={{flex: 1, justifyContent: 'center', padding: '10px', fontSize: '14px', background: blockedUsers.includes(pendingBlockUser.id) ? '#10b981' : '#ef4444'}}>
                          {blockedUsers.includes(pendingBlockUser.id) ? 'نعم، إلغاء' : 'نعم، حظر'}
                      </button>
                      <button onClick={() => setPendingBlockUser(null)} className="gradient-btn" style={{flex: 1, background: '#374151', marginTop: 0, padding: '10px', fontSize: '14px'}}>
                          تراجع
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  )
}