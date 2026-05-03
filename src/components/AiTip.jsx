import { useState, useEffect, useRef } from 'react';

const API_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

async function fetchTip(prompt, maxTokens) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content[0].text.trim();
}

function buildPrompt({ distance, intensity, phase, userName, totalRuns, totalMiles }) {
  if (distance && intensity) {
    const paceLabel = {
      easy: '12 min/mi easy pace',
      moderate: '10 min/mi moderate pace',
      high: '8 min/mi race effort',
    }[intensity] || intensity;

    return {
      prompt: `You are an elite running coach and sports nutritionist. Give ONE sharp, specific, personalized tip for ${userName || 'this runner'} who is planning a ${distance}-mile run at ${paceLabel}.

Current fueling phase: ${phase || 'pre-run preparation'}

Rules:
- Exactly 1–2 sentences. No more.
- Be specific — name actual foods, times, or metrics where relevant.
- Sound like a real coach talking to an athlete, not a generic disclaimer.
- Motivating but grounded in sports science.
- Do NOT start with "Great!" or similar filler.`,
      maxTokens: 120,
    };
  }

  return {
    prompt: `You are a running coach. Give ${userName || 'this runner'} one quick motivational or tactical running tip for today.
They have logged ${totalRuns || 0} runs and ${totalMiles || 0} total miles.
1 sentence only. Be specific and punchy. No filler.`,
    maxTokens: 80,
  };
}

export default function AiTip({ distance, intensity, phase, userName, extraBody = {} }) {
  const [tip, setTip]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const fetchedRef            = useRef(false);

  useEffect(() => {
    if (fetchedRef.current || !API_KEY) return;
    fetchedRef.current = true;

    const { prompt, maxTokens } = buildPrompt({ distance, intensity, phase, userName, ...extraBody });

    fetchTip(prompt, maxTokens)
      .then(tip => { setTip(tip); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (error || !API_KEY) return null;

  return (
    <div
      className="rounded-2xl p-4 flex gap-3"
      style={{
        background: 'linear-gradient(135deg, #FFF8F5, #FFF3ED)',
        border: '1.5px solid #FFD5C0',
      }}
    >
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
