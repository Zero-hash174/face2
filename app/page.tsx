import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#111',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Face2Video</h1>
      
      <div style={{ display: 'flex', gap: '20px', flexDirection: 'column', width: '300px' }}>
        {/* رابط بسيط ومباشر لصفحة الإعداد */}
        <Link 
          href="/setup" 
          style={{
            padding: '15px',
            backgroundColor: '#0070f3',
            color: 'white',
            textAlign: 'center',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          🚀 اذهب إلى صفحة الإعداد
        </Link>

        {/* رابط بسيط لصفحة الاتصال */}
        <Link 
          href="/call" 
          style={{
            padding: '15px',
            backgroundColor: '#333',
            color: 'white',
            textAlign: 'center',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          📞 صفحة المكالمات
        </Link>
      </div>
    </div>
  );
}