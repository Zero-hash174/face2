'use client'
import React, { useState, useRef, useEffect } from 'react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai', text: string }[]>([
    { sender: 'ai', text: 'مرحباً 👋 أنا المساعد الذكي لتطبيق Face2. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // التمرير التلقائي لآخر رسالة
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    
    // إضافة رسالة المستخدم
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    // ✅ تعليمات النظام (System Prompt) - محدثة لتكون مباشرة وطبيعية
    const fullPrompt = `
      أنت المساعد التقني الذكي لتطبيق "Face2".
      
      **أسلوبك في الحديث:**
      - كن مباشراً، مختصراً، ومفيداً جداً.
      - تحدث بلغة عربية بسيطة وواضحة (يمكنك استخدام لهجة سودانية خفيفة جداً وطبيعية إذا لزم الأمر، لكن لا تكرر عبارات مثل "يا زول" أو "يا بشر" في كل جملة).
      - تجنب المقدمات الطويلة، أجب على السؤال فوراً.
      
      **قاعدة معلومات التطبيق (استخدمها للإجابة):**
      
      1. **قائمة الأدوات الجديدة (Tools Menu 🛠️):**
         - زر عائم يظهر داخل المكالمة.
         - يحتوي على:
           أ. **ألعاب (XO Game):** للعب مع الطرف الآخر مباشرة.
           ب. **تغيير الصوت (Voice Changer):** تغيير الصوت إلى (سنجاب/طفل) أو (وحش).
           ج. **جودة الفيديو:** تقليل الجودة لتوفير الإنترنت (Low) أو رفعها (High).
           د. **مشاركة الشاشة:** لعرض شاشة هاتفك/حاسوبك للطرف الآخر (تعمل بامتياز على الأندرويد والكمبيوتر).
           هـ. **صورة داخل صورة (PiP):** لتصغير الفيديو واستخدام تطبيقات أخرى.
           و. **قفل الشاشة:** لمنع اللمس الخطأ أثناء المكالمة.

      2. **الميزات الأساسية:**
         - **زر القلب:** يرسل قلوباً متحركة.
         - **زر السجل (History):** يعرض المكالمات السابقة.
         - **الحماية:** التطبيق لا يسجل المكالمات، والرسائل تحذف فوراً (مشفرة).
         - **الترجمة:** التطبيق محمي من الترجمة التلقائية التي تخرب التصميم.

      3. **حل المشاكل:**
         - إذا الإشعارات لا تعمل: اطلب من المستخدم تفعيلها من إعدادات الهاتف (التطبيقات > Face2 > إشعارات).
         - إذا الشاشة سوداء: تأكد من أذونات الكاميرا أو جرب تحديث الصفحة.

      سؤال المستخدم هو: ${userMessage}
    `;

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
      });

      // التحقق من استجابة السيرفر
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         console.error("AI Error:", errorData);
         setMessages(prev => [...prev, { sender: 'ai', text: `عذراً، حدث خطأ في الاتصال بالخادم (${response.status}). حاول مرة أخرى لاحقاً.` }]);
         setIsTyping(false);
         return;
      }
      
      const data = await response.json();
      
      // استخراج النص من رد Gemini
      let aiReply = "عذراً، لم أستطع فهم ذلك. هل يمكنك إعادة الصياغة؟";
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) { 
        aiReply = data.candidates[0].content.parts[0].text; 
      }
      
      setMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);

    } catch (error) { 
      console.error("Fetch Error:", error);
      setMessages(prev => [...prev, { sender: 'ai', text: 'يوجد مشكلة في الاتصال بالإنترنت أو الخادم. يرجى التحقق والمحاولة مجدداً.' }]); 
    } finally { 
      setIsTyping(false); 
    }
  };

  return (
    <>
      {/* زر فتح المساعد */}
      {!isOpen && ( 
        <button 
          onClick={() => setIsOpen(true)} 
          style={{ 
            position: 'fixed', bottom: '90px', left: '20px', width: '50px', height: '50px', 
            borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', border: 'none', 
            boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)', cursor: 'pointer', zIndex: 1000, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', 
            animation: 'fadeIn 0.5s' 
          }} 
          title="المساعد الذكي"
        > 
          🤖 
        </button> 
      )}
      
      {/* نافذة المحادثة */}
      {isOpen && (
        <div style={{ position: 'fixed', bottom: '90px', left: '20px', width: '300px', height: '400px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 1001, display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', overflow: 'hidden', animation: 'slideUp 0.3s ease-out' }}>
          
          {/* الشريط العلوي */}
          <div style={{ padding: '15px', background: '#4f46e5', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> 
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>مساعد Face2 🤖</span> 
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>✖</button> 
          </div>
          
          {/* منطقة الرسائل */}
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}> 
            {messages.map((msg, idx) => ( 
              <div key={idx} style={{ 
                alignSelf: msg.sender === 'user' ? 'flex-start' : 'flex-end', 
                backgroundColor: msg.sender === 'user' ? '#4f46e5' : '#e2e8f0', 
                color: msg.sender === 'user' ? 'white' : '#1e293b', 
                padding: '8px 12px', borderRadius: '12px', 
                borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px', 
                borderBottomLeftRadius: msg.sender === 'ai' ? '2px' : '12px', 
                maxWidth: '85%', fontSize: '13px', lineHeight: '1.5', textAlign: 'right'
              }}> 
                {msg.text} 
              </div> 
            ))} 
            {isTyping && <div style={{ alignSelf: 'flex-end', fontSize: '12px', color: '#64748b' }}>جاري الكتابة...</div>} 
            <div ref={messagesEndRef} /> 
          </div>
          
          {/* منطقة الإدخال */}
          <div style={{ padding: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '5px', background: '#fff' }}> 
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder="اكتب سؤالك هنا..." 
              style={{ flex: 1, padding: '8px', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', textAlign: 'right', color: '#000' }} 
            /> 
            <button onClick={handleSend} style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>➤</button> 
          </div>
        </div>
      )}
    </>
  );
}