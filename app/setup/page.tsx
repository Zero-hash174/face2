'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../firebase/firebase'
import { ref, set, serverTimestamp, onDisconnect, remove } from 'firebase/database'

// قائمة صور رمزية (50 إيموجي)
const AVATARS = [
    "🦁", "🐯", "🐱", "🐶", "🦊", "🐻", "🐨", "🐼", "🐸", "🦄", 
    "🤖", "👽", "💀", "👻", "🤡", "🤠", "🎃", "👶", "🧑‍🚀", "👮‍♂️",
    "👩‍🔬", "👨‍🎤", "🧑‍💻", "👩‍🎨", "👨‍🍳", "🦸", "🦹", "🧛", "🧟", "🧞",
    "🧚", "🧜", "👼", "👑", "🎩", "🎓", "💍", "💎", "🔮", "🧿",
    "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🎳", "🎯"
];

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function Setup() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('👤') // الصورة الافتراضية
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
      setMounted(true);
      // محاولة استرجاع البيانات القديمة إذا وجدت
      const savedName = localStorage.getItem('face2_username');
      const savedAvatar = localStorage.getItem('face2_avatar');
      if (savedName) setUsername(savedName);
      if (savedAvatar) setAvatar(savedAvatar);
  }, []);

  const handleSave = async () => {
    if (!username.trim()) return alert("الرجاء كتابة اسمك");
    setIsSubmitting(true);

    try {
      let userId = localStorage.getItem('face2_userId');
      if (!userId) userId = generateId();

      const userRef = ref(db, 'users/' + userId);
      
      // التأكد من الحذف عند الانقطاع المفاجئ أثناء التسجيل (اختياري)
      onDisconnect(userRef).remove();

      await set(userRef, {
        username: username.trim(),
        avatar: avatar,
        isOnline: true,
        lastActive: serverTimestamp(),
      });

      localStorage.setItem('face2_userId', userId);
      localStorage.setItem('face2_username', username.trim());
      localStorage.setItem('face2_avatar', avatar);

      router.push('/call');
    } catch (error) {
      console.error("Error:", error);
      alert("حدث خطأ، حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!mounted) return null;

  return (
    <div 
        style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh', 
            padding: '20px', 
            background: '#111827', // لون خلفية داكن
            color: 'white',
            fontFamily: 'Cairo, sans-serif'
        }}
    >
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            
            <h1 style={{ marginBottom: '10px', fontSize: '28px', fontWeight: 'bold' }}>
                Face2 <span style={{color: '#4f46e5'}}>App</span>
            </h1>
            <p style={{color: '#9ca3af', marginBottom: '30px', fontSize: '14px'}}>
                أنشئ ملفك الشخصي في ثوانٍ 🚀
            </p>

            {/* ✅ 1. منطقة معاينة البروفايل (الجديدة) */}
            <div style={{ marginBottom: '30px', position: 'relative', display: 'inline-block' }}>
                <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                    border: '4px solid #4f46e5', // إطار ملون
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '60px',
                    boxShadow: '0 0 30px rgba(79, 70, 229, 0.3)', // توهج
                    margin: '0 auto',
                    transition: 'all 0.3s ease'
                }}>
                    {avatar}
                </div>
                {/* أيقونة صغيرة تدل على التعديل */}
                <div style={{
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    background: '#4f46e5',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #111827',
                    fontSize: '14px'
                }}>
                    ✏️
                </div>
            </div>

            {/* قائمة اختيار الصور (مع سكرول) */}
            <div style={{ marginBottom: '25px' }}>
                <p style={{textAlign: 'right', fontSize: '12px', color: '#9ca3af', marginBottom: '8px', marginRight: '5px'}}>
                    اختر شخصية:
                </p>
                <div 
                    style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        padding: '5px',
                        overflowX: 'auto',
                        scrollbarWidth: 'none', 
                        msOverflowStyle: 'none',
                    }}
                >
                    {AVATARS.map((av, index) => (
                        <button
                        key={index}
                        onClick={() => setAvatar(av)}
                        style={{
                            fontSize: '24px', 
                            minWidth: '50px', 
                            height: '50px',
                            borderRadius: '12px',
                            border: avatar === av ? '2px solid #4f46e5' : '1px solid rgba(255,255,255,0.1)',
                            background: avatar === av ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255,255,255,0.05)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            flexShrink: 0
                        }}
                        >
                        {av}
                        </button>
                    ))}
                </div>
            </div>

            {/* إدخال الاسم */}
            <div style={{marginBottom: '20px'}}>
                <input 
                    type="text" 
                    placeholder="اكتب اسمك المستعار..." 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    style={{ 
                        width: '100%', 
                        padding: '15px', 
                        borderRadius: '15px', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        background: '#1f2937',
                        fontSize: '16px', 
                        color: 'white', 
                        textAlign: 'center', 
                        fontFamily: 'Cairo',
                        outline: 'none'
                    }}
                />
            </div>

            {/* زر الدخول */}
            <button 
                onClick={handleSave} 
                disabled={isSubmitting}
                style={{ 
                    width: '100%', 
                    padding: '16px', 
                    borderRadius: '30px', 
                    border: 'none', 
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
                    color: 'white', 
                    fontWeight: 'bold', 
                    fontSize: '18px', 
                    cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                    opacity: isSubmitting ? 0.7 : 1, 
                    boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)',
                    transition: 'transform 0.2s'
                }}
            >
                {isSubmitting ? 'جاري التحضير...' : 'دخول للمحادثة ✨'}
            </button>
            
            <p style={{marginTop: '20px', fontSize: '11px', color: '#6b7280'}}>
                بالضغط على دخول، أنت توافق على سياسة الاستخدام الآمن.
            </p>

        </div>
    </div>
  )
}