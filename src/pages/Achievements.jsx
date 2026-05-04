import { motion } from 'framer-motion';

const O      = '#FF4F00';
const TEXT   = '#F2F2F2';
const MUTED  = '#666666';
const BG     = '#0D0D0D';
const CARD   = '#181818';
const BORDER = 'rgba(255,255,255,0.07)';
const SHADOW = '0 2px 8px rgba(0,0,0,0.3)';

const BADGES = [
  { id: 'first_run', icon: '🏃', label: 'First Step',    desc: 'Complete your first run',       goal: 1,    get: h => Math.min(1,    h.length) },
  { id: 'runs_5',    icon: '⚡', label: 'Habit',          desc: '5 runs completed',              goal: 5,    get: h => Math.min(5,    h.length) },
  { id: 'runs_10',   icon: '🔥', label: 'Dedicated',      desc: '10 runs completed',             goal: 10,   get: h => Math.min(10,   h.length) },
  { id: 'miles_10',  icon: '📍', label: 'Mile Club',      desc: '10 total miles logged',         goal: 10,   get: h => Math.min(10,   h.reduce((s, r) => s + (r.distance || 0), 0)) },
  { id: 'miles_50',  icon: '💪', label: 'Half Century',   desc: '50 miles logged',               goal: 50,   get: h => Math.min(50,   h.reduce((s, r) => s + (r.distance || 0), 0)) },
  { id: 'miles_100', icon: '💯', label: 'Century',        desc: '100 miles logged',              goal: 100,  get: h => Math.min(100,  h.reduce((s, r) => s + (r.distance || 0), 0)) },
  {
    id: 'fast_run', icon: '🔴', label: 'Speed Demon', desc: 'Complete a run under 9:00/mi', goal: 1,
    get: h => h.some(r => (r.pace && r.pace < 9) || r.intensity === 'HARD') ? 1 : 0,
  },
  { id: 'long_run',  icon: '🦁', label: 'Long Hauler',    desc: 'Run 10+ miles in one session',  goal: 1,    get: h => h.some(r => (r.distance || 0) >= 10) ? 1 : 0 },
  { id: 'marathon',  icon: '🏅', label: 'Marathon Month', desc: 'Log 26.2 miles total',          goal: 26.2, get: h => Math.min(26.2, h.reduce((s, r) => s + (r.distance || 0), 0)) },
];

function AchievementRing({ badge, history }) {
  const current = badge.get(history);
  const pct     = current / badge.goal;
  const done    = pct >= 1;

  const R    = 36;
  const CIRC = 2 * Math.PI * R;
  const off  = CIRC * (1 - Math.min(1, pct));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: done ? `rgba(255,79,0,0.03)` : CARD,
        border: `1px solid ${done ? 'rgba(255,79,0,0.2)' : BORDER}`,
        borderRadius: 18, padding: '20px 12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        boxShadow: done ? '0 4px 24px rgba(255,79,0,0.08)' : SHADOW,
        transition: 'all 0.3s',
      }}
    >
      <svg width={R * 2 + 16} height={R * 2 + 16} viewBox={`0 0 ${R*2+16} ${R*2+16}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`g-${badge.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7433"/>
            <stop offset="100%" stopColor="#FF4F00"/>
          </linearGradient>
          <filter id={`glow-${badge.id}`}>
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={O} floodOpacity="0.5"/>
          </filter>
        </defs>
        {/* Track */}
        <circle cx={R+8} cy={R+8} r={R} fill="none" stroke="#2A2A2A" strokeWidth="6"/>
        {/* Arc (done = orange gradient, in progress = orange partial) */}
        {pct > 0 && (
          <circle cx={R+8} cy={R+8} r={R}
            fill="none"
            stroke={done ? `url(#g-${badge.id})` : O}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={done ? 0 : off}
            transform={`rotate(-90 ${R+8} ${R+8})`}
            filter={done ? `url(#glow-${badge.id})` : undefined}
            opacity={done ? 1 : 0.6}
          />
        )}
        {/* Icon */}
        <text x={R+8} y={R+13} textAnchor="middle" fontSize="20"
          fontFamily="-apple-system,sans-serif" opacity={done ? 1 : 0.3}>
          {badge.icon}
        </text>
      </svg>

      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 900, color: done ? TEXT : MUTED, letterSpacing: 0.2 }}>
          {badge.label}
        </p>
        <p style={{ margin: 0, fontSize: 9, color: '#555', lineHeight: 1.4 }}>{badge.desc}</p>
      </div>

      {done ? (
        <span style={{
          fontSize: 8, fontWeight: 800, letterSpacing: 2.5, color: O,
          padding: '4px 10px', background: 'rgba(255,79,0,0.08)', borderRadius: 20,
          border: '1px solid rgba(255,79,0,0.15)',
        }}>
          UNLOCKED
        </span>
      ) : (
        <span style={{ fontSize: 10, fontWeight: 700, color: '#444' }}>
          {badge.goal > 1 ? `${Math.round(current * 10) / 10} / ${badge.goal}` : `${Math.round(pct * 100)}%`}
        </span>
      )}
    </motion.div>
  );
}

export default function Achievements({ history }) {
  const totalMiles = history.reduce((s, r) => s + (r.distance || 0), 0);
  const unlocked   = BADGES.filter(b => b.get(history) >= b.goal).length;

  return (
    <div style={{
      background: BG, minHeight: '100dvh', color: TEXT,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      padding: '52px 20px 100px', maxWidth: 420, margin: '0 auto',
    }}>

      <p style={{ color: O, fontSize: 9, fontWeight: 800, letterSpacing: 5, margin: '0 0 6px' }}>ACHIEVEMENTS</p>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: TEXT, margin: '0 0 4px', letterSpacing: -0.5 }}>Your Progress</h2>
      <p style={{ fontSize: 12, color: MUTED, margin: '0 0 24px' }}>
        {unlocked} of {BADGES.length} unlocked · {totalMiles.toFixed(1)} mi logged
      </p>

      {/* Summary strip */}
      <div style={{
        display: 'flex', background: CARD, borderRadius: 14, marginBottom: 24,
        border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden',
      }}>
        {[
          { label: 'RUNS',     value: history.length },
          { label: 'MILES',    value: totalMiles.toFixed(1) },
          { label: 'UNLOCKED', value: `${unlocked}/${BADGES.length}` },
        ].map((s, i) => (
          <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '16px 8px', borderLeft: i > 0 ? `1px solid ${BORDER}` : 'none' }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: TEXT, margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: 3, color: MUTED, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Badge grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {BADGES.map((badge, i) => (
          <motion.div key={badge.id} transition={{ delay: i * 0.05 }}>
            <AchievementRing badge={badge} history={history} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
