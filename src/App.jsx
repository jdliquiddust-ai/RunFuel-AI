import { useState } from 'react';
import Navigation from './components/Navigation';
import StrategicPlanner from './pages/StrategicPlanner';
import LiveEngine from './pages/LiveEngine';
import Stats from './pages/Stats';
import Auth from './pages/Auth';

export default function App() {
  const [tab, setTab] = useState('plan');
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('runfuel_user');
    return stored ? JSON.parse(stored) : null;
  });

  function handleLogout() {
    localStorage.removeItem('runfuel_user');
    setUser(null);
  }

  if (!user) return <Auth onAuth={setUser} />;

  return (
    <div className="relative" style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* App header wordmark — only on non-live tabs */}
      {tab !== 'live' && (
        <div
          className="fixed top-0 left-0 right-0 z-30 flex items-center justify-center"
          style={{
            height: 44,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid #F3F4F6',
          }}
        >
          <span className="font-black text-sm tracking-widest uppercase" style={{ color: '#2D2D2D' }}>
            RUN<span style={{ color: '#FF4F00' }}>FUEL</span>{' '}
            <span style={{ color: '#9CA3AF', fontWeight: 400 }}>AI</span>
          </span>
        </div>
      )}

      {/* Page content */}
      <div style={{ paddingTop: tab !== 'live' ? 44 : 0 }}>
        {tab === 'plan' && (
          <StrategicPlanner
            onSave={() => {}}
            onSwitchToLive={() => setTab('live')}
            user={user}
          />
        )}
        {tab === 'live' && <LiveEngine />}
        {tab === 'stats' && <Stats user={user} onLogout={handleLogout} />}
      </div>

      {/* Bottom navigation */}
      <Navigation tab={tab} setTab={setTab} />
    </div>
  );
}
