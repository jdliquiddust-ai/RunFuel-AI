import { useState } from 'react';
import Auth         from './pages/Auth';
import Dashboard    from './pages/Dashboard';
import LiveTracking from './pages/LiveTracking';
import Achievements from './pages/Achievements';
import History      from './pages/History';
import Profile      from './pages/Profile';
import BottomNav    from './components/BottomNav';

const DEFAULT_SETTINGS = { haptics: true, strobe: true, fuelBanner: true };

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export default function App() {
  const [user,     setUser]     = useState(() => load('runfuel_user',     null));
  const [history,  setHistory]  = useState(() => load('runfuel_history',  []));
  const [settings, setSettings] = useState(() => load('runfuel_settings', DEFAULT_SETTINGS));
  const [screen,   setScreen]   = useState('dashboard');
  const [runData,  setRunData]  = useState(null);
  const [inRun,    setInRun]    = useState(false);

  /* ── Auth ─────────────────────────────────── */
  function handleAuth(u)  { setUser(u); }
  function handleLogout() {
    localStorage.removeItem('runfuel_user');
    setUser(null);
    setScreen('dashboard');
  }

  function handleDeleteAll() {
    ['runfuel_user', 'runfuel_history', 'runfuel_settings', 'runfuel_paused', 'runfuel_scheduled_run'].forEach(k =>
      localStorage.removeItem(k)
    );
    setUser(null);
    setHistory([]);
    setSettings(DEFAULT_SETTINGS);
    setScreen('dashboard');
  }

  function handleUpdateSettings(next) {
    setSettings(next);
    localStorage.setItem('runfuel_settings', JSON.stringify(next));
  }

  /* ── History helpers ──────────────────────── */
  function saveEntry(entry) {
    const next = [entry, ...history];
    setHistory(next);
    localStorage.setItem('runfuel_history', JSON.stringify(next));
  }
  function deleteOne(idx) {
    const next = history.filter((_, i) => i !== idx);
    setHistory(next);
    localStorage.setItem('runfuel_history', JSON.stringify(next));
  }
  function clearAll() {
    setHistory([]);
    localStorage.removeItem('runfuel_history');
  }

  /* ── Run flow ─────────────────────────────── */
  function startRun(data)    { setRunData(data); setInRun(true); }
  function savePlan(entry)   { saveEntry({ ...entry, planned: true }); }
  function finishRun(entry)  { saveEntry(entry); setInRun(false); setRunData(null); setScreen('dashboard'); }
  function cancelRun()       { setInRun(false); setRunData(null); }

  /* ── Not logged in ────────────────────────── */
  if (!user) return <Auth onAuth={handleAuth} />;

  /* ── Live tracking (full screen, no nav) ──── */
  if (inRun) {
    return <LiveTracking data={runData} settings={settings} onFinish={finishRun} onCancel={cancelRun} />;
  }

  /* ── Main app ─────────────────────────────── */
  return (
    <div style={{ background: '#0D0D0D', minHeight: '100dvh' }}>
      {screen === 'dashboard' && (
        <Dashboard
          user={user}
          history={history}
          onStart={startRun}
          onSavePlan={savePlan}
          onLogout={handleLogout}
        />
      )}
      {screen === 'history' && (
        <History
          history={history}
          user={user}
          onDeleteOne={deleteOne}
          onClear={clearAll}
          onLogout={handleLogout}
          onDeleteAll={handleDeleteAll}
        />
      )}
      {screen === 'achievements' && (
        <Achievements history={history} />
      )}
      {screen === 'profile' && (
        <Profile
          user={user}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onLogout={handleLogout}
          onDeleteAll={handleDeleteAll}
        />
      )}
      <BottomNav screen={screen} onNav={setScreen} />
    </div>
  );
}
