const O      = '#FF4F00';
const MUTED  = '#444444';
const ACTIVE = '#F2F2F2';

const TABS = [
  {
    id: 'dashboard',
    label: 'CALC',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3"
          stroke={active ? O : MUTED} strokeWidth="2"/>
        <path d="M8 8h8M8 12h8M8 16h4"
          stroke={active ? O : MUTED} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'HISTORY',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={active ? O : MUTED} strokeWidth="2"/>
        <path d="M12 7v5l3 3" stroke={active ? O : MUTED} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'achievements',
    label: 'BADGES',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke={active ? O : MUTED} strokeWidth="2"/>
        <path d="M12 12v8M9 17l3 3 3-3"
          stroke={active ? O : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'PROFILE',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.5" stroke={active ? O : MUTED} strokeWidth="2"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? O : MUTED} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function BottomNav({ screen, onNav }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#111111',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '10px 0 max(10px, env(safe-area-inset-bottom))',
      zIndex: 100,
    }}>
      {TABS.map(tab => {
        const active = screen === tab.id;
        return (
          <button key={tab.id} onClick={() => onNav(tab.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '6px 16px', fontFamily: 'inherit',
          }}>
            {tab.icon(active)}
            <span style={{
              fontSize: 8, fontWeight: 800, letterSpacing: 2,
              color: active ? O : '#444',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
