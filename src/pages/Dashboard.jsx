import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  calcTotals, calcFuelPlan, BRANDS, brandRec,
  paceLabel, paceToIntensityLabel, paceColor,
} from '../lib/fuelCalc';

const BG   = '#0D0D0D';
const CARD = '#181818';
const LINE = 'rgba(255,255,255,0.07)';
const TEXT = '#F2F2F2';
const MUTED= '#666666';
const O    = '#FF4F00';

/* ── Race distance detection ─────────────────────────────────────────────── */
const RACES = [
  // Must check half-marathon BEFORE marathon
  { pattern: /half[\s-]?marathon|13\.1\s*mi/i,        mi: 13.1,  label: 'Half Marathon'  },
  { pattern: /\bmarathon\b/i,                          mi: 26.2,  label: 'Marathon'       },
  { pattern: /\b5\s*k\b|5000\s*m/i,                   mi: 3.107, label: '5K'             },
  { pattern: /\b10\s*k\b|10000\s*m/i,                 mi: 6.214, label: '10K'            },
  { pattern: /\b15\s*k\b/i,                            mi: 9.321, label: '15K'            },
  { pattern: /\b20\s*k\b/i,                            mi: 12.43, label: '20K'            },
  { pattern: /\b25\s*k\b/i,                            mi: 15.53, label: '25K'            },
  { pattern: /\b30\s*k\b/i,                            mi: 18.64, label: '30K'            },
  { pattern: /\b50\s*k\b/i,                            mi: 31.07, label: '50K'            },
  { pattern: /\b100\s*k\b/i,                           mi: 62.14, label: '100K'           },
  { pattern: /\b10[\s-]?mile|\bten[\s-]?mile/i,        mi: 10,    label: '10 Mile'        },
  { pattern: /\b50[\s-]?mile|\bfifty[\s-]?mile/i,      mi: 50,    label: '50 Mile'        },
  { pattern: /\b100[\s-]?mile|\bhundred[\s-]?mile/i,   mi: 100,   label: '100 Mile'       },
  { pattern: /ultra/i,                                 mi: 31.07, label: 'Ultra (50K)'    },
];

function detectRace(name) {
  if (!name || name.trim().length < 2) return null;
  for (const r of RACES) {
    if (r.pattern.test(name)) return r;
  }
  return null;
}

/* ── Coach insight ───────────────────────────────────────────────────────── */
function getInsight({ distance, pace, carbs, numHits, intervalMin, hydration, mode, hitTimesMin = [] }) {
  const firstHitMin = hitTimesMin[0] ?? 0;

  if (mode === 'race') {
    if (distance >= 50)
      return { icon: '🦁', text: `Ultra-distance race protocol. Fueling this distance is a pacing game — prioritize sodium and hydration over carbs in miles 20+.` };
    if (distance >= 26.2)
      return { icon: '🏅', text: `Marathon race fueling computed from YOUR weight and pace — ${carbs}g carbs across ${numHits} hits. Lock in every ${intervalMin} min. No deviations.` };
    if (distance >= 13.1)
      return { icon: '🏅', text: `Half marathon: your first hit at ${firstHitMin} min is critical. Don't wait to feel it — by then you're already behind. Fuel on schedule.` };
    if (distance >= 6)
      return { icon: '⚡', text: `Race Day protocol on a ${distance.toFixed(1)}-mile course. Push hard early, fuel at ${firstHitMin} min, and trust the plan.` };
    return { icon: '⚡', text: `Short race — high intensity burns carbs fast. Pre-load 30 min before the gun and stay ahead of the effort.` };
  }

  if (distance >= 20)
    return { icon: '🔥', text: `20+ miles: glycogen hits critical at mile 16–18. Every scheduled hit is your wall insurance — miss one and you pay for it later.` };
  if (distance >= 13.1)
    return { icon: '💡', text: `Half marathon distance. First gel window opens at ${firstHitMin} min — don't wait for hunger. Absorption takes 15–20 minutes.` };
  if (distance >= 10)
    return { icon: '💡', text: `At this distance glycogen bottoms out around mile 8. Your ${intervalMin}-min intervals are calibrated to keep you ahead of the wall.` };
  if (numHits === 0)
    return { icon: '✅', text: `Short run — no fuel stops needed. Stay hydrated and your glycogen will carry you the full distance.` };
  if (pace < 8)
    return { icon: '🔴', text: `Sub-8 pace burns carbs aggressively. Stick to the ${intervalMin}-min cadence — missing even one stop costs you in the final miles.` };
  if (hydration > 40)
    return { icon: '💧', text: `High fluid demand. Pre-hydrate 16oz about 90 minutes before you start. Arriving dehydrated compounds everything else.` };
  return { icon: '📌', text: `Start fueling 20 minutes before you feel you need it. There's always a 15–20 min lag between intake and absorption.` };
}

/* ── Mode toggle ─────────────────────────────────────────────────────────── */
function ModeToggle({ mode, onChange }) {
  return (
    <div style={{
      display: 'flex', background: '#111', borderRadius: 14,
      padding: 4, border: `1px solid ${LINE}`, marginBottom: 14,
    }}>
      {[
        { id: 'training', label: 'TRAINING', icon: '🏃' },
        { id: 'race',     label: 'RACE DAY', icon: '🏁' },
      ].map(opt => {
        const active = mode === opt.id;
        return (
          <button key={opt.id} onClick={() => onChange(opt.id)} style={{
            flex: 1, padding: '11px 0', border: 'none', borderRadius: 11,
            fontFamily: 'inherit', cursor: 'pointer',
            background: active
              ? (opt.id === 'race' ? `linear-gradient(135deg,#FF6230,${O})` : CARD)
              : 'none',
            color: active ? (opt.id === 'race' ? '#fff' : TEXT) : MUTED,
            fontSize: 10, fontWeight: 900, letterSpacing: 2.5,
            boxShadow: active && opt.id === 'race'
              ? `0 4px 20px rgba(255,79,0,0.35)`
              : active ? `0 2px 8px rgba(0,0,0,0.4)` : 'none',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
            <span style={{ fontSize: 14 }}>{opt.icon}</span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function Dashboard({ user, history, onStart, onLogout, onSavePlan }) {
  const [weight,    setWeight]    = useState('');
  const [distance,  setDistance]  = useState('');
  const [pace,      setPace]      = useState(10);
  const [brandId,   setBrandId]   = useState(null);
  const [brandOpen, setBrandOpen] = useState(false);
  const [mode,      setMode]      = useState('training');
  const [saved,     setSaved]     = useState(false);
  const [raceName,  setRaceName]  = useState('');
  const [raceApplied, setRaceApplied] = useState(false); // tracks if user accepted the auto-fill

  const detected = detectRace(raceName);

  // Auto-apply detected distance unless user has manually edited distance
  useEffect(() => {
    if (detected && !raceApplied) {
      setDistance(String(detected.mi));
      setRaceApplied(true);
    }
    if (!detected) {
      setRaceApplied(false);
    }
  }, [detected?.mi]);

  const w     = parseFloat(weight)   || 0;
  const d     = parseFloat(distance) || 0;
  const ready = w > 0 && d > 0;

  const totals   = ready ? calcTotals(w, d, pace, mode) : null;
  const { carbs = 0, sodium = 0, hydration = 0, totalMin = 0 } = totals || {};
  const fuelPlan = ready ? calcFuelPlan(totalMin, pace) : null;
  const { numHits = 0, intervalMin = 0, hitTimesMin = [] } = fuelPlan || {};

  const selectedBrand = BRANDS.find(b => b.id === brandId) || null;
  const carbsHit      = ready && numHits > 0 ? Math.round(carbs / numHits) : carbs;
  const rec           = selectedBrand && ready ? brandRec(selectedBrand, carbsHit) : null;

  const insight = ready
    ? getInsight({ distance: d, pace, carbs, numHits, intervalMin, hydration, mode, hitTimesMin })
    : null;

  const pLabel     = paceLabel(pace);
  const pIntensity = paceToIntensityLabel(pace);
  const pCol       = paceColor(pace);
  const sliderPct  = `${((pace - 5) / 10) * 100}%`;
  const h          = totals ? Math.floor(totalMin / 60) : 0;
  const m          = totals ? Math.round(totalMin % 60) : 0;
  const timeStr    = h > 0 ? `${h}h ${m}m` : `${m}m`;

  function handleStart() {
    if (!ready) return;
    onStart({ weight: w, distance: d, pace, carbs, sodium, hydration, totalMin, brand: selectedBrand, mode, raceName: raceName.trim() || null });
  }

  function handleSave() {
    if (!ready) return;
    onSavePlan({ weight: w, distance: d, pace, carbs, sodium, hydration, totalMin, brand: selectedBrand, mode, raceName: raceName.trim() || null, planned: true, date: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{
      background: BG, minHeight: '100dvh', color: TEXT,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      padding: '56px 20px 110px', maxWidth: 420, margin: '0 auto',
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 900, letterSpacing: 4, color: O }}>RUNFUEL AI</p>
          <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: -0.5 }}>
            Athlete's Assistant
          </p>
        </div>
        <button onClick={onLogout} style={{
          width: 38, height: 38, borderRadius: '50%',
          background: `linear-gradient(135deg, ${O}, #FF7433)`,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 15, fontWeight: 900, color: '#fff',
          boxShadow: `0 4px 16px rgba(255,79,0,0.35)`,
        }}>
          {(user?.name || user?.email || '?')[0].toUpperCase()}
        </button>
      </div>

      {/* ── Mode toggle ── */}
      <ModeToggle mode={mode} onChange={m => { setMode(m); setSaved(false); }} />

      {/* ── Race Name input ── */}
      <RaceNameInput
        value={raceName}
        onChange={v => { setRaceName(v); setRaceApplied(false); }}
        detected={detected}
        onApply={r => { setDistance(String(r.mi)); setRaceApplied(true); }}
      />

      {/* Race Day banner */}
      <AnimatePresence>
        {mode === 'race' && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '11px 16px', borderRadius: 12,
              background: 'rgba(255,79,0,0.08)', border: `1px solid rgba(255,79,0,0.22)`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>🏁</span>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: O, letterSpacing: 1 }}>
                  RACE DAY PROTOCOL
                </p>
                <p style={{ margin: 0, fontSize: 11, color: MUTED }}>
                  Fueling computed from your weight, pace & distance — not preset
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Weight + Distance ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <NumInput label="Weight" unit="lbs" value={weight} onChange={setWeight} />
        <NumInput
          label="Distance" unit="mi" value={distance}
          onChange={v => { setDistance(v); setRaceApplied(false); }}
          highlight={raceApplied}
        />
      </div>

      {/* ── Pace ── */}
      <div style={{ background: CARD, borderRadius: 20, padding: '20px 20px 16px', marginBottom: 10, border: `1px solid ${LINE}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: 3, color: MUTED }}>PACE</p>
          <motion.span key={pIntensity} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: pCol,
              background: pCol + '18', borderRadius: 20, padding: '4px 12px' }}>
            {pIntensity}
          </motion.span>
        </div>
        <motion.div key={pLabel} initial={{ opacity: 0.6, y: -4 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{ fontSize: 72, fontWeight: 900, color: pCol, letterSpacing: -4,
            lineHeight: 1, marginBottom: 16, fontVariantNumeric: 'tabular-nums' }}>
          {pLabel}
          <span style={{ fontSize: 20, fontWeight: 700, color: MUTED, letterSpacing: 0, marginLeft: 6 }}>/mi</span>
        </motion.div>
        <input type="range" min={5} max={15} step={0.5} value={pace}
          onChange={e => setPace(parseFloat(e.target.value))}
          style={{ '--fill': sliderPct, width: '100%' }} />
      </div>

      {/* ── Brand ── */}
      <div style={{ background: CARD, borderRadius: 20, padding: '16px 20px', marginBottom: 14, border: `1px solid ${LINE}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: 3, color: MUTED }}>BRAND</p>
            <span style={{ fontSize: 8, color: '#444', fontWeight: 700, letterSpacing: 1 }}>OPTIONAL</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {selectedBrand && !brandOpen && (
              <span style={{ fontSize: 13, fontWeight: 700, color: O }}>{selectedBrand.label}</span>
            )}
            <button onClick={() => setBrandOpen(o => !o)} style={{
              background: 'none', border: `1px solid ${LINE}`, borderRadius: 8,
              color: MUTED, fontSize: 11, cursor: 'pointer', padding: '5px 10px', fontFamily: 'inherit',
            }}>{brandOpen ? '▲' : '▼'}</button>
            {selectedBrand && (
              <button onClick={() => setBrandId(null)} style={{
                background: 'none', border: 'none', color: MUTED, fontSize: 11,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>✕</button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {brandOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, paddingTop: 14 }}>
                {BRANDS.map(b => {
                  const on = brandId === b.id;
                  return (
                    <motion.button key={b.id} whileTap={{ scale: 0.95 }}
                      onClick={() => { setBrandId(b.id); setBrandOpen(false); }}
                      style={{
                        padding: '10px 12px', borderRadius: 10, fontFamily: 'inherit',
                        border: on ? `1.5px solid ${O}` : `1px solid ${LINE}`,
                        background: on ? O + '12' : '#111',
                        color: on ? O : '#999', fontWeight: 700, fontSize: 12,
                        textAlign: 'left', cursor: 'pointer',
                      }}>
                      {b.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Results ── */}
      <AnimatePresence>
        {ready && (
          <motion.div key="res"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
              <Stat value={`${carbs}g`}      label="CARBS"  color="#E55353" />
              <Stat value={`${hydration}oz`} label="WATER"  color="#3B9EFF" />
              <Stat value={`${sodium}mg`}    label="SODIUM" color="#D97706" />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Stat flex value={timeStr} label="EST. TIME" color="#7C3AED" />
              <Stat flex
                value={numHits === 0 ? 'None' : `${numHits}x`}
                sublabel={numHits > 0 ? `every ~${intervalMin} min` : undefined}
                label="FUEL STOPS" color="#7C3AED" />
            </div>

            {rec && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                padding: '13px 16px', borderRadius: 14,
                background: O + '0C', border: `1px solid ${O}22`, marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 16 }}>⚡</span>
                <div>
                  <p style={{ margin: 0, fontSize: 10, color: MUTED, fontWeight: 600 }}>PER STOP</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: TEXT }}>{rec}</p>
                </div>
              </motion.div>
            )}

            {/* Coach's Insight */}
            {insight && (
              <motion.div
                key={`${d}-${pace}-${mode}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  padding: '16px 18px', borderRadius: 16, marginBottom: 10,
                  background: '#111', border: `1px solid rgba(255,255,255,0.09)`,
                  borderLeft: `3px solid ${O}`,
                }}
              >
                <p style={{ margin: '0 0 8px', fontSize: 8, fontWeight: 900, letterSpacing: 3, color: O }}>
                  COACH'S INSIGHT
                </p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{insight.icon}</span>
                  <p style={{ margin: 0, fontSize: 13, color: '#CCCCCC', lineHeight: 1.55, fontWeight: 500 }}>
                    {insight.text}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CTAs ── */}
      <motion.button whileTap={{ scale: ready ? 0.97 : 1 }} onClick={handleStart}
        style={{
          width: '100%', padding: '19px 0', border: 'none', borderRadius: 16,
          cursor: ready ? 'pointer' : 'default',
          background: ready
            ? mode === 'race'
              ? `linear-gradient(135deg, #FF6230, ${O}, #CC2200)`
              : `linear-gradient(135deg, #FF6230, ${O})`
            : '#1E1E1E',
          color: ready ? '#fff' : '#444',
          fontSize: 13, fontWeight: 900, letterSpacing: 3.5, fontFamily: 'inherit',
          boxShadow: ready ? `0 10px 36px rgba(255,79,0,0.30), inset 0 1px 0 rgba(255,255,255,0.14)` : 'none',
          transition: 'all 0.25s', position: 'relative', overflow: 'hidden',
        }}>
        {ready && (
          <motion.div animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', repeatDelay: 2 }}
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)',
            }} />
        )}
        {mode === 'race' ? '🏁 START RACE' : 'START RUN'}
      </motion.button>

      <AnimatePresence mode="wait">
        {ready && (
          <motion.button
            key={saved ? 'saved' : 'save'}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            style={{
              width: '100%', marginTop: 10, padding: '14px 0',
              border: `1px solid ${saved ? 'rgba(34,197,94,0.35)' : LINE}`,
              borderRadius: 16, background: saved ? 'rgba(34,197,94,0.07)' : 'none',
              color: saved ? '#22C55E' : MUTED,
              fontSize: 11, fontWeight: 800, letterSpacing: 3,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {saved ? (
              <><span>✓</span> PLAN SAVED</>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                SAVE PLAN
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Race Name Input ─────────────────────────────────────────────────────── */
function RaceNameInput({ value, onChange, detected, onApply }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        background: CARD, borderRadius: 18, padding: '14px 18px',
        border: `1.5px solid ${focused ? O : detected ? 'rgba(255,79,0,0.35)' : LINE}`,
        boxShadow: focused ? `0 0 0 3px rgba(255,79,0,0.10)` : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: value ? 8 : 0 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: 3, color: MUTED }}>
            RACE NAME
          </p>
          <span style={{ fontSize: 8, color: '#444', fontWeight: 700, letterSpacing: 1 }}>OPTIONAL</span>
        </div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Boston Marathon, local 5K, Sunday long run…"
          style={{
            background: 'none', border: 'none', outline: 'none',
            fontSize: value ? 16 : 14, fontWeight: value ? 700 : 400,
            color: value ? TEXT : '#444',
            width: '100%', caretColor: O, fontFamily: 'inherit',
            display: value || focused ? 'block' : 'block',
          }}
        />
      </div>

      {/* Detected race chip */}
      <AnimatePresence>
        {detected && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 8, padding: '10px 14px', borderRadius: 12,
              background: 'rgba(255,79,0,0.07)', border: `1px solid rgba(255,79,0,0.20)`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>📍</span>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: TEXT }}>
                    {detected.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: MUTED }}>
                    {detected.mi} miles detected
                  </p>
                </div>
              </div>
              <button
                onClick={() => onApply(detected)}
                style={{
                  background: O, border: 'none', borderRadius: 8,
                  color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
                  cursor: 'pointer', padding: '6px 14px', fontFamily: 'inherit',
                  boxShadow: `0 2px 10px rgba(255,79,0,0.3)`,
                }}
              >
                USE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sub-components ── */
function NumInput({ label, unit, value, onChange, highlight }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      background: CARD, borderRadius: 18, padding: '16px 18px',
      border: `1.5px solid ${focused ? O : highlight ? 'rgba(255,79,0,0.4)' : LINE}`,
      boxShadow: focused ? `0 0 0 3px rgba(255,79,0,0.10)`
        : highlight ? `0 0 0 2px rgba(255,79,0,0.08)` : 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}>
      <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: MUTED }}>
        {label.toUpperCase()}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <input type="number" inputMode="decimal" value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder="0"
          style={{
            background: 'none', border: 'none', outline: 'none',
            fontSize: 34, fontWeight: 900, color: value ? TEXT : '#333',
            width: '100%', caretColor: O, fontFamily: 'inherit', lineHeight: 1,
          }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: MUTED }}>{unit}</span>
      </div>
    </div>
  );
}

function Stat({ value, label, color, sublabel, flex }) {
  return (
    <div style={{
      flex: flex ? 1 : undefined,
      background: CARD, border: `1px solid ${LINE}`, borderRadius: 16,
      padding: '14px 12px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sublabel && <div style={{ fontSize: 9, fontWeight: 600, color: MUTED, marginTop: 2 }}>{sublabel}</div>}
      <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 2, color: '#444', marginTop: 4 }}>{label}</div>
    </div>
  );
}
