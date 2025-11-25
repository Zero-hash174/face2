'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../firebase/firebase'
import { ref, set, serverTimestamp } from 'firebase/database'
import { nanoid } from 'nanoid' // تأكد أنك مثبت المكتبة دي أو استخدم دالة عشوائية

export default function Setup() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('👤')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const avatars = [
  '👤','👨‍💻','🧕','🧔','👩‍🎨',
  '👨‍🚀','👩‍⚕️','👮','🕵️','🤴',
  '👸','🧙','🧛','🧞','🧜‍♂️',
  '🐶','🐱','🐵','🐯','🐼',
  '🦊','🦁','🐸','🐰','🐺',
  '🐨','🐮','🐥','🐢','🐬',
  '🐳','🐍','🐧','🐹','🦒',
  '🦓','🦘','🐴','🐻','🐝',
  '🤖','👽','👾','👻','💀',
  '🤡','😎','😺','😼','🤠'
];


  const handleSave = async () => {
    if (!username.trim()) return alert("اكتب اسمك يا زول!");
    setIsSubmitting(true);

    try {
      // 1. التحقق: هل يوجد ID قديم؟
      let userId = localStorage.getItem('face2_userId');
      
      // 2. إذا لم يوجد، ننشئ واحداً جديداً (لأول مرة فقط)
      if (!userId) {
        userId = nanoid(8); // كود عشوائي قصير
        localStorage.setItem('face2_userId', userId!);
      }

      // 3. حفظ البيانات الجديدة في المتصفح
      localStorage.setItem('face2_username', username);
      localStorage.setItem('face2_avatar', avatar);
      // إعادة تصفير السجل ليبدو كحساب جديد
      localStorage.setItem('face2_history', JSON.stringify([]));

      // 4. تحديث بيانات المستخدم في Firebase (نفس الـ ID، بيانات جديدة)
      await set(ref(db, `users/${userId}`), {
        id: userId,
        username: username,
        avatar: avatar,
        online: true,
        isBusy: false,
        inMeeting: false,
        lastSeen: serverTimestamp()
      });

      // 5. الذهاب للمكالمات
      router.push('/call');

    } catch (error) {
      console.error("Error setup:", error);
      alert("حدث خطأ، حاول مرة أخرى");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#1e293b', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
        
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', fontFamily: 'Cairo, sans-serif' }}>إعداد الحساب الجديد 🚀</h1>
        
        {/* اختيار الصورة */}
        <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '60px', marginBottom: '10px' }}>{avatar}</div>
            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {avatars.map(av => (
                    <button key={av} onClick={() => setAvatar(av)} style={{ fontSize: '24px', background: avatar === av ? '#4f46e5' : '#334155', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer' }}>
                        {av}
                    </button>
                ))}
            </div>
        </div>

        {/* إدخال الاسم */}
        <input 
            type="text" 
            placeholder="اكتب اسمك هنا..." 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={{ width: '100%', padding: '15px', borderRadius: '10px', border: 'none', marginBottom: '20px', fontSize: '16px', color: '#000', textAlign: 'center', fontFamily: 'Cairo, sans-serif' }}
        />

        <button 
            onClick={handleSave} 
            disabled={isSubmitting}
            style={{ width: '100%', padding: '15px', borderRadius: '10px', border: 'none', background: '#4f46e5', color: 'white', fontWeight: 'bold', fontSize: '18px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
        >
            {isSubmitting ? 'جاري الدخول...' : 'بدء الاستخدام ✅'}
        </button>

      </div>
    </div>
  )
}