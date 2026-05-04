import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calcFuelPlan, brandRec, paceLabel, paceToIntensityLabel } from '../lib/fuelCalc';

const O      = '#FF4F00';
const BG     = '#0D0D0D';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT   = '#F2F2F2';
const MUTED  = '#666666';
const SUBTLE = '#222222';

const VIBRATE_PATTERN = [200, 100, 200, 100, 500];

/* Haptics: always try — works on Android, silently fails on iOS/desktop.
   The badge reflects the user's SETTING, never a device capability check. */
function triggerHaptic() {
  try { navigator.vibrate?.(VIBRATE_PATTERN); } catch (_) {}
}

/* ── Live dot ────────────────────────────────────────────────────────────── */
function LiveDot() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <motion.span
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        style={{ display: 'block', width: 7, height: 7, borderRadius: '50%', background: O }}
      />
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, color: O }}>LIVE</span>
    </span>
  );
}

/* ── Haptic pulse indicator — only visible right after a fuel hit ─────────── */
function HapticFlash({ pulseKey, enabled }) {
  if (!enabled) return null;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pulseKey}
        initial={{ opacity: 0, scale: 0.7, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 600, damping: 28 }}
        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
      >
        <motion.span
          animate={{ rotate: [-8, 8, -6, 6, 0] }}
          transition={{ duration: 0.5 }}
          style={{ fontSize: 14 }}
        >
          📳
        </motion.span>
        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 2, color: O }}>BUZZ</span>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Hero countdown ring ─────────────────────────────────────────────────── */
function CountRing({ progress, size = 292, stroke = 13, children }) {
  const R    = size / 2 - stroke;
  const CIRC = 2 * Math.PI * R;
  const cx   = size / 2;
  const off  = CIRC * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="arcG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FF8C42" />
          <stop offset="50%"  stopColor="#FF4F00" />
          <stop offset="100%" stopColor="#CC2200" />
        </linearGradient>
        <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="blur"/>
          <feFlood floodColor="#FF4F00" floodOpacity="0.55" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx={cx} cy={cx} r={R} fill="none" stroke="#222" strokeWidth={stroke}/>
      {/* Arc */}
      <circle cx={cx} cy={cx} r={R}
        fill="none" stroke="url(#arcG)" strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={CIRC} strokeDashoffset={off}
        transform={`rotate(-90 ${cx} ${cx})`}
        filter="url(#arcGlow)"
        style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {children}
    </svg>
  );
}

/* ── Mini progress ring ──────────────────────────────────────────────────── */
function MiniRing({ pct, label, value }) {
  const R = 26; const CIRC = 2 * Math.PI * R;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={R} fill="none" stroke="#252525" strokeWidth="5"/>
        <circle cx="32" cy="32" r={R} fill="none" stroke={O} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - Math.min(1, pct))}
          transform="rotate(-90 32 32)"
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <text x="32" y="37" textAnchor="middle" fill={MUTED} fontSize="11"
          fontWeight="800" fontFamily="-apple-system,sans-serif">{value}</text>
      </svg>
      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 2.5, color: '#555' }}>{label}</span>
    </div>
  );
}

/* ── Pre-run plan ────────────────────────────────────────────────────────── */
function PreRun({ data, onBegin, onCancel }) {
  const { distance, pace, carbs, sodium, hydration, totalMin, brand, mode = 'training', raceName } = data;
  const intensity = paceToIntensityLabel(pace);
  const { numHits, hitTimesMin, intervalMin } = calcFuelPlan(totalMin, pace);

  const carbsHit     = numHits > 0 ? Math.round(carbs     / numHits) : carbs;
  const sodiumHit    = numHits > 0 ? Math.round(sodium    / numHits) : sodium;
  const hydrationHit = numHits > 0 ? Math.round(hydration / numHits) : hydration;
  const rec          = brandRec(brand, carbsHit);

  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  const timeStr = h > 0 ? `${h}h ${m}m` : `${m} min`;

  const rows = [
    { icon: '📍', label: 'Distance',      value: `${distance} mi`        },
    { icon: '⏱',  label: 'Est. Duration', value: timeStr                  },
    { icon: '👟',  label: 'Pace',          value: `${paceLabel(pace)} /mi` },
    { icon: '🔥',  label: 'Total Carbs',   value: `${carbs}g`              },
    { icon: '🧂',  label: 'Total Sodium',  value: `${sodium}mg`            },
    { icon: '💧',  label: 'Total Water',   value: `${hydration} fl oz`     },
    {
      icon: '⚡', label: 'Fuel Stops',
      value: numHits === 0 ? 'None (short run)' : `${numHits}x · every ~${intervalMin} min`,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={S.page}>
      <button onClick={onCancel} style={S.backBtn}>← Back</button>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: 2.5,
            color: O, background: 'rgba(255,79,0,0.09)',
            padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(255,79,0,0.18)',
          }}>{intensity}</span>
          {mode === 'race' && (
            <span style={{
              fontSize: 8, fontWeight: 900, letterSpacing: 2, color: O,
              background: 'rgba(255,79,0,0.12)', padding: '4px 12px',
              borderRadius: 20, border: '1px solid rgba(255,79,0,0.25)',
            }}>🏁 RACE DAY</span>
          )}
          <span style={{ fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: 1 }}>
            {paceLabel(pace)} /mi
          </span>
        </div>
        <h2 style={{ fontSize: 30, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: -1 }}>
          {raceName ? raceName : 'Your Run Plan'}
        </h2>
        <p style={{ fontSize: 13, color: MUTED, margin: '6px 0 0', lineHeight: 1.5 }}>
          {raceName ? 'Race-day fueling computed from your weight, pace & distance.' : 'Review your fuel strategy, then start when ready.'}
        </p>
      </div>

      {/* Plan card */}
      <div style={S.card}>
        {rows.map((r, i) => (
          <div key={r.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, background: SUBTLE,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0,
                }}>
                  {r.icon}
                </div>
                <span style={{ fontSize: 14, color: MUTED, fontWeight: 500 }}>{r.label}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{r.value}</span>
            </div>
            {i < rows.length - 1 && <div style={S.hr}/>}
          </div>
        ))}
      </div>

      {/* Per-stop breakdown */}
      {numHits > 0 && (
        <div style={{ ...S.card, marginTop: 12 }}>
          <div style={{ padding: '16px 20px 8px' }}>
            <p style={S.sectionLabel}>PER FUEL STOP</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 20px 18px' }}>
            <HitStat value={`${carbsHit}g`}      label="CARBS"  color="#E55353" bg="rgba(229,83,83,0.07)"  />
            <HitStat value={`${sodiumHit}mg`}    label="SODIUM" color="#D97706" bg="rgba(217,119,6,0.07)"  />
            <HitStat value={`${hydrationHit}oz`} label="WATER"  color="#3B9EFF" bg="rgba(59,158,255,0.07)" />
          </div>

          <div style={{ padding: '0 20px 16px' }}>
            <p style={{ ...S.sectionLabel, marginBottom: 10 }}>SCHEDULE</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {hitTimesMin.map((t, i) => (
                <span key={i} style={{
                  fontSize: 11, fontWeight: 700, color: O,
                  background: 'rgba(255,79,0,0.07)', borderRadius: 8,
                  padding: '5px 12px', border: '1px solid rgba(255,79,0,0.15)',
                }}>
                  {t} min
                </span>
              ))}
            </div>
          </div>

          {rec && (
            <div style={{ margin: '0 20px 20px', padding: '14px 16px', background: 'rgba(255,79,0,0.05)', borderRadius: 12, border: '1px solid rgba(255,79,0,0.12)' }}>
              <p style={{ ...S.sectionLabel, color: MUTED, marginBottom: 5 }}>
                {brand.label.toUpperCase()} · PER STOP
              </p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: TEXT }}>{rec}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onBegin} style={S.cta}>
          BEGIN RUN
        </motion.button>
        <button onClick={() => sharePlan(data)} style={S.shareBtn}
          onMouseEnter={e => { e.currentTarget.style.borderColor = O; e.currentTarget.style.color = O; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="6"  cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

async function sharePlan({ distance, pace, carbs, sodium, hydration, totalMin, brand }) {
  const h = Math.floor(totalMin / 60), m = Math.round(totalMin % 60);
  const time = h > 0 ? `${h}h ${m}m` : `${m} min`;
  const brandLine = brand ? `\n⚡ Fueling with: ${brand.label}` : '';
  const text =
    `🏃 ${distance}mi run @ ${paceLabel(pace)}/mi — RunFuel AI\n` +
    `⏱ Est. ${time}\n` +
    `🔥 ${carbs}g carbs · ${sodium}mg sodium · ${hydration}oz water${brandLine}`;
  try {
    if (navigator.share) await navigator.share({ title: 'RunFuel AI Run Plan', text });
    else { await navigator.clipboard.writeText(text); alert('Copied!'); }
  } catch (_) {}
}

function HitStat({ value, label, color, bg }) {
  return (
    <div style={{ textAlign: 'center', background: bg, borderRadius: 12, padding: '10px 16px' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 2.5, color: '#555', marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ── Draggable timeline scrubber ─────────────────────────────────────────── */
function Scrubber({ elapsed, totalSec, hitTimesSec, onScrub }) {
  const barRef      = useRef(null);
  const [drag, setDrag] = useState(false);

  function pctFromPointer(e) {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }
  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(true);
    const p = pctFromPointer(e);
    if (p !== null) onScrub(Math.round(p * totalSec), false);
  }
  function onPointerMove(e) {
    if (!drag) return;
    const p = pctFromPointer(e);
    if (p !== null) onScrub(Math.round(p * totalSec), false);
  }
  function onPointerUp(e) {
    setDrag(false);
    const p = pctFromPointer(e);
    if (p !== null) onScrub(Math.round(p * totalSec), true);
  }

  const pct = totalSec > 0 ? Math.min(1, elapsed / totalSec) : 0;
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ userSelect: 'none', touchAction: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, color: '#555' }}>TIMELINE</span>
        <span style={{ fontSize: 9, fontWeight: 600, color: MUTED, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(elapsed)} / {fmt(totalSec)}
        </span>
      </div>

      <div ref={barRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        style={{ position: 'relative', height: 40, display: 'flex', alignItems: 'center', cursor: drag ? 'grabbing' : 'grab' }}>

        {/* Track */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, background: '#252525', borderRadius: 2 }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct * 100}%`,
            background: `linear-gradient(90deg, #FF8C42, #FF4F00)`,
            borderRadius: 2, transition: drag ? 'none' : 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>

        {/* Fuel dots */}
        {hitTimesSec.map((t, i) => {
          const passed = elapsed >= t;
          return (
            <div key={i} style={{
              position: 'absolute', left: `${(t / totalSec) * 100}%`,
              transform: 'translateX(-50%)',
              width: 10, height: 10, borderRadius: '50%', zIndex: 1,
              background: passed ? O : '#333',
              border: `2px solid ${passed ? O : '#444'}`,
              boxShadow: passed ? `0 0 8px rgba(255,79,0,0.55)` : '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.3s',
            }} />
          );
        })}

        {/* Thumb */}
        <div style={{
          position: 'absolute', left: `${pct * 100}%`,
          transform: 'translateX(-50%)',
          width: drag ? 24 : 20, height: drag ? 24 : 20,
          borderRadius: '50%', zIndex: 2,
          background: '#0D0D0D',
          border: `2.5px solid ${O}`,
          boxShadow: drag
            ? `0 0 0 6px rgba(255,79,0,0.20), 0 3px 12px rgba(0,0,0,0.4)`
            : `0 0 0 0px rgba(255,79,0,0), 0 2px 8px rgba(0,0,0,0.4)`,
          transition: drag ? 'none' : 'left 0.9s cubic-bezier(0.4,0,0.2,1), width 0.15s, height 0.15s, box-shadow 0.2s',
        }} />
      </div>

      {hitTimesSec.length > 0 && (
        <div style={{ position: 'relative', height: 16, marginTop: 6 }}>
          {hitTimesSec.map((t, i) => (
            <span key={i} style={{
              position: 'absolute', left: `${(t / totalSec) * 100}%`,
              transform: 'translateX(-50%)',
              fontSize: 8, fontWeight: 700, color: elapsed >= t ? O : '#C7C7CC',
              fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
              transition: 'color 0.3s',
            }}>
              {fmt(t)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Active run ──────────────────────────────────────────────────────────── */
function ActiveRun({ data, settings, onFinish }) {
  const { distance, pace, carbs, sodium, hydration, totalMin, brand, mode = 'training', raceName } = data;
  const intensity = paceToIntensityLabel(pace);
  const { numHits, hitTimesMin } = calcFuelPlan(totalMin, pace);

  const hitTimesSec  = hitTimesMin.map(m => m * 60);
  const totalSec     = Math.round(totalMin * 60);
  const carbsHit     = numHits > 0 ? Math.round(carbs     / numHits) : 0;
  const sodiumHit    = numHits > 0 ? Math.round(sodium    / numHits) : 0;
  const hydrationHit = numHits > 0 ? Math.round(hydration / numHits) : 0;
  const rec          = brandRec(brand, carbsHit);

  const [elapsed,        setElapsed]        = useState(0);
  const [showFuel,       setShowFuel]       = useState(false);
  const [strobing,       setStrobing]       = useState(false);
  const [shakeKey,       setShakeKey]       = useState(0);
  const [hapticPulseKey, setHapticPulseKey] = useState(0);
  const prevHitsRef = useRef(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const hitsCompleted = hitTimesSec.filter(t => elapsed >= t).length;
  const nextHitIdx    = hitsCompleted;
  const nextHitSec    = hitTimesSec[nextHitIdx] ?? Infinity;
  const prevHitSec    = hitTimesSec[nextHitIdx - 1] ?? 0;
  const countdown     = Math.max(0, nextHitSec - elapsed);
  const segmentLen    = nextHitSec === Infinity ? totalSec : nextHitSec - prevHitSec;
  const progress      = nextHitIdx < numHits ? (elapsed - prevHitSec) / segmentLen : 1;

  useEffect(() => {
    if (hitsCompleted > prevHitsRef.current && hitsCompleted <= numHits && !draggingRef.current) {
      prevHitsRef.current = hitsCompleted;

      // Haptics — always try; silently fails on non-Android
      if (settings.haptics !== false) triggerHaptic();

      if (settings.strobe !== false) { setStrobing(true); setTimeout(() => setStrobing(false), 1200); }
      setShakeKey(k => k + 1);
      setHapticPulseKey(k => k + 1);

      if (settings.fuelBanner !== false) {
        setShowFuel(true);
        const t = setTimeout(() => setShowFuel(false), 5000);
        return () => clearTimeout(t);
      }
    }
  }, [hitsCompleted, numHits, settings]);

  function handleScrub(newElapsed, isFinal) {
    draggingRef.current = !isFinal;
    if (isFinal) prevHitsRef.current = hitTimesSec.filter(t => newElapsed >= t).length;
    setElapsed(Math.max(0, Math.min(totalSec, newElapsed)));
  }

  function fastForward() {
    if (nextHitIdx < numHits) setElapsed(hitTimesSec[nextHitIdx]);
  }

  function finish() {
    try { navigator.vibrate?.(100); } catch (_) {}
    onFinish({ date: new Date().toISOString(), distance, pace, carbs, sodium, hydration, duration: elapsed, mode, raceName: raceName || null });
  }

  const cMins = String(Math.floor(countdown / 60)).padStart(2, '0');
  const cSecs = String(countdown % 60).padStart(2, '0');
  const eMins = String(Math.floor(elapsed  / 60)).padStart(2, '0');
  const eSecs = String(elapsed  % 60).padStart(2, '0');

  const runPct = Math.min(100, Math.round((elapsed / totalSec) * 100));

  return (
    <>
      {strobing && <div className="haptic-strobe" key={shakeKey} />}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={S.page}>

        {/* ── Top bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <LiveDot />
              {mode === 'race' && (
                <span style={{
                  fontSize: 8, fontWeight: 900, letterSpacing: 2, color: O,
                  background: 'rgba(255,79,0,0.12)', padding: '3px 10px',
                  borderRadius: 20, border: '1px solid rgba(255,79,0,0.25)',
                }}>🏁 RACE DAY</span>
              )}
            </div>
            <p style={{ fontSize: 20, fontWeight: 900, color: TEXT, margin: '6px 0 0', letterSpacing: -0.5 }}>
              {intensity}
            </p>
            <p style={{ fontSize: 12, color: MUTED, margin: '2px 0 0' }}>{paceLabel(pace)} /mi</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <HapticFlash pulseKey={hapticPulseKey} enabled={settings.haptics !== false} />
            <div style={{ marginTop: hapticPulseKey > 0 ? 6 : 0 }}>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: 3, color: '#555' }}>ELAPSED</p>
              <p style={{
                margin: '3px 0 0', fontSize: 26, fontWeight: 900, color: TEXT,
                fontVariantNumeric: 'tabular-nums', letterSpacing: -1,
              }}>
                {eMins}:{eSecs}
              </p>
            </div>
          </div>
        </div>

        {/* ── Hero ring ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <CountRing progress={progress}>
            <AnimatePresence mode="wait">
              {showFuel ? (
                <motion.g key="fuel"
                  initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                  <text x="146" y="128" textAnchor="middle" fill={O} fontSize="20" fontWeight="900"
                    fontFamily="-apple-system,sans-serif" letterSpacing="4">FUEL</text>
                  <text x="146" y="158" textAnchor="middle" fill={O} fontSize="20" fontWeight="900"
                    fontFamily="-apple-system,sans-serif" letterSpacing="4">NOW</text>
                  <text x="146" y="186" textAnchor="middle" fill={O} fontSize="11" fontWeight="700"
                    fontFamily="-apple-system,sans-serif" opacity="0.6">stop {hitsCompleted} of {numHits}</text>
                </motion.g>
              ) : numHits === 0 ? (
                <motion.g key="elapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <text x="146" y="136" textAnchor="middle" fill={TEXT} fontSize="54" fontWeight="900"
                    fontFamily="-apple-system,sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {eMins}:{eSecs}
                  </text>
                  <text x="146" y="164" textAnchor="middle" fill="#555" fontSize="9" fontWeight="800"
                    fontFamily="-apple-system,sans-serif" letterSpacing="4">ELAPSED</text>
                </motion.g>
              ) : (
                <motion.g key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <text x="146" y="130" textAnchor="middle" fill={TEXT} fontSize="54" fontWeight="900"
                    fontFamily="-apple-system,sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {nextHitIdx >= numHits ? '✓' : `${cMins}:${cSecs}`}
                  </text>
                  <text x="146" y="158" textAnchor="middle" fill="#555" fontSize="9" fontWeight="800"
                    fontFamily="-apple-system,sans-serif" letterSpacing="3.5">NEXT FUEL HIT</text>
                  <text x="146" y="176" textAnchor="middle" fill="#555" fontSize="11" fontWeight="600"
                    fontFamily="-apple-system,sans-serif">
                    {nextHitIdx < numHits ? `stop ${nextHitIdx + 1} of ${numHits}` : 'fueling complete ✓'}
                  </text>
                </motion.g>
              )}
            </AnimatePresence>
          </CountRing>
        </div>

        {/* ── Scrubber card ── */}
        <div style={{ ...S.card, padding: '16px 20px', marginBottom: 14 }}>
          <Scrubber elapsed={elapsed} totalSec={totalSec} hitTimesSec={hitTimesSec} onScrub={handleScrub} />
        </div>

        {/* ── Fuel banner ── */}
        <AnimatePresence>
          {showFuel && (
            <motion.div
              key={`banner-${shakeKey}`}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            >
              <div className="haptic-shake" key={shakeKey} style={{
                marginBottom: 14, padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(255,79,0,0.06), rgba(255,140,66,0.04))',
                border: '1px solid rgba(255,79,0,0.18)',
                borderRadius: 16,
                boxShadow: '0 4px 24px rgba(255,79,0,0.1)',
              }}>
                <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 800, color: O, letterSpacing: 2.5 }}>
                  ⚡ FUEL STOP {hitsCompleted} OF {numHits}
                </p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: MUTED }}>
                  {carbsHit}g carbs · {sodiumHit}mg sodium · {hydrationHit}oz water
                </p>
                {rec && (
                  <p style={{ margin: '7px 0 0', fontSize: 13, fontWeight: 800, color: TEXT }}>→ {rec}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mini stats ── */}
        {numHits > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 20 }}>
            <MiniRing pct={hitsCompleted / numHits} value={`${hitsCompleted}/${numHits}`} label="HITS" />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#E55353', margin: 0, letterSpacing: -1 }}>{carbsHit}g</p>
              <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: 2.5, color: '#555', margin: '4px 0 0' }}>CARBS/STOP</p>
            </div>
            <div style={{ width: 1, height: 36, background: '#252525' }}/>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#3B9EFF', margin: 0, letterSpacing: -1 }}>{hydrationHit}oz</p>
              <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: 2.5, color: '#555', margin: '4px 0 0' }}>WATER/STOP</p>
            </div>
            <MiniRing pct={elapsed / totalSec} value={`${runPct}%`} label="RUN" />
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', gap: 10 }}>
          {numHits > 0 && nextHitIdx < numHits && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={fastForward}
              style={{
                flex: 1, padding: '17px 0',
                border: `1.5px solid ${BORDER}`,
                borderRadius: 16, background: '#181818',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                color: MUTED, fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = O; e.currentTarget.style.color = O; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <polygon points="5,4 15,12 5,20" fill="currentColor"/>
                <rect x="17" y="4" width="3" height="16" rx="1" fill="currentColor"/>
              </svg>
              SKIP STOP
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.96 }} onClick={finish} style={{ ...S.endBtn, flex: 1 }}>
            END RUN
          </motion.button>
        </div>

      </motion.div>
    </>
  );
}

/* ── Root ────────────────────────────────────────────────────────────────── */
export default function LiveTracking({ data, settings = {}, onFinish, onCancel }) {
  const [phase, setPhase] = useState('plan');
  if (phase === 'plan') return <PreRun data={data} onBegin={() => setPhase('running')} onCancel={onCancel} />;
  return <ActiveRun data={data} settings={settings} onFinish={onFinish} />;
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const S = {
  page: {
    background: BG, minHeight: '100dvh', color: TEXT,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    padding: '52px 22px 40px', maxWidth: 430, margin: '0 auto',
    display: 'flex', flexDirection: 'column',
  },
  card: {
    background: '#181818',
    border: `1px solid ${BORDER}`,
    borderRadius: 18,
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    padding: '0 20px',
  },
  hr:   { height: 1, background: '#222', margin: '0 20px' },
  backBtn: {
    background: 'none', border: 'none', color: MUTED,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', padding: '0 0 24px',
  },
  sectionLabel: {
    margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: 3.5, color: '#444',
  },
  cta: {
    flex: 1, padding: '19px 0', border: 'none', borderRadius: 16,
    background: 'linear-gradient(135deg, #FF6020, #FF4F00, #E03A00)',
    color: '#fff', fontSize: 13, fontWeight: 900, letterSpacing: 3,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 4px 20px rgba(255,79,0,0.4), 0 1px 0 rgba(255,255,255,0.15) inset',
  },
  shareBtn: {
    padding: '19px 20px', border: `1.5px solid ${BORDER}`, borderRadius: 16,
    background: '#181818', cursor: 'pointer', display: 'flex', alignItems: 'center',
    color: MUTED, fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    transition: 'all 0.2s',
  },
  endBtn: {
    padding: '17px 0', background: '#181818', color: MUTED,
    border: `1.5px solid ${BORDER}`, borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    fontSize: 12, fontWeight: 800, letterSpacing: 3,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
  },
};
