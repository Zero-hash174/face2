'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt'
import { ZIM } from 'zego-zim-web'
import { db } from '../../firebase/firebase' 
import { ref, update, onDisconnect, serverTimestamp, get, push, onChildAdded, remove } from 'firebase/database'
import UserSearch from '../components/UserSearch'
import Header from '../components/Header'

const APP_ID = 221724333; 
const SERVER_SECRET = "480e962860b99d4828e308ff7f340cf8"; 

type CallLog = {
  id: string;
  name: string;
  status: 'completed' | 'rejected' | 'missed' | 'blocked';
  duration?: string;
  time: string;
  type: 'incoming' | 'outgoing';
};

export default function CallClient() { 
  const [myId, setMyId] = useState('');
  const [username, setUsername] = useState('');
  const [isZegoReady, setIsZegoReady] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'error' | 'info' } | null>(null);
  
  const [isDoNotDisturb, setIsDoNotDisturb] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [callHistory, setCallHistory] = useState<CallLog[]>([]);
  const [callStatus, setCallStatus] = useState<'IDLE' | 'CONNECTED'>('IDLE'); 

  const callStartTimeRef = useRef<number | null>(null);
  const currentPeerNameRef = useRef<string>("");

  const router = useRouter();
  const zegoInstanceRef = useRef<ZegoUIKitPrebuilt | null>(null);

  const showToast = (message: string, type: 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const addCallLog = (log: CallLog) => {
    const updatedLogs = [log, ...callHistory];
    setCallHistory(updatedLogs);
    localStorage.setItem('face2_history', JSON.stringify(updatedLogs));
  };

  const toggleDoNotDisturb = () => {
    const newStatus = !isDoNotDisturb;
    setIsDoNotDisturb(newStatus);
    if(myId) {
      update(ref(db, `users/${myId}`), { isBusy: newStatus });
      showToast(newStatus ? "⛔ تم تفعيل وضع عدم الإزعاج" : "✅ أنت الآن متاح لاستقبال المكالمات", newStatus ? 'error' : 'info');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('face2_userId');
      const storedUsername = localStorage.getItem('face2_username');
      
      const storedHistory = localStorage.getItem('face2_history');
      if (storedHistory) {
        try { setCallHistory(JSON.parse(storedHistory)); } catch (e) {}
      }

      if (!storedId || !storedUsername) {
        router.push('/setup');
      } else {
        setMyId(storedId);
        setUsername(storedUsername);

        const userRef = ref(db, `users/${storedId}`);
        update(userRef, { online: true, isBusy: false, lastSeen: serverTimestamp() });
        
        // 🟢 التعديل هنا: عند الانقطاع المفاجئ، يصبح غير متصل فقط (لا يُحذف)
        onDisconnect(userRef).update({ 
            online: false, 
            lastSeen: serverTimestamp() 
        });

        const notificationsRef = ref(db, `notifications/${storedId}`);
        onChildAdded(notificationsRef, (snapshot) => {
            const data = snapshot.val();
            if (data && !data.read) {
                addCallLog({
                    id: Date.now().toString(),
                    name: data.callerName,
                    status: 'missed',
                    time: new Date(data.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}),
                    type: 'incoming'
                });
                showToast(`📞 حاول ${data.callerName} الاتصال بك وأنت مشغول.`, 'info');
                update(ref(db, `notifications/${storedId}/${snapshot.key}`), { read: true });
            }
        });
      }
    }
  }, [router]);

  // 🟢 دالة الخروج: هنا فقط يتم الحذف النهائي كما طلبت
  const handleLogout = () => {
      if(myId) {
          remove(ref(db, `users/${myId}`)); // حذف نهائي
      }
      localStorage.removeItem('face2_userId');
      localStorage.removeItem('face2_username');
      localStorage.removeItem('face2_avatar');
      if (zegoInstanceRef.current) zegoInstanceRef.current.destroy();
      window.location.href = '/setup';
  };

  useEffect(() => {
    if (!myId || !username) return;
    if (zegoInstanceRef.current) return;

    const initZego = async () => {
      try {
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          APP_ID, SERVER_SECRET, "face2_global_room", myId, username
        );
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zp.addPlugins({ ZIM }); 
        zegoInstanceRef.current = zp; 

        zp.setCallInvitationConfig({
          onSetRoomConfigBeforeJoining: (callType) => {
            setCallStatus('CONNECTED'); 
            callStartTimeRef.current = Date.now();
            return {
              container: undefined,
              scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
              showScreenSharingButton: false,
              videoCodec: 'VP8', 
              turnOnMicrophoneWhenJoining: true,
              turnOnCameraWhenJoining: true,
              showMyCameraToggleButton: true,
              showMyMicrophoneToggleButton: true,
              showAudioVideoSettingsButton: true,
            };
          },
          
          onIncomingCallReceived: (callID, caller) => {
             if (isDoNotDisturb && zegoInstanceRef.current) {
                 zegoInstanceRef.current.hangUp();
                 return;
             }
             currentPeerNameRef.current = caller.userName || "مجهول";
          },
          
          onOutgoingCallAccepted: () => { setCallStatus('CONNECTED'); },

          onIncomingCallCanceled: (callID, caller) => {
             showToast(`قام ${caller.userName || 'المتصل'} بإلغاء المكالمة.`, 'info');
             addCallLog({
               id: Date.now().toString(),
               name: caller.userName || "مجهول",
               status: 'missed',
               time: new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}),
               type: 'incoming'
             });
             setCallStatus('IDLE');
          },
          
          onOutgoingCallDeclined: (callID, callee) => {
             const calleeName = callee.userName || 'المستخدم';
             showToast(`❌ قام ${calleeName} برفض مكالمتك.`, 'error');
             addCallLog({
               id: Date.now().toString(),
               name: calleeName,
               status: 'rejected',
               time: new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}),
               type: 'outgoing'
             });
             setCallStatus('IDLE');
          },

          onCallInvitationEnded: (reason, data) => {
            if (callStartTimeRef.current) {
              const durationMs = Date.now() - callStartTimeRef.current;
              if (durationMs > 1000) { 
                  addCallLog({
                    id: Date.now().toString(),
                    name: currentPeerNameRef.current || "مستخدم",
                    status: 'completed',
                    duration: formatDuration(durationMs),
                    time: new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}),
                    type: 'outgoing'
                  });
              }
              callStartTimeRef.current = null;
            }
            window.location.reload();
          },
        });
        setIsZegoReady(true);
      } catch (error) { console.error(error); }
    };
    initZego();
  }, [myId, username, isDoNotDisturb]); 

  const handleCallUser = async (targetUser: { id: string, username: string }) => {
    if (!zegoInstanceRef.current) {
        showToast("انتظر قليلاً، جاري الاتصال بالخادم...", 'info');
        return;
    }
    showToast("جاري التحقق من حالة المستخدم...", "info");
    const targetId = targetUser.id.trim(); 
    const targetName = targetUser.username || "مستخدم";
    
    try {
        const snapshot = await get(ref(db, `users/${targetId}`));
        const userData = snapshot.val();

        if (userData && userData.isBusy) {
            alert(`⚠️ عذراً، ${targetName} قام بتحديد من يمكنه الاتصال به الآن.`);
            const notifRef = ref(db, `notifications/${targetId}`);
            await push(notifRef, {
                callerName: username, callerId: myId, timestamp: serverTimestamp(), read: false
            });
            showToast("تم إرسال رسالة للمستخدم تخبره بأنك حاولت الاتصال.", "info");
            addCallLog({
                id: Date.now().toString(), name: targetName, status: 'blocked',
                time: new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}), type: 'outgoing'
            });
            return; 
        }
        currentPeerNameRef.current = targetName;
        zegoInstanceRef.current.sendCallInvitation({
            callees: [{ userID: targetId, userName: targetName }],
            callType: ZegoUIKitPrebuilt.InvitationTypeVideoCall,
            timeout: 60,
        }).then((res) => {
            if (res.errorInvitees.length) {
                showToast("المستخدم غير متاح حالياً (أوفلاين).", 'error');
            }
        });
    } catch (err) { console.error(err); showToast("حدث خطأ في الاتصال", 'error'); }
  };

  return (
    <div className="bg-gray-50 min-h-screen main-container" style={{ paddingBottom: '70px' }}>
        
        {callStatus === 'IDLE' && (
          <>
            <div 
              className="sudan-flag" 
              onClick={() => setShowAboutModal(true)} 
              style={{ 
                position: 'fixed', top: '15px', left: '15px', zIndex: 1000, 
                width: '50px', height: '33px', borderRadius: '5px', overflow: 'hidden',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                animation: 'flagWave 3s ease-in-out infinite alternate',
                cursor: 'pointer', transition: 'transform 0.2s'
              }}
              title="عن المطور"
            >
              <div style={{ height: '33.3%', background: '#DE0000' }}></div>
              <div style={{ height: '33.3%', background: '#FFFFFF' }}></div>
              <div style={{ height: '33.3%', background: '#000000' }}></div>
              <div style={{
                position: 'absolute', top: 0, left: 0, 
                width: 0, height: 0,
                borderTop: '16.5px solid transparent', borderBottom: '16.5px solid transparent',
                borderLeft: '25px solid #007229',
              }}></div>
            </div>

            <button 
              onClick={() => setShowHistoryModal(true)}
              style={{
                position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000,
                background: '#fff', color: '#1e293b',
                border: '1px solid #e2e8f0', borderRadius: '50px',
                padding: '10px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                cursor: 'pointer', transition: 'transform 0.2s'
              }}
            >
              🕒 سجل المكالمات
            </button>
          </>
        )}

        {showHistoryModal && (
          <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
            <div className="card modal-content" onClick={(e) => e.stopPropagation()}>
               <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: '800' }}>سجل المكالمات</h3>
               <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                 {callHistory.length === 0 ? (
                   <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>لا توجد مكالمات حديثة</p>
                 ) : (
                   callHistory.map((log) => (
                     <div key={log.id} style={{ 
                       display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                       padding: '12px', borderBottom: '1px solid #f1f5f9'
                     }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <div style={{ fontSize: '20px' }}>
                           {log.status === 'completed' ? '✅' : log.status === 'rejected' ? '🚫' : log.status === 'blocked' ? '⛔' : '📞'}
                         </div>
                         <div>
                           <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{log.name}</p>
                           <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                             {log.status === 'completed' ? 'ناجحة' : log.status === 'rejected' ? 'مرفوضة' : log.status === 'blocked' ? 'كان مشغولاً' : 'فائتة'}
                           </p>
                         </div>
                       </div>
                       <div style={{ textAlign: 'left' }}>
                         <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>{log.time}</p>
                         {log.duration && <p style={{ margin: 0, fontSize: '11px', color: '#10b981' }}>{log.duration}</p>}
                       </div>
                     </div>
                   ))
                 )}
               </div>
               <button onClick={() => setShowHistoryModal(false)} className="btn" style={{ marginTop: '20px' }}>إغلاق</button>
            </div>
          </div>
        )}

        {showAboutModal && (
          <div className="modal-overlay" onClick={() => setShowAboutModal(false)}>
            <div className="card modal-content" onClick={(e) => e.stopPropagation()}>
               <div style={{ fontSize: '50px', marginBottom: '10px' }}>🇸🇩</div>
               <h2 style={{ fontWeight: '800', color: '#111827', marginBottom: '5px' }}>Face2</h2>
               <p style={{ color: '#10b981', fontWeight: '700', marginBottom: '20px', fontSize: '14px' }}>
                 أول تطبيق اتصال سوداني آمن 🔒
               </p>
               <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', lineHeight: '1.6', color: '#334155' }}>
                 <p style={{ marginBottom: '10px' }}>تم تطوير هذا التطبيق بواسطة:</p>
                 <a 
                   href="https://www.facebook.com/share/1KjS11eHuP/" 
                   target="_blank" rel="noopener noreferrer"
                   style={{ fontSize: '18px', fontWeight: '800', color: '#4f46e5', marginBottom: '15px', display: 'block', textDecoration: 'none' }}
                 >
                   Mustafa Omar Ahmed ↗
                 </a>
                 <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />
                 <p style={{ fontSize: '13px', color: '#64748b' }}>
                   "يمكن لأي شخص إنشاء تطبيق بالذكاء الاصطناعي.. كل ما يهم هو <strong>فكرة الشخص</strong> وإصراره على بناء شيء جميل." ✨
                 </p>
                 <p style={{ fontSize: '11px', marginTop: '10px', color: '#94a3b8' }}>Powered by Gemini AI 🤖</p>
               </div>
               <button onClick={() => setShowAboutModal(false)} className="btn" style={{ padding: '10px 20px', borderRadius: '30px' }}>
                 إغلاق
               </button>
            </div>
          </div>
        )}

        {notification && (
          <div className="toast-notification" style={{
             background: notification.type === 'error' ? '#fee2e2' : '#e0e7ff',
             color: notification.type === 'error' ? '#991b1b' : '#3730a3',
             border: `1px solid ${notification.type === 'error' ? '#f87171' : '#818cf8'}`,
          }}>
            {notification.type === 'error' ? '🚫' : 'ℹ️'} {notification.message}
          </div>
        )}

        {callStatus === 'IDLE' && (
          <>
            <div className="flex flex-col gap-4 p-4 bg-white shadow-sm mb-6 rounded-2xl card">
                
                <div className="flex justify-between items-center w-full">
                  <Header />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', 
                        color: isZegoReady ? '#10b981' : '#ef4444', 
                        fontSize: '13px', fontWeight: '600',
                        background: isZegoReady ? '#ecfdf5' : '#fee2e2',
                        padding: '6px 12px', borderRadius: '20px',
                        border: `1px solid ${isZegoReady ? '#d1fae5' : '#fecaca'}`,
                    }}>
                        <span className={`status-dot ${isZegoReady ? 'online' : 'offline'}`} style={{ margin: 0 }}></span>
                        {isZegoReady ? 'متصل' : 'جاري...'}
                    </span>
                    <button onClick={handleLogout} className="btn-danger" style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', width: 'auto' }}>
                      خروج
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>حالة الاستقبال:</span>
                    <button 
                      onClick={toggleDoNotDisturb}
                      style={{
                        background: isDoNotDisturb ? '#fee2e2' : '#dcfce7',
                        color: isDoNotDisturb ? '#ef4444' : '#10b981',
                        border: `1px solid ${isDoNotDisturb ? '#fca5a5' : '#86efac'}`,
                        padding: '6px 16px', borderRadius: '30px',
                        fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                        transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      {isDoNotDisturb ? '⛔ مشغول (حجب)' : '✅ متاح للاتصال'}
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4">
              <div className="text-center mb-6" style={{ animation: 'fadeIn 1s ease-out' }}>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  مرحباً، <span className="text-indigo-600">{username}</span> 👋
                </h1>
                <p className="text-gray-500">اختر صديقاً وابدأ المحادثة فوراً</p>
              </div>
              
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 card">
                 <UserSearch onCall={handleCallUser} />
              </div>
            </div>
          </>
        )}
    </div>
  );
}