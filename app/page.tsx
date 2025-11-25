'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // حالة تحميل لتجنب الوميض

  useEffect(() => {
    // التحقق من وجود بيانات المستخدم في المتصفح
    const userId = localStorage.getItem('face2_userId');
    
    if (userId) {
      // ✅ إذا كان لديه حساب -> حوله فوراً لصفحة المكالمات
      router.replace('/call');
    } else {
      // ❌ إذا لم يكن لديه حساب -> حوله لصفحة الإعداد (أو اترك الأزرار تظهر)
      // الأفضل: توجيهه للإعداد مباشرة لتسهيل الأمر
      router.replace('/setup');
      
      // ملاحظة: إذا كنت تفضل بقاء صفحة الترحيب للمستخدمين الجدد، احذف السطر أعلاه (router.replace('/setup'))
      // واجعل setIsLoading(false) لتعرض الأزرار.
    }
  }, [router]);

  // أثناء عملية الفحص والتحويل، نعرض شاشة تحميل بسيطة أو شاشة سوداء
  // هذا يمنع ظهور الأزرار القديمة ثم الاختفاء فجأة
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] text-white p-4">
      <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
        <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Cairo, sans-serif' }}>Face2</h1>
        <div className="loader" style={{ 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #4f46e5', 
            borderRadius: '50%', 
            width: '40px', 
            height: '40px', 
            animation: 'spin 1s linear infinite',
            margin: '20px auto'
        }}></div>
        <p style={{ color: '#94a3b8', marginTop: '10px', fontFamily: 'Cairo, sans-serif' }}>جاري التحقق من الحساب...</p>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </main>
  )
}