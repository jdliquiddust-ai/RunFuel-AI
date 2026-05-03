import { useState, useEffect } from 'react';
import { formatTime } from '../utils/fuelingLogic';
import AiTip from '../components/AiTip';

const INTENSITY_COLOR = { easy: '#22C55E', moderate: '#FF4F00', high: '#EF4444' };
const INTENSITY_EMOJI = { easy: '🟢', moderate: '🟡', high: '🔴' };

export default function Stats({ user, onLogout }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('runfuel_history') || '[]'));
  }, []);

  function clearHistory() {
    if (!window.confirm('Clear all run history?')) return;
    localStorage.removeItem('runfuel_history');
    setHistory([]);
  }

  const totalMiles = history.reduce((s, r) => s + (r.distance || 0), 0);
  const totalTime  = history.reduce((s, r) => s + (r.durationSeconds || 0), 0);

  return (
    <div className="fade-in pb-28" style={{ maxWidth: 560, margin: '0 auto' }}>

      {/* ── Header with user greeting + logout ── */}
      <div className="px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#FF4F00' }}>
              STATS
            </p>
            <h1 className="font-black text-2xl leading-tight" style={{ color: '#1A1A1A' }}>
              Hey, {user?.name?.split(' ')[0] || 'Runner'} 👋
            </h1>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: '#F3F4F6', color: '#9CA3AF' }}
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="px-5 space-y-4">

        {/* ── Big number summary ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Runs',       value: history.length,          icon: '🏃', color: '#FF4F00' },
            { label: 'Miles',      value: totalMiles.toFixed(1),   icon: '📍', color: '#3B82F6' },
            { label: 'Time',       value: formatTime(totalTime),   icon: '⏱',  color: '#22C55E' },
          ].map(s => (
            <div
              key={s.label}
              className="glass-card rounded-2xl p-3 flex flex-col items-center gap-1"
            >
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <span className="font-black text-base leading-none" style={{ color: s.color }}>{s.value}</span>
              <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Daily AI Coach tip ── */}
        <AiTip
          endpoint="/api/daily-tip"
          extraBody={{ totalRuns: history.length, totalMiles: totalMiles.toFixed(1) }}
          userName={user?.name}
        />

        {/* ── Run history ── */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
            History
          </p>
          {history.length > 0 && (
            <button onClick={clearHistory} className="text-xs font-bold" style={{ color: '#EF4444' }}>
              Clear
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center space-y-3">
            <div style={{ fontSize: 52 }}>🏃</div>
            <p className="font-black text-base" style={{ color: '#1A1A1A' }}>No runs yet</p>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Plan your first run and start the Live Engine.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map(run => {
              const color = INTENSITY_COLOR[run.intensity] || '#FF4F00';
              const date  = new Date(run.completedAt);
              const pace  = run.durationSeconds > 0 && run.distance > 0
                ? (run.durationSeconds / 60 / run.distance).toFixed(1)
                : null;
              return (
                <div key={run.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-black uppercase flex-shrink-0"
                        style={{ background: color + '18', color }}
                      >
                        {INTENSITY_EMOJI[run.intensity]} {run.intensity}
                      </span>
                      <span className="text-sm font-bold truncate" style={{ color: '#1A1A1A' }}>
                        {run.name}
                      </span>
                    </div>
                    <span className="font-black text-xl ml-3 flex-shrink-0" style={{ color: '#FF4F00' }}>
                      {run.distance}mi
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
                    <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                      ⏱ {formatTime(run.durationSeconds)}
                    </span>
                    {pace && (
                      <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                        {pace} min/mi
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
