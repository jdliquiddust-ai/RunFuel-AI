import { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────
   PHASE DEFINITIONS
   Each phase fires based on minutes remaining
───────────────────────────────────────────── */
const PHASES = {
  week: {
    key: 'week',
    label: 'Pre-Race Week',
    range: '24 + hours out',
    icon: '📅',
    color: '#3B82F6',
    urgency: 0,
    headline: 'Build the foundation.',
    action:
      'Stay consistent with hydration and normal balanced eating. Avoid alcohol, heavy training, and any new foods or supplements.',
    items: [
      '64+ oz water today',
      'Normal balanced meals',
      'Begin increasing carb ratio',
      'Easy or rest day training',
      'Avoid new foods / supplements',
    ],
  },
  'carb-load': {
    key: 'carb-load',
    label: 'Carb Load Phase',
    range: '12 – 24 hours out',
    icon: '🍝',
    color: '#FF4F00',
    urgency: 1,
    headline: 'Top off your glycogen stores.',
    action:
      'Tonight is your carb-load window. Target 500–700g complex carbs. Eliminate high-fat and high-fiber foods tonight — they slow glycogen synthesis.',
    items: [
      'Pasta with marinara sauce',
      'White rice + grilled chicken',
      'Sweet potato + eggs',
      'Toast + honey',
      'Avoid: red meat, cream sauces, alcohol',
    ],
  },
  'light-carb': {
    key: 'light-carb',
    label: 'Light Carb Phase',
    range: '6 – 12 hours out',
    icon: '🌾',
    color: '#F59E0B',
    urgency: 2,
    headline: 'Keep it light and clean.',
    action:
      'Meals should be carb-focused and easy to digest. Cut fat and fiber now to avoid GI issues on the run. Keep sipping water.',
    items: [
      'Oatmeal + banana + honey',
      'Rice cakes + jam',
      'Toast + light peanut butter',
      '48+ oz water throughout',
      'Avoid: dairy, heavy fat, raw veggies',
    ],
  },
  'pre-meal': {
    key: 'pre-meal',
    label: 'Pre-Run Meal Window',
    range: '2 – 6 hours out',
    icon: '🍌',
    color: '#F59E0B',
    urgency: 3,
    headline: 'Your last real meal. Eat now.',
    action:
      'Window closes in 2 hours. 400–600 calories, high carb, light protein, minimal fat. Stop eating at the 2-hour mark.',
    items: [
      'Bagel + honey + banana',
      'Oatmeal + maple syrup + berries',
      '16–20 oz water',
      'Optional: sports drink',
      'Avoid: dairy, eggs, high fiber',
    ],
  },
  'final-prep': {
    key: 'final-prep',
    label: 'Final Hydration',
    range: '1 – 2 hours out',
    icon: '💧',
    color: '#FF6020',
    urgency: 4,
    headline: 'Open the hydration window.',
    action:
      'Drink 16–20 oz water right now. Take 2x SaltStick Caps to pre-load electrolytes. Do your gear check — fuel belt, GPS, shoes.',
    items: [
      '16–20 oz water NOW',
      '2x SaltStick Caps',
      'Light 200-cal snack if hungry',
      'Gear check: shoes, GPS, fuel',
      'Avoid eating anything heavy',
    ],
  },
  almost: {
    key: 'almost',
    label: 'Almost Time',
    range: '20 – 60 min out',
    icon: '⚡',
    color: '#FF4F00',
    urgency: 5,
    headline: 'Activate your fuel system.',
    action:
      'Take 1x GU Energy Gel (Salted Caramel) with 6 oz water right now. Begin a 5-minute dynamic warmup. Review your mile targets.',
    items: [
      '1x GU Energy Gel (Salted Caramel)',
      '6 oz water to chase the gel',
      'Leg swings + hip circles warmup',
      'Mental review: pacing plan',
      'Deep breaths — you are ready',
    ],
  },
  'go-time': {
    key: 'go-time',
    label: 'GO TIME',
    range: '< 20 minutes',
    icon: '🚀',
    color: '#EF4444',
    urgency: 6,
    headline: "Trust the training. Let's go.",
    action:
      'Final sips of water. GPS locked. Fuel secured. Switch to Live Engine and hit START RUN.',
    items: [
      'Final sips of water only',
      'GPS satellite locked',
      'Fuel belt / vest secured',
      'Head to the start line',
    ],
  },
};

function getPhaseKey(minsLeft) {
  if (minsLeft >= 24 * 60) return 'week';
  if (minsLeft >= 12 * 60) return 'carb-load';
  if (minsLeft >= 6 * 60)  return 'light-carb';
  if (minsLeft >= 2 * 60)  return 'pre-meal';
  if (minsLeft >= 60)      return 'final-prep';
  if (minsLeft >= 20)      return 'almost';
  return 'go-time';
}

function formatCountdown(totalSeconds) {
  const pad = n => String(n).padStart(2, '0');
  const days  = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins  = Math.floor((totalSeconds % 3600) / 60);
  const secs  = totalSeconds % 60;

  if (days > 0)  return { big: `${days}d ${hours}h`, small: `${pad(mins)}m ${pad(secs)}s`, urgent: false };
  if (hours > 0) return { big: `${hours}h ${pad(mins)}m`, small: `${pad(secs)}s`, urgent: false };
  return { big: `${pad(mins)}:${pad(secs)}`, small: null, urgent: true };
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function RunCountdown({ scheduledRun, onSwitchToLive }) {
  const [now, setNow] = useState(Date.now());
  const intervalRef   = useRef(null);

  useEffect(() => {
    function startTimer() {
      clearInterval(intervalRef.current);
      const minsLeft = (new Date(scheduledRun.dateTime).getTime() - Date.now()) / 60000;
      // Sub-hour: tick every second. Otherwise every 15s is fine.
      const ms = minsLeft < 60 ? 1000 : 15000;
      intervalRef.current = setInterval(() => {
        setNow(Date.now());
        // Re-evaluate interval each tick in case we crossed the 1-hour threshold
        const remaining = (new Date(scheduledRun.dateTime).getTime() - Date.now()) / 60000;
        if (remaining < 60 && ms !== 1000) startTimer();
      }, ms);
    }
    startTimer();
    return () => clearInterval(intervalRef.current);
  }, [scheduledRun.dateTime]);

  const runTime    = new Date(scheduledRun.dateTime).getTime();
  const savedTime  = new Date(scheduledRun.savedAt || scheduledRun.dateTime).getTime();
  const secsLeft   = Math.max(0, Math.floor((runTime - now) / 1000));
  const minsLeft   = secsLeft / 60;
  const runPassed  = now >= runTime;

  if (runPassed) return null;

  const phaseKey   = getPhaseKey(minsLeft);
  const phase      = PHASES[phaseKey];
  const countdown  = formatCountdown(secsLeft);

  /* Preparation timeline 0%→100% from savedAt → runDateTime */
  const totalPrep   = Math.max(1, runTime - savedTime);
  const elapsed     = Math.max(0, now - savedTime);
  const prepPct     = Math.min(100, (elapsed / totalPrep) * 100);

  /* Milestone markers on the timeline */
  const MARKERS = [
    { icon: '🍝', label: 'Carb Load', ms: -12 * 3600000 },
    { icon: '🍌', label: 'Pre Meal',  ms: -3  * 3600000 },
    { icon: '💧', label: 'Hydrate',   ms: -2  * 3600000 },
    { icon: '⚡', label: 'Gel',        ms: -15 * 60000   },
  ].map(m => ({
    ...m,
    ts:  runTime + m.ms,
    pct: Math.min(100, Math.max(0, ((runTime + m.ms - savedTime) / totalPrep) * 100)),
  })).filter(m => m.ts > savedTime && m.ts < runTime);

  const runDateLabel = new Date(scheduledRun.dateTime).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const runTimeLabel = new Date(scheduledRun.dateTime).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="space-y-3 fade-in">

      {/* ══════════════════════════════════════════
          MAIN COUNTDOWN + PHASE CARD
      ══════════════════════════════════════════ */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: `1.5px solid ${phase.color}35` }}
      >
        {/* Phase color bar */}
        <div
          className="px-4 pt-3 pb-2 flex items-center gap-2"
          style={{ background: phase.color + '18' }}
        >
          <span style={{ fontSize: 20 }}>{phase.icon}</span>
          <div className="flex-1">
            <span
              className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: phase.color, color: '#fff' }}
            >
              {phase.label}
            </span>
            <span className="text-xs font-medium ml-2" style={{ color: '#9CA3AF' }}>
              {phase.range}
            </span>
          </div>
          {/* Live countdown digits */}
          <div className="text-right flex-shrink-0">
            <div
              className="font-black leading-none"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: countdown.urgent ? 30 : 22,
                color: phase.color,
                textShadow: phase.urgency >= 5 ? `0 0 20px ${phase.color}60` : 'none',
              }}
            >
              {countdown.big}
            </div>
            {countdown.small && (
              <div className="text-xs font-bold mt-0.5" style={{ color: phase.color + 'AA' }}>
                {countdown.small}
              </div>
            )}
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>until start</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3 bg-white">
          <p className="text-sm font-black mb-1" style={{ color: '#2D2D2D' }}>
            {phase.headline}
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: '#6B7280' }}>
            {phase.action}
          </p>

          {/* Action chips */}
          <div className="flex flex-wrap gap-1.5">
            {phase.items.map(item => (
              <span
                key={item}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: phase.color + '14', color: phase.color }}
              >
                {item}
              </span>
            ))}
          </div>

          {/* GO TIME CTA */}
          {phaseKey === 'go-time' && (
            <button
              onClick={onSwitchToLive}
              className="mt-4 w-full py-3.5 rounded-xl font-black text-white text-sm tracking-widest transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#EF4444,#DC2626)',
                boxShadow: '0 6px 20px rgba(239,68,68,0.45)',
              }}
            >
              🚀 SWITCH TO LIVE ENGINE →
            </button>
          )}

          {/* Almost-time CTA */}
          {phaseKey === 'almost' && (
            <button
              onClick={onSwitchToLive}
              className="mt-4 w-full py-3 rounded-xl font-black text-white text-sm tracking-wide transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#FF4F00,#FF7433)',
                boxShadow: '0 4px 14px rgba(255,79,0,0.4)',
              }}
            >
              ⚡ OPEN LIVE ENGINE
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PREPARATION TIMELINE BAR
      ══════════════════════════════════════════ */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
            Preparation Timeline
          </p>
          <span className="text-xs font-bold" style={{ color: phase.color }}>
            {runDateLabel} · {runTimeLabel}
          </span>
        </div>

        {/* Timeline bar */}
        <div className="relative" style={{ paddingTop: 20, paddingBottom: 8 }}>
          {/* Milestone icons above */}
          {MARKERS.map(m => (
            <div
              key={m.label}
              className="absolute -translate-x-1/2"
              style={{ left: `${m.pct}%`, top: 0 }}
              title={m.label}
            >
              <span style={{ fontSize: 13, lineHeight: 1 }}>{m.icon}</span>
            </div>
          ))}

          {/* Track */}
          <div className="relative rounded-full" style={{ height: 8, background: '#F3F4F6' }}>
            {/* Filled portion */}
            <div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{
                width: `${prepPct}%`,
                background: `linear-gradient(90deg, ${phase.color}70, ${phase.color})`,
                transition: 'width 1s linear',
              }}
            />
            {/* Milestone tick marks */}
            {MARKERS.map(m => {
              const passed = now >= m.ts;
              return (
                <div
                  key={m.label}
                  className="absolute top-0 -translate-x-1/2 rounded-full"
                  style={{
                    left: `${m.pct}%`,
                    width: 3,
                    height: '100%',
                    background: passed ? '#fff' : '#D1D5DB',
                    opacity: passed ? 0.8 : 1,
                  }}
                />
              );
            })}
            {/* "NOW" cursor dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white"
              style={{
                left: `${prepPct}%`,
                width: 18,
                height: 18,
                background: phase.color,
                boxShadow: `0 0 10px ${phase.color}80`,
                transition: 'left 1s linear',
              }}
            />
          </div>

          {/* Labels */}
          <div className="flex justify-between mt-2">
            <span className="text-xs" style={{ color: '#D1D5DB' }}>Scheduled</span>
            <span className="text-xs" style={{ color: '#D1D5DB' }}>Run Start 🏃</span>
          </div>
        </div>

        {/* Phase ladder — shows all phases and highlights current */}
        <div className="mt-4 space-y-1">
          {Object.values(PHASES).map((p, i) => {
            const isCurrent = p.key === phaseKey;
            const isPast = p.urgency < phase.urgency;
            return (
              <div
                key={p.key}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all"
                style={{
                  background: isCurrent ? p.color + '18' : 'transparent',
                  border: isCurrent ? `1px solid ${p.color}35` : '1px solid transparent',
                  opacity: isPast ? 0.4 : 1,
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{p.icon}</span>
                <span
                  className="text-xs font-bold flex-1"
                  style={{ color: isCurrent ? p.color : '#9CA3AF' }}
                >
                  {p.label}
                </span>
                <span className="text-xs" style={{ color: '#D1D5DB' }}>{p.range}</span>
                {isPast && <span className="text-xs font-black" style={{ color: '#D1D5DB' }}>✓</span>}
                {isCurrent && (
                  <span
                    className="text-xs font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: p.color, color: '#fff' }}
                  >
                    NOW
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
