import { useState } from 'react';
import { motion } from 'framer-motion';

const O    = '#FF4F00';
const TEXT = '#F2F2F2';
const MUTED= '#666666';
const LINE = 'rgba(255,255,255,0.07)';

export default function Auth({ onAuth }) {
  const [mode,     setMode]     = useState('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  function toggle() { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); }

  function submit(e) {
    e.preventDefault();
    if (!email.trim())    return setError('Email is required.');
    if (!password.trim()) return setError('Password is required.');
    if (mode === 'signup' && !name.trim()) return setError('What should we call you?');
    setLoading(true);
    setTimeout(() => {
      const stored = localStorage.getItem('runfuel_user');
      const user = mode === 'login' && stored
        ? JSON.parse(stored)
        : { name: name.trim() || email.split('@')[0], email: email.trim().toLowerCase(), createdAt: new Date().toISOString() };
      localStorage.setItem('runfuel_user', JSON.stringify(user));
      onAuth(user);
      setLoading(false);
    }, 500);
  }

  return (
    <div style={{
      background: '#0D0D0D', minHeight: '100dvh', color: TEXT,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      padding: '64px 24px 40px', maxWidth: 400, margin: '0 auto',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
        <img src="/logo.svg" alt="RunFuel AI" style={{
          width: 76, height: 76, borderRadius: 20,
          boxShadow: '0 8px 32px rgba(255,79,0,0.35)', marginBottom: 18,
        }} />
        <p style={{ color: O, fontSize: 9, fontWeight: 800, letterSpacing: 4, margin: '0 0 6px' }}>RUNFUEL AI</p>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: -0.5 }}>
          {mode === 'login' ? 'Welcome back.' : 'Start fueling.'}
        </h1>
      </div>

      <div style={{ background: '#181818', border: `1px solid ${LINE}`, borderRadius: 20, padding: '28px 24px' }}>
        <form onSubmit={submit}>
          {mode === 'signup' && (
            <Field label="NAME" type="text" placeholder="Your name" value={name} onChange={setName} />
          )}
          <Field label="EMAIL"    type="email"    placeholder="you@example.com" value={email}    onChange={setEmail} />
          <Field label="PASSWORD" type="password" placeholder="••••••••"        value={password} onChange={setPassword} />

          {error && (
            <p style={{ color: O, fontSize: 12, fontWeight: 700, margin: '0 0 16px' }}>{error}</p>
          )}

          <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
            style={{
              width: '100%', padding: '18px 0', border: 'none', borderRadius: 12,
              background: loading ? '#222' : `linear-gradient(135deg, #FF6230, ${O})`,
              color: loading ? '#444' : '#fff',
              fontSize: 13, fontWeight: 900, letterSpacing: 3,
              cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 8px 28px rgba(255,79,0,0.35)',
              transition: 'all 0.2s',
            }}>
            {loading ? '…' : mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 12, color: MUTED }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
          </span>
          <button onClick={toggle} style={{
            background: 'none', border: 'none', color: O,
            fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>

      <p style={{ color: '#444', fontSize: 10, textAlign: 'center', marginTop: 24, letterSpacing: 0.5 }}>
        Your data stays on your device.
      </p>
    </div>
  );
}

function Field({ label, type, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ color: MUTED, fontSize: 9, fontWeight: 800, letterSpacing: 4, margin: '0 0 8px' }}>{label}</p>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '13px 16px', borderRadius: 12, boxSizing: 'border-box',
          border: `1.5px solid ${focused ? O : 'rgba(255,255,255,0.08)'}`,
          background: focused ? '#202020' : '#141414',
          color: '#F2F2F2', fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
          outline: 'none',
          boxShadow: focused ? `0 0 0 3px rgba(255,79,0,0.12)` : 'none',
          transition: 'all 0.15s',
        }}
      />
    </div>
  );
}
