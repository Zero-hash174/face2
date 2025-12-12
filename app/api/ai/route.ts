// app/api/ai/route.ts
import { NextResponse } from 'next/server';

const CLOUDFLARE_WORKER_URL = "https://workers-playground-autumn-pond-05c1.tito9py.workers.dev/";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. الاتصال بـ Cloudflare Worker
    const workerResponse = await fetch(CLOUDFLARE_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // ✅ إضافة الفحص الجديد: إذا الـ Worker رجع حالة خطأ (مثل 400 أو 500)، نمررها مباشرة.
    if (!workerResponse.ok) {
        // محاولة استخراج رسالة الخطأ من الـ Worker (قد تكون JSON)
        const errorData = await workerResponse.json().catch(() => ({ 
            error: "خطأ غير معروف من Worker",
            status: workerResponse.status 
        }));
        console.error("Worker Error Status:", workerResponse.status, errorData);
        // نمرر حالة الخطأ التي أرسلها الـ Worker
        return NextResponse.json(errorData, { status: workerResponse.status });
    }

    // إذا كانت الاستجابة 200، نمرر البيانات
    const data = await workerResponse.json();
    return NextResponse.json(data);
    
  } catch (error) {
    // هذا الجزء يلتقط الأخطاء المتعلقة باتصال Next.js بـ Worker (مثل فشل الشبكة أو مشاكل JSON)
    console.error("Next.js API Route Error:", error);
    return NextResponse.json(
        { error: "تعذر الاتصال بخادم الأمن (Cloudflare Worker). تأكد من الرابط." }, 
        { status: 500 }
    );
  }
}