import { useState, useEffect, useRef } from 'react';

export default function AiTip({ distance, intensity, phase, userName, endpoint = '/api/tip', extraBody = {} }) {
  const [tip, setTip]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);
  const fetchedRef          = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch('http://localhost:3001' + endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ distance, intensity, phase, userName, ...extraBody }),
    })
      .then(r => r.json())
      .then(data => { setTip(data.tip || null); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (error) return null; // silently skip if server isn't running

  return (
    <div
      className="rounded-2xl p-4 flex gap-3"
      style={{
        background: 'linear-gradient(135deg, #FFF8F5, #FFF3ED)',
        border: '1.5px solid #FFD5C0',
      }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base"
        style={{ background: 'linear-gradient(135deg,#FF4F00,#FF7433)', fontSize: 18 }}
      >
        🤖
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#FF4F00' }}>
          AI Coach Tip
        </p>
        {loading ? (
          <div className="flex gap-1 items-center">
            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#FF4F00', animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#FF4F00', animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#FF4F00', animationDelay: '300ms' }} />
          </div>
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: '#2D2D2D' }}>{tip}</p>
        )}
      </div>
    </div>
  );
}
