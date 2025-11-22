'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt'
import { ZIM } from 'zego-zim-web'
import { db } from '../../firebase/firebase'
import { ref, update, onDisconnect, serverTimestamp, get, push, onChildAdded, remove } from 'firebase/database'
import UserSearch from '../components/UserSearch'
import Header from '../components/Header'

// ==========================================
// ⚙️ إعدادات التطبيق
// ==========================================
const APP_ID = 221724333;
const SERVER_SECRET = "480e962860b99d4828e308ff7f340cf8";

// 🟢🟢 الرابط الرسمي الثابت (استراتيجية الجذب) 🟢🟢
// الآن أي رابط دعوة سيخرج من التطبيق سيكون موجهاً لهذا النطاق حصراً
const PUBLIC_DOMAIN = "https://face2-three.vercel.app"; 

const CALL_LIMIT_MS = 60 * 60 * 1000;
const WARNING_COUNTDOWN_SEC = 15;

type CallLog = {
  id: string;
  name: string;
  avatar?: string;
  status: 'completed' | 'rejected' | 'missed' | 'blocked' | 'timeout';
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
  const [darkMode, setDarkMode] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [autoEndCountdown, setAutoEndCountdown] = useState(WARNING_COUNTDOWN_SEC);

  const searchParams = useSearchParams();
  const targetIdFromLink = searchParams.get('target');

  const callLimitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  
  const currentPeerNameRef = useRef<string>("");
  const currentPeerAvatarRef = useRef<string>("👤");
  const currentRoomIdRef = useRef<string>("");

  const router = useRouter();
  const zegoInstanceRef = useRef<ZegoUIKitPrebuilt | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // دالة تشغيل الاهتزاز
  const startVibration = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500, 200, 500, 200]); 
    }
  };

  // دالة إيقاف الاهتزاز
  const stopVibration = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(0);
    }
  };

  // 🟢 دالة المشاركة الذكية (تستخدم الرابط الرسمي دائماً)
  const shareInviteSmart = async () => {
    if (!myId) return;
    
    // سيتم استخدام رابط Vercel الرسمي دائماً
    const inviteLink = `${PUBLIC_DOMAIN}/call?target=${myId}`;
    
    const title = "دعوة مكالمة Face2";
    const text = `مرحباً 👋
أنا *${username}* وأدعوك لمكالمة فيديو آمنة وسريعة عبر تطبيق *Face2*.

📞 رقم الاجتماع: ${myId}
👇 اضغط هنا للرد مباشرة:
${inviteLink}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: inviteLink });
      } catch (error) { console.log('Sharing cancelled'); }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        showToast('✅ تم نسخ رابط الدعوة الرسمي!', 'info');
      } catch (err) { showToast('❌ حدث خطأ.', 'error'); }
    }
  };

  // 🟢 دالة واتساب (تستخدم الرابط الرسمي دائماً)
  const sendWhatsAppInvite = () => {
    if (!myId) return;
    
    const inviteLink = `${PUBLIC_DOMAIN}/call?target=${myId}`;
    
    const message = `مرحباً 👋
أنا *${username}* وأدعوك لمكالمة فيديو آمنة وسريعة عبر تطبيق *Face2*.

📞 رقم الاجتماع: ${myId}
👇 اضغط هنا للرد مباشرة:
${inviteLink}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // التعامل مع رابط الدعوة
  useEffect(() => {
    if (targetIdFromLink && isZegoReady && myId && targetIdFromLink !== myId) {
       showToast(`🔗 لقد فتحت رابط دعوة. ابحث عن المستخدم في القائمة للاتصال به.`, 'info');
    }
  }, [targetIdFromLink, isZegoReady, myId]);

  // ... (باقي الكود كما هو بدون تغيير) ...
  useEffect(() => {
    if (callStatus === 'CONNECTED') {
      document.body.style.overflow = 'hidden'; 
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
    };
  }, [callStatus]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('face2_theme');
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('face2_theme', newMode ? 'dark' : 'light');
  };

  const showToast = (message: string, type: 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getUserAvatar = async (userId: string) => {
    try {
      const snapshot = await get(ref(db, `users/${userId}/avatar`));
      if (snapshot.exists()) return snapshot.val();
      return "👤";
    } catch (error) { return "👤"; }
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const addCallLog = (log: CallLog) => {
    setCallHistory(prev => {
      const exists = prev.some(item => item.id === log.id);
      if (exists) return prev;
      const updatedLogs = [log, ...prev];
      localStorage.setItem('face2_history', JSON.stringify(updatedLogs));
      return updatedLogs;
    });
  };

  const clearHistory = () => {
    if (window.confirm("🗑️ هل أنت متأكد من حذف السجل بالكامل؟")) {
      setCallHistory([]);
      localStorage.removeItem('face2_history');
      showToast("✨ تم تنظيف السجل بنجاح", "info");
    }
  };

  const toggleDoNotDisturb = () => {
    const newStatus = !isDoNotDisturb;
    setIsDoNotDisturb(newStatus);
    if (myId) {
      update(ref(db, `users/${myId}`), { isBusy: newStatus });
      showToast(newStatus ? "⛔ تم تفعيل وضع عدم الإزعاج" : "✅ أنت متاح لاستقبال المكالمات", newStatus ? 'error' : 'info');
    }
  };

  const forceEndCall = () => {
    stopVibration(); 
    setCallStatus('IDLE');
    if (myId) update(ref(db, `users/${myId}`), { inMeeting: false });
    if(videoContainerRef.current) videoContainerRef.current.innerHTML = ''; 
    if (zegoInstanceRef.current) { try { zegoInstanceRef.current.hangUp(); } catch(e){} }
    setTimeout(() => { window.location.href = '/call'; }, 300); 
  };

  useEffect(() => {
    if (callStatus === 'CONNECTED') {
      startInactivityTimer();
    } else {
      clearTimers();
    }
    return () => clearTimers();
  }, [callStatus]);

  const startInactivityTimer = () => {
    if (callLimitTimerRef.current) clearTimeout(callLimitTimerRef.current);
    callLimitTimerRef.current = setTimeout(() => {
      setShowTimeoutModal(true);
      startCountdown();
    }, CALL_LIMIT_MS);
  };

  const startCountdown = () => {
    setAutoEndCountdown(WARNING_COUNTDOWN_SEC);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setAutoEndCountdown((prev) => {
        if (prev <= 1) {
          handleAutoHangup();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAutoHangup = () => {
    clearTimers();
    setShowTimeoutModal(false);
    forceEndCall();
  };

  const handleContinueCall = () => {
    setShowTimeoutModal(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    startInactivityTimer();
    showToast("✅ تم تمديد المكالمة، استمتع!", "info");
  };

  const clearTimers = () => {
    if (callLimitTimerRef.current) clearTimeout(callLimitTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setShowTimeoutModal(false);
  };

  // تهيئة المستخدم
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('face2_userId');
      const storedUsername = localStorage.getItem('face2_username');
      const storedHistory = localStorage.getItem('face2_history');

      if (storedHistory) { try { setCallHistory(JSON.parse(storedHistory)); } catch (e) { } }

      if (!storedId || !storedUsername) {
        router.push('/setup');
      } else {
        setMyId(storedId);
        setUsername(storedUsername);

        const userRef = ref(db, `users/${storedId}`);
        update(userRef, { online: true, isBusy: false, inMeeting: false, lastSeen: serverTimestamp() });
        onDisconnect(userRef).update({ online: false, inMeeting: false, lastSeen: serverTimestamp() });

        const notificationsRef = ref(db, `notifications/${storedId}`);
        onChildAdded(notificationsRef, async (snapshot) => {
          const data = snapshot.val();
          if (data && !data.read) {
            update(ref(db, `notifications/${storedId}/${snapshot.key}`), { read: true });
            let callerAvatar = "👤";
            if (data.callerId) callerAvatar = await getUserAvatar(data.callerId);

            if (data.type === 'missed_call') {
              addCallLog({
                id: `missed_${Date.now()}`,
                name: data.callerName,
                avatar: callerAvatar,
                status: 'blocked',
                time: new Date(data.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                type: 'incoming'
              });
              showToast(`⛔ ${data.callerName} حاول الاتصال بك وأنت مشغول.`, 'info');
            } else {
              showToast(`🔔 إشعار: ${data.callerName} حاول الاتصال بك.`, 'info');
            }
          }
        });
      }
    }
  }, [router]);

  const handleLogout = () => {
    if (myId) { remove(ref(db, `users/${myId}`)); }
    localStorage.removeItem('face2_userId');
    localStorage.removeItem('face2_username');
    localStorage.removeItem('face2_avatar');
    if (zegoInstanceRef.current) zegoInstanceRef.current.destroy();
    window.location.href = '/setup';
  };

  // تهيئة Zego
  useEffect(() => {
    if (!myId || !username) return;
    if (zegoInstanceRef.current) return;

    const initZego = async () => {
      try {
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(APP_ID, SERVER_SECRET, "face2_global_room", myId, username);
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zp.addPlugins({ ZIM });
        zegoInstanceRef.current = zp;

        zp.setCallInvitationConfig({
          onSetRoomConfigBeforeJoining: (callType) => {
            stopVibration(); 
            setCallStatus('CONNECTED');
            callStartTimeRef.current = Date.now();
            if (myId) update(ref(db, `users/${myId}`), { inMeeting: true });

            return {
              container: videoContainerRef.current,
              scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
              videoResolutionList: [ZegoUIKitPrebuilt.VideoResolution_180P],
              videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_180P,
              showScreenSharingButton: false,
              maxMemberCount: 2,
              showPreJoinView: false,
              turnOnMicrophoneWhenJoining: true,
              turnOnCameraWhenJoining: true,
              showMyCameraToggleButton: true,
              showMyMicrophoneToggleButton: true,
              showAudioVideoSettingsButton: true,
              onUserLeave: (users) => { showToast(`📴 الطرف الآخر أنهى المكالمة`, 'info'); forceEndCall(); },
              onLeaveRoom: () => { forceEndCall(); }
            };
          },
          onIncomingCallReceived: (callID, caller) => {
            if (isDoNotDisturb && zegoInstanceRef.current) { 
                zegoInstanceRef.current.hangUp(); 
                return; 
            }
            startVibration(); 
            currentRoomIdRef.current = callID;
            currentPeerNameRef.current = caller.userName || "مجهول";
            getUserAvatar(caller.userID).then(avatar => { currentPeerAvatarRef.current = avatar; });
          },
          onIncomingCallCanceled: () => { 
            stopVibration(); 
            setCallStatus('IDLE'); 
            if (myId) update(ref(db, `users/${myId}`), { inMeeting: false }); 
          },
          onOutgoingCallAccepted: (callID) => { setCallStatus('CONNECTED'); currentRoomIdRef.current = callID; },
          onOutgoingCallDeclined: (callID, callee) => {
            showToast(`❌ للأسف، رفض ${callee.userName} المكالمة.`, 'error');
            setCallStatus('IDLE');
            if (myId) update(ref(db, `users/${myId}`), { inMeeting: false });
            addCallLog({ id: `rejected_${Date.now()}`, name: callee.userName || "مستخدم", avatar: currentPeerAvatarRef.current, status: 'rejected', time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'outgoing' });
          },
          onCallInvitationEnded: (reason, data) => {
            stopVibration(); 
            if (callStartTimeRef.current) {
              const durationMs = Date.now() - callStartTimeRef.current;
              if (durationMs > 1000) {
                addCallLog({ id: `call_${Date.now()}`, name: currentPeerNameRef.current || "مستخدم", avatar: currentPeerAvatarRef.current, status: 'completed', duration: formatDuration(durationMs), time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), type: 'outgoing' });
              }
              callStartTimeRef.current = null;
            }
            if (callStatus === 'CONNECTED') { forceEndCall(); } else { setCallStatus('IDLE'); if (myId) update(ref(db, `users/${myId}`), { inMeeting: false }); if(videoContainerRef.current) videoContainerRef.current.innerHTML = ''; }
          },
        });
        setIsZegoReady(true);
      } catch (error) { console.error(error); }
    };
    initZego();

    return () => {
        stopVibration(); 
        if (zegoInstanceRef.current) {
            zegoInstanceRef.current.destroy();
            zegoInstanceRef.current = null;
        }
    };
  }, [myId, username, isDoNotDisturb]);

  const handleCallUser = async (targetUser: { id: string, username: string }) => {
    if (!zegoInstanceRef.current) return showToast("⚠️ النظام غير جاهز، انتظر لحظة...", 'info');
    showToast(`...`, "info");
    const targetId = targetUser.id.trim();
    const targetName = targetUser.username || "مستخدم";

    try {
      const snapshot = await get(ref(db, `users/${targetId}`));
      const userData = snapshot.val();

      if (userData && userData.avatar) currentPeerAvatarRef.current = userData.avatar;
      else currentPeerAvatarRef.current = "👤";

      if (userData && userData.isBusy) {
        push(ref(db, `notifications/${targetId}`), { callerName: username, callerId: myId, timestamp: serverTimestamp(), read: false, type: 'missed_call' });
        showToast(`🔕 ${targetName} في وضع "عدم الإزعاج".`, 'info');
        return;
      }
      if (userData && userData.inMeeting) { showToast(`⚠️ ${targetName} في مكالمة فيديو أخرى حالياً.`, 'error'); return; }

      showToast(`📞 جاري الاتصال بـ ${targetUser.username}...`, "info");
      currentPeerNameRef.current = targetName;
      zegoInstanceRef.current.sendCallInvitation({ callees: [{ userID: targetId, userName: targetName }], callType: ZegoUIKitPrebuilt.InvitationTypeVideoCall, timeout: 60 }).then((res) => { if (res.errorInvitees.length) showToast("📴 تعذر الاتصال (المستخدم غير متصل).", 'error'); });
    } catch (err) { console.error(err); showToast("❌ خطأ في الاتصال بالشبكة", 'error'); }
  };

  const theme = {
    bg: darkMode ? '#0f172a' : '#f9fafb', card: darkMode ? '#1e293b' : '#ffffff', text: darkMode ? '#f1f5f9' : '#1f2937',
    subText: darkMode ? '#94a3b8' : '#6b7280', border: darkMode ? '#334155' : '#f3f4f6', accentText: darkMode ? '#818cf8' : '#4f46e5', modalBg: darkMode ? '#1e293b' : '#ffffff'
  };

  return (
    <div className="main-container" style={{ backgroundColor: theme.bg, minHeight: '100vh', paddingBottom: '70px', position: 'relative', transition: 'background-color 0.4s ease-in-out, color 0.4s ease-in-out' }}>
      <style jsx global>{`
           .zego_toast { display: none !important; }
           .ZegoRoomMessage { display: none !important; }
           .ZegoUIKitUser-mobile { z-index: 99999999 !important; }
           
           .ZegoUIKitPrebuilt-Call-Invitation-Page {
               position: fixed !important; inset: 0 !important; z-index: 2147483647 !important;
               background-color: #000 !important; height: 100vh !important; width: 100vw !important;
               overflow: hidden !important; touch-action: none !important; 
           }
           .ZegoUIKitPrebuilt-Call-Invitation-Page-Action-Container {
               display: flex !important; justify-content: center !important; align-items: center !important;
               width: 100% !important; position: absolute !important; bottom: 80px !important; 
               left: 50% !important; transform: translateX(-50%) !important; gap: 0 !important;
           }
           .ZegoUIKitPrebuilt-Call-Invitation-Page-Action-Container > div {
               margin-inline: 60px !important; transform: scale(1.2) !important;
           }
           ::-webkit-scrollbar { width: 8px; }
           ::-webkit-scrollbar-track { background: ${darkMode ? '#1e293b' : '#f1f1f1'}; }
           ::-webkit-scrollbar-thumb { background: ${darkMode ? '#475569' : '#c1c1c1'}; borderRadius: 10px; }
           ::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#64748b' : '#a8a8a8'}; }
      `}</style>

      {showTimeoutModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999999, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '300px', textAlign: 'center', background: theme.modalBg, padding: '20px', color: theme.text }}>
            <h2 style={{fontSize: '24px', marginBottom: '10px'}}>😴 هل أنت نائم؟</h2>
            <p style={{marginBottom: '20px', color: theme.subText}}>ستنتهي المكالمة تلقائياً خلال: <span style={{fontWeight:'bold', color:'#ef4444'}}>{autoEndCountdown}</span></p>
            <button onClick={handleContinueCall} className="btn">✅ أنا هنا، متابعة</button>
          </div>
        </div>
      )}

      {notification && ( <div className="toast-notification" style={{ background: notification.type === 'error' ? '#fee2e2' : '#e0e7ff', color: notification.type === 'error' ? '#991b1b' : '#3730a3' }}> {notification.message} </div> )}

      {callStatus === 'IDLE' && (
        <div className="sudan-flag" onClick={() => setShowAboutModal(true)} style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 9999, width: '45px', height: '30px', borderRadius: '5px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', cursor: 'pointer', transition: 'transform 0.2s' }} title="عن المطور 🇸🇩">
             <div style={{ height: '33.3%', background: '#DE0000' }}></div>
             <div style={{ height: '33.3%', background: '#FFFFFF' }}></div>
             <div style={{ height: '33.3%', background: '#000000' }}></div>
             <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, borderTop: '15px solid transparent', borderBottom: '15px solid transparent', borderLeft: '20px solid #007229' }}></div>
        </div>
      )}

      {callStatus === 'IDLE' && (
        <>
          <div className="flex flex-col gap-4 p-4 shadow-sm mb-6 rounded-2xl card" style={{ backgroundColor: theme.card, color: theme.text, transition: 'background-color 0.4s ease' }}>
            <div className="flex justify-between items-center w-full">
              <Header />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                
                {/* زر المشاركة الذكي الشامل */}
                <button onClick={shareInviteSmart} style={{ backgroundColor: '#4f46e5', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)' }} title="دعوة صديق (مشاركة)">
                  <span style={{ fontSize: '22px', color: '#fff' }}>🔗</span>
                </button>

                {/* زر واتساب لا زال موجوداً كخيار سريع */}
                <button onClick={sendWhatsAppInvite} style={{ backgroundColor: '#25D366', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)' }} title="دعوة صديق عبر واتساب">
                  <span style={{ fontSize: '22px' }}>💬</span>
                </button>

                <button onClick={handleLogout} className="btn-danger" style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '12px', width: 'auto' }}>خروج 👋</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${theme.border}`, paddingTop: '15px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: theme.subText }}>حالة الاستقبال:</span>
              <button onClick={toggleDoNotDisturb} style={{ background: isDoNotDisturb ? '#fee2e2' : (darkMode ? '#064e3b' : '#dcfce7'), color: isDoNotDisturb ? '#ef4444' : '#10b981', border: `1px solid ${isDoNotDisturb ? '#fca5a5' : (darkMode ? '#065f46' : '#86efac')}`, padding: '6px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isDoNotDisturb ? '⛔ مشغول' : '✅ متاح'}
              </button>
            </div>
          </div>
          <div className="container mx-auto px-4">
            <div className="text-center mb-6" style={{ animation: 'fadeIn 1s ease-out' }}>
              <h1 className="text-3xl font-bold mb-2" style={{ color: theme.text }}>مرحباً، <span style={{ color: theme.accentText }}>{username}</span> 👋</h1>
              <p style={{ color: theme.subText }}>اختر صديقاً وابدأ المحادثة فوراً 👇</p>
            </div>
            <div className="p-6 rounded-3xl shadow-xl border card" style={{ backgroundColor: theme.card, borderColor: theme.border, transition: 'background-color 0.4s ease' }}>
              <UserSearch 
                onCall={handleCallUser} 
                inCall={false} 
              />
            </div>
          </div>
          <button onClick={() => setShowHistoryModal(true)} style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000, background: theme.card, padding: '12px 24px', borderRadius: '50px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '14px', color: theme.text, border: `1px solid ${theme.border}`, display:'flex', alignItems:'center', gap:'8px' }}>🕒 السجل</button>
        </>
      )}
      
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="card modal-content" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: theme.modalBg, color: theme.text }}>
            <h3 style={{marginBottom: '15px', fontSize:'18px', fontWeight:'800'}}>📞 سجل المكالمات</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
              {callHistory.length === 0 ? ( <div style={{ textAlign: 'center', color: theme.subText, padding: '30px' }}> <p style={{fontSize: '40px', margin: 0}}>📭</p> <p>لا توجد مكالمات حديثة</p> </div> ) : callHistory.map((log) => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: `1px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: darkMode ? '#334155' : '#f1f5f9', color: theme.subText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px', border:`1px solid ${theme.border}` }}> {log.avatar || log.name.charAt(0).toUpperCase()} </div>
                    <div> <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', textAlign: 'right', color: theme.text }}>{log.name}</p> <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: theme.subText }}> <span> {log.status === 'completed' ? '✅ مكالمة ناجحة' : log.status === 'rejected' ? '🚫 مكالمة مرفوضة' : log.status === 'blocked' ? '⛔ كان مشغولاً' : log.status === 'timeout' ? '⏰ انتهت للسكون' : '📞 مكالمة فائتة'} </span> </div> </div>
                  </div>
                  <div style={{ textAlign: 'left' }}> <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', color: theme.subText }}>{log.time}</p> {log.duration && <p style={{ margin: 0, fontSize: '10px', color: '#10b981', fontWeight:'bold' }}>⏱️ {log.duration}</p>} </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}> <button onClick={clearHistory} className="btn-danger" style={{ flex: 1 }}>حذف الكل 🗑️</button> <button onClick={() => setShowHistoryModal(false)} className="btn" style={{ flex: 1 }}>إغلاق ✖️</button> </div>
          </div>
        </div>
      )}
      {showAboutModal && (
        <div className="modal-overlay" onClick={() => setShowAboutModal(false)}>
          <div className="card modal-content" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: theme.modalBg, color: theme.text }}>
            <div style={{ fontSize: '60px', marginBottom: '10px', animation: 'pop 0.5s' }}>🇸🇩</div>
            <h2 style={{ fontWeight: '800', color: theme.text, marginBottom: '5px' }}>Face2</h2>
            <p style={{ color: '#10b981', fontWeight: '700', marginBottom: '20px', fontSize: '14px' }}>أول تطبيق اتصال سوداني آمن 🔒</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: darkMode ? '#334155' : '#f3f4f6', padding: '10px 15px', borderRadius: '12px', marginBottom: '15px' }}> <span style={{ fontWeight: 'bold', fontSize: '14px', color: theme.text }}>المظهر:</span> <button onClick={toggleDarkMode} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '22px' }}> {darkMode ? '☀️ نهاري' : '🌙 ليلي'} </button> </div>
            <div style={{ background: darkMode ? '#334155' : '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', lineHeight: '1.6', color: theme.subText }}> <p style={{ marginBottom: '10px' }}>تم تطوير هذا التطبيق بكل ❤️ بواسطة:</p> <a href="https://www.facebook.com/share/1KjS11eHuP/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '18px', fontWeight: '800', color: theme.accentText, marginBottom: '15px', display: 'block', textDecoration: 'none' }}>Mustafa Omar Ahmed ↗</a> <hr style={{ border: 'none', borderTop: `1px solid ${theme.border}`, margin: '10px 0' }} /> <p style={{ fontSize: '13px', color: theme.subText }}>"يمكن لأي شخص إنشاء تطبيق بالذكاء الاصطناعي.. كل ما يهم هو <strong>فكرة الشخص</strong> وإصراره على بناء شيء جميل." ✨</p> <p style={{ fontSize: '11px', marginTop: '10px', color: theme.subText }}>Powered by Gemini AI 🤖</p> </div>
            <button onClick={() => setShowAboutModal(false)} className="btn" style={{ padding: '10px 20px', borderRadius: '30px' }}>إغلاق ✖️</button>
          </div>
        </div>
      )}

      <div ref={videoContainerRef} className="video-container-custom" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', zIndex: 10, backgroundColor: '#000', display: callStatus === 'CONNECTED' ? 'block' : 'none', }} />
    </div>
  );
}