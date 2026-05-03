import { useState } from 'react';

const ONBOARDING = [
  {
    key: 'weeklyMiles',
    question: "How many miles do you run per week?",
    emoji: '📍',
    options: [
      { label: 'Just starting', value: '0-10' },
      { label: '10 – 25 mi', value: '10-25' },
      { label: '25 – 40 mi', value: '25-40' },
      { label: '40 – 60 mi', value: '40-60' },
      { label: '60+ mi', value: '60+' },
    ],
  },
  {
    key: 'experience',
    question: "How long have you been running?",
    emoji: '🏃',
    options: [
      { label: 'New runner', value: 'beginner' },
      { label: '1 – 3 years', value: 'recreational' },
      { label: '3 – 5 years', value: 'experienced' },
      { label: '5+ years', value: 'elite' },
    ],
  },
  {
    key: 'goalDistance',
    question: "What's your main race goal?",
    emoji: '🏅',
    options: [
      { label: '5K', value: '5k' },
      { label: '10K', value: '10k' },
      { label: 'Half Marathon', value: 'half' },
      { label: 'Full Marathon', value: 'full' },
      { label: 'Ultra', value: 'ultra' },
      { label: 'Just running', value: 'none' },
    ],
  },
];

export default function Auth({ onAuth }) {
  const [mode, setMode]       = useState('login');
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState('auth'); // 'auth' | 'onboarding'
  const [onbStep, setOnbStep] = useState(0);
  const [profile, setProfile] = useState({});
  const [pendingUser, setPendingUser] = useState(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError(''); }

  function submit(e) {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) { setError('Email and password are required.'); return; }
    if (mode === 'signup' && !form.name.trim()) { setError('What should we call you?'); return; }
    setLoading(true);
    setTimeout(() => {
      const user = {
        name: form.name.trim() || form.email.split('@')[0],
        email: form.email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
      };
      if (mode === 'signup') {
        setPendingUser(user);
        setLoading(false);
        setStep('onboarding');
      } else {
        const stored = localStorage.getItem('runfuel_user');
        const existing = stored ? JSON.parse(stored) : user;
        localStorage.setItem('runfuel_user', JSON.stringify(existing));
        onAuth(existing);
      }
    }, 600);
  }

  function selectOption(key, value) {
    const next = { ...profile, [key]: value };
    setProfile(next);
    if (onbStep < ONBOARDING.length - 1) {
      setTimeout(() => setOnbStep(s => s + 1), 220);
    } else {
      const finalUser = { ...pendingUser, ...next };
      localStorage.setItem('runfuel_user', JSON.stringify(finalUser));
      onAuth(finalUser);
    }
  }

  if (step === 'onboarding') {
    const current = ONBOARDING[onbStep];
    return (
      <div
        className="min-h-screen flex flex-col px-6"
        style={{ background: 'linear-gradient(160deg, #fff 60%, #FFF3ED 100%)' }}
      >
        {/* Progress bar */}
        <div className="pt-14 pb-2">
          <div className="flex gap-1.5">
            {ONBOARDING.map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-300"
                style={{
                  height: 4,
                  background: i <= onbStep ? '#FF4F00' : '#F3F4F6',
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center" style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
          <div className="mb-8">
            <div className="text-4xl mb-4">{current.emoji}</div>
            <h2 className="font-black text-2xl leading-tight" style={{ color: '#1A1A1A' }}>
              {current.question}
            </h2>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
              {onbStep + 1} of {ONBOARDING.length}
            </p>
          </div>

          <div className="space-y-2.5">
            {current.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => selectOption(current.key, opt.value)}
                className="w-full py-4 px-5 rounded-2xl font-bold text-left transition-all duration-150 active:scale-95"
                style={{
                  background: profile[current.key] === opt.value
                    ? 'linear-gradient(135deg,#FF4F00,#FF7433)'
                    : 'white',
                  color: profile[current.key] === opt.value ? 'white' : '#1A1A1A',
                  boxShadow: profile[current.key] === opt.value
                    ? '0 6px 20px rgba(255,79,0,0.35)'
                    : '0 1px 8px rgba(0,0,0,0.06)',
                  border: profile[current.key] === opt.value ? 'none' : '1.5px solid #F3F4F6',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #fff 60%, #FFF3ED 100%)' }}
    >
      {/* Logo + wordmark */}
      <div className="flex flex-col items-center mb-10">
        <div
          className="mb-5 flex items-center justify-center"
          style={{
            width: 88, height: 88, borderRadius: 22,
            background: 'linear-gradient(145deg, #FF6020, #D93A00)',
            boxShadow: '0 12px 40px rgba(255,79,0,0.4)',
          }}
        >
          <svg viewBox="0 0 100 100" width="54" height="54" style={{ overflow: 'visible' }}>
            <circle cx="66" cy="19" r="9" fill="white"/>
            <line x1="64" y1="28" x2="54" y2="51" stroke="white" strokeWidth="7" strokeLinecap="round"/>
            <polyline points="60,36 70,45 76,41" stroke="white" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="59,37 49,31 45,27" stroke="white" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="55,50 62,63 68,58" stroke="white" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="55,50 44,64 34,76" stroke="white" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="font-black text-3xl tracking-tight" style={{ color: '#1A1A1A' }}>
          Run<span style={{ color: '#FF4F00' }}>Fuel</span> AI
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: '#9CA3AF' }}>Full-cycle running nutrition</p>
      </div>

      <div
        className="w-full rounded-3xl p-7 space-y-4"
        style={{ maxWidth: 400, background: 'white', boxShadow: '0 4px 40px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6' }}
      >
        <h2 className="font-black text-lg" style={{ color: '#1A1A1A' }}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <AuthInput label="Your name" type="text" placeholder="JD" value={form.name} onChange={v => set('name', v)} autoFocus />
          )}
          <AuthInput label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={v => set('email', v)} autoFocus={mode === 'login'} />
          <AuthInput label="Password" type="password" placeholder="••••••••" value={form.password} onChange={v => set('password', v)} />

          {error && <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-black text-white text-base tracking-wide transition-all active:scale-95"
            style={{
              background: loading ? '#F3F4F6' : 'linear-gradient(135deg,#FF4F00,#FF7433)',
              color: loading ? '#9CA3AF' : 'white',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(255,79,0,0.4)',
            }}
          >
            {loading ? '...' : mode === 'login' ? 'Log In' : 'Get Started'}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: '#9CA3AF' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); }}
            className="font-bold" style={{ color: '#FF4F00' }}
          >
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>

      <p className="mt-8 text-xs text-center" style={{ color: '#D1D5DB', maxWidth: 320 }}>
        Your data stays on your device. No account required to use offline.
      </p>
    </div>
  );
}

function AuthInput({ label, type, placeholder, value, onChange, autoFocus }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
        style={{
          border: `1.5px solid ${focused ? '#FF4F00' : '#E5E7EB'}`,
          background: focused ? '#FFFAF8' : '#FAFAFA',
          color: '#1A1A1A',
          boxShadow: focused ? '0 0 0 3px rgba(255,79,0,0.08)' : 'none',
        }}
      />
    </div>
  );
}
