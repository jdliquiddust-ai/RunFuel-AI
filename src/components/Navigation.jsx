export default function Navigation({ tab, setTab }) {
  const tabs = [
    { id: 'plan', label: 'Plan', icon: PlanIcon },
    { id: 'live', label: 'Live Run', icon: LiveIcon },
    { id: 'stats', label: 'Stats', icon: StatsIcon },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid #F3F4F6' }}
    >
      <div className="max-w-lg mx-auto flex" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 relative transition-all duration-200 focus:outline-none"
              style={{ color: active ? '#FF4F00' : '#9CA3AF' }}
            >
              <Icon active={active} />
              <span
                className="text-xs font-semibold tracking-wide"
                style={{ color: active ? '#FF4F00' : '#9CA3AF' }}
              >
                {label}
              </span>
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: 32, height: 3, background: '#FF4F00' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function PlanIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF4F00' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2.5" />
      <line x1="12" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="8" y2="18" strokeWidth="2.5" />
      <line x1="12" y1="18" x2="16" y2="18" />
    </svg>
  );
}

function LiveIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF4F00' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

function StatsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF4F00' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
