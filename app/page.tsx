'use client'
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// 1. مكون فرعي يحتوي على المنطق الذي يستخدم useSearchParams
function HomeLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. التحقق هل المستخدم مسجل دخول؟
    const userId = localStorage.getItem('face2_userId');
    const userName = localStorage.getItem('face2_username');
    
    // 2. التحقق هل يوجد رابط دعوة (Target ID)
    const targetId = searchParams.get('target');
    let redirectUrl = '';

    if (userId && userName) {
      // ✅ مسجل دخول -> وجهه لصفحة الاتصال
      redirectUrl = '/call';
    } else {
      // ❌ غير مسجل -> وجهه لصفحة الإعداد
      redirectUrl = '/setup';
    }

    // إذا كان هناك دعوة، أرفقها في الرابط
    if (targetId) {
        redirectUrl += `?target=${targetId}`;
    }

    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div style={{height:'100vh', background:'#111827', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexDirection:'column', gap:'20px'}}>
      <h1 style={{fontSize:'24px'}}>جاري التوجيه... 🔄</h1>
      <p style={{color:'#9ca3af'}}>يرجى الانتظار قليلاً</p>
    </div>
  );
}

// 2. المكون الرئيسي للصفحة يقوم بتغليف المنطق بـ Suspense
export default function Home() {
  return (
    <Suspense fallback={
      <div style={{height:'100vh', background:'#111827', display:'flex', alignItems:'center', justifyContent:'center', color:'white'}}>
         Loading...
      </div>
    }>
      <HomeLogic />
    </Suspense>
  );
}