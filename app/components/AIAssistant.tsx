'use client'
import React, { useState, useRef, useEffect } from 'react';

// رابط الوركر
const CLOUDFLARE_WORKER_URL = "https://workers-playground-autumn-pond-05c1.tito9py.workers.dev/";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai', text: string }[]>([
    { sender: 'ai', text: 'مرحباً يا زول 👋 اسألني عن التطبيق!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    const fullPrompt = `
      تعليمات النظام للمساعد الذكي (Face2 AI):
      - اللهجة: سودانية بسيطة.
      - الأسلوب: مباشر، مختصر، وهادئ.
      - القاعدة: أجب على السؤال المحدد فقط.

      📍 خريطة التطبيق:
      1. الزر الأزرق 🔗: لنسخ رابط الدعوة.
      - يوجد خياران الاول نسخ رابط دعوة او يمكنك ضغط على زر Qr code لى مسح qr code و بدا اتصال مباشرة 
      2. علم السودان 🇸🇩: معلومات التطبيق.
      - يحتوي على معلومات عن مطور و طريقت تواصل معه من خلال فيسبوك و يوجد خيار تغير لون من ابيض الا اسود او وضع نهار الى وضع ليلي
      3. الزر البيضاوي: تغيير الحالة (متاح/مشغول) موجود تحت علم السودان لون زر اخضر
      - زر متاح يعني يمكنك استقبال مكالمات من اي شخص و زر مشغول بي لون احمر يعني انك مشغول ولن يستطيع اي احد اتصال بك لكن سوف تظهر رساله تخبرك من اراد اتصال بك و تخبر الشخص الذي يريد اتصال بك انك مشغول الان لكنك ارسلن رساله تنبيه له لكي يعاود الاتصال بك مجدد
      4. الزر الأخضر 📞: اتصال فيديو.
      5. الزر الأبيض 🕒: سجل المكالمات.
      6. حظر مستخدم يمكن حظر اي شخص من خلال ضغط على صورة شخص (ايموجي) سوف يظهر لك خيار حظر او اذا كنت قمت بي حظره يمكنك ايضا ضغط على صورة شخص و سوف يظهر لك خيار الغاء حظر 

      ⛔ معلومات الخصوصية والخروج (مهمة جداً):
      - **زر الخروج:** هذا الزر يحذف حسابك وبياناتك تماماً من الجهاز.
      - **هل يمكنني العودة للحساب؟** لا. بمجرد الخروج، يتم مسح كل شيء لضمان الخصوصية. يجب عمل حساب جديد.
      - **تغيير الصورة (الإيموجي):** لا يمكن تغييرها أثناء الاستخدام. إذا أردت تغييرها، اضغط "خروج" وأنشئ حساباً جديداً بالأيقونة التي تعجبك. هذا النظام موجود لأن التطبيق يحافظ على البساطة والخصوصية القصوى.

      📚 المطور: مصطفى عمر أحمد ( القضارف).
      🔒 الأمان: آمن جداً، لا يطلب الموقع ولا يجمع اي نوع من بيانات.

      سؤال المستخدم: ${userMessage}
    `;

    try {
      const response = await fetch(CLOUDFLARE_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
      });
      const data = await response.json();
      let aiReply = "عذراً، لم أفهم.";
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) { aiReply = data.candidates[0].content.parts[0].text; }
      setMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
    } catch (error) { setMessages(prev => [...prev, { sender: 'ai', text: 'تأكد من النت.' }]); } finally { setIsTyping(false); }
  };

  return (
    <>
      {!isOpen && ( <button onClick={() => setIsOpen(true)} style={{ position: 'fixed', bottom: '90px', left: '20px', width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)', cursor: 'pointer', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', animation: 'fadeIn 0.5s' }} title="المساعد"> 🤖 </button> )}
      {isOpen && (
        <div style={{ position: 'fixed', bottom: '90px', left: '20px', width: '300px', height: '400px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 1001, display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', overflow: 'hidden', animation: 'slideUp 0.3s ease-out' }}>
          <div style={{ padding: '15px', background: '#4f46e5', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> <span style={{ fontWeight: 'bold', fontSize: '14px' }}>مساعد Face2 🤖</span> <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>✖</button> </div>
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}> {messages.map((msg, idx) => ( <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-start' : 'flex-end', backgroundColor: msg.sender === 'user' ? '#4f46e5' : '#e2e8f0', color: msg.sender === 'user' ? 'white' : '#1e293b', padding: '8px 12px', borderRadius: '12px', borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px', borderBottomLeftRadius: msg.sender === 'ai' ? '2px' : '12px', maxWidth: '85%', fontSize: '13px', lineHeight: '1.5' }}> {msg.text} </div> ))} {isTyping && <div style={{ alignSelf: 'flex-end', fontSize: '12px', color: '#64748b' }}>...</div>} <div ref={messagesEndRef} /> </div>
          <div style={{ padding: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '5px', background: '#fff' }}> <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="اكتب سؤالك..." style={{ flex: 1, padding: '8px', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', textAlign: 'right', color: '#000' }} /> <button onClick={handleSend} style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>➤</button> </div>
        </div>
      )}
    </>
  );
}