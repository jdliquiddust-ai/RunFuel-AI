import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { paceLabel, paceToIntensityLabel } from '../lib/fuelCalc';

const O      = '#FF4F00';
const TEXT   = '#F2F2F2';
const MUTED  = '#666666';
const BG     = '#0D0D0D';
const CARD   = '#181818';
const BORDER = 'rgba(255,255,255,0.07)';
const SHADOW = '0 2px 8px rgba(0,0,0,0.3)';

// Backward compat: entries may have `intensity` string (old) or `pace` number (new)
function getIntensityLabel(entry) {
  if (entry.pace)      return paceToIntensityLabel(entry.pace);
  if (entry.intensity) return entry.intensity;
  return 'RUN';
}

function getIntensityColor(entry) {
  const label = getIntensityLabel(entry);
  const map = {
    ELITE: '#EF4444', HARD: '#EF4444',
    FAST: '#F97316',
    MODERATE: '#F59E0B',
    EASY: '#22C55E',
    CASUAL: '#06B6D4',
  };
  return map[label] || O;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(sec) {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec % 60}s`;
}

async function shareRun(entry) {
  const intensity = getIntensityLabel(entry);
  const paceStr   = entry.pace ? `@ ${paceLabel(entry.pace)}/mi` : '';
  const text =
    `🏃 ${entry.distance}mi ${intensity.toLowerCase()} run ${paceStr} — RunFuel AI\n` +
    `💪 ${entry.carbs}g carbs · ${entry.sodium}mg sodium · ${entry.hydration ?? '—'}oz water\n` +
    `⏱ ${formatDuration(entry.duration)} · ${formatDate(entry.date)}`;
  try {
    if (navigator.share) await navigator.share({ title: 'RunFuel AI Run', text });
    else { await navigator.clipboard.writeText(text); alert('Copied to clipboard!'); }
  } catch (_) {}
}

export default function History({ history, onClear, onDeleteOne, user, onLogout, onDeleteAll }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const totalMiles = history.reduce((s, r) => s + (r.distance || 0), 0);
  const totalRuns  = history.length;

  return (
    <div style={{
      background: BG, minHeight: '100dvh', color: TEXT,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      padding: '52px 20px 100px', maxWidth: 480, margin: '0 auto',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <p style={{ color: O, fontSize: 9, fontWeight: 800, letterSpacing: 5, margin: '0 0 6px' }}>RUN HISTORY</p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: -0.5 }}>Your Runs</h1>
        </div>
        <button onClick={onLogout} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8,
          color: MUTED, fontSize: 9, fontWeight: 800, letterSpacing: 2,
          cursor: 'pointer', padding: '8px 12px', fontFamily: 'inherit',
          boxShadow: SHADOW,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          LOG OUT
        </button>
      </div>

      {/* User card */}
      {user && (
        <div style={{
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
          padding: '14px 18px', marginBottom: 18, boxShadow: SHADOW,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#FF4F00,#FF7433)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0,
          }}>
            {(user.name || user.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: TEXT }}>{user.name || user.email}</p>
            <p style={{ margin: 0, fontSize: 10, color: MUTED }}>{user.email}</p>
          </div>
        </div>
      )}

      {/* Summary strip */}
      {totalRuns > 0 && (
        <div style={{ display: 'flex', background: CARD, borderRadius: 14, marginBottom: 22, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
          {[
            { label: 'RUNS',         value: totalRuns },
            { label: 'TOTAL MILES',  value: `${totalMiles.toFixed(1)}` },
            { label: 'AVG DISTANCE', value: `${(totalMiles / totalRuns).toFixed(1)} mi` },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '16px 0', borderLeft: i > 0 ? `1px solid ${BORDER}` : 'none' }}>
              <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: TEXT }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 8, fontWeight: 800, letterSpacing: 3, color: MUTED }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Run list */}
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 64 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🏃</p>
          <p style={{ color: TEXT, fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>No runs yet.</p>
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Complete your first run to see it here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          <AnimatePresence>
            {history.map((entry, i) => {
              const intColor = getIntensityColor(entry);
              const intLabel = getIntensityLabel(entry);
              return (
                <motion.div
                  key={entry.date + i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: SHADOW }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 18px 10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        {entry.planned && (
                          <span style={{
                            fontSize: 8, fontWeight: 900, letterSpacing: 2,
                            color: '#7C3AED', background: 'rgba(124,58,237,0.12)',
                            padding: '3px 9px', borderRadius: 20, border: '1px solid rgba(124,58,237,0.2)',
                          }}>PLANNED</span>
                        )}
                        {entry.mode === 'race' && (
                          <span style={{
                            fontSize: 8, fontWeight: 900, letterSpacing: 2,
                            color: O, background: 'rgba(255,79,0,0.10)',
                            padding: '3px 9px', borderRadius: 20, border: `1px solid rgba(255,79,0,0.2)`,
                          }}>🏁 RACE DAY</span>
                        )}
                        <span style={{
                          fontSize: 9, fontWeight: 800, letterSpacing: 2,
                          color: intColor, background: intColor + '14',
                          padding: '3px 9px', borderRadius: 20,
                        }}>
                          {intLabel}
                        </span>
                        {entry.pace && (
                          <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>{paceLabel(entry.pace)} /mi</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: -0.5 }}>{entry.distance} mi</span>
                        <span style={{ fontSize: 11, color: MUTED }}>{formatDate(entry.date)}</span>
                      </div>
                      {entry.raceName && (
                        <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 600, color: O, opacity: 0.85 }}>
                          {entry.raceName}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button onClick={() => shareRun(entry)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }} title="Share">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="18" cy="5" r="3" stroke={O} strokeWidth="2"/>
                          <circle cx="6"  cy="12" r="3" stroke={O} strokeWidth="2"/>
                          <circle cx="18" cy="19" r="3" stroke={O} strokeWidth="2"/>
                          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke={O} strokeWidth="2"/>
                        </svg>
                      </button>
                      <button onClick={() => onDeleteOne(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }} title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="#CCCCCC" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', borderTop: `1px solid ${BORDER}`, padding: '10px 18px' }}>
                    {[
                      { v: `${entry.carbs}g`,                                       l: 'CARBS',  c: '#E55353' },
                      { v: `${entry.sodium}mg`,                                     l: 'SODIUM', c: '#D97706' },
                      { v: entry.hydration ? `${entry.hydration}oz` : '—',          l: 'WATER',  c: '#3B9EFF' },
                      { v: formatDuration(entry.duration),                           l: 'TIME',   c: '#7C3AED' },
                    ].map((s, j) => (
                      <div key={j} style={{ flex: 1, textAlign: j === 0 ? 'left' : 'center' }}>
                        <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 800, color: s.c }}>{s.v}</p>
                        <p style={{ margin: 0, fontSize: 8, fontWeight: 800, letterSpacing: 2.5, color: '#444' }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Clear history */}
      {history.length > 0 && (
        <button onClick={onClear} style={{
          width: '100%', padding: '14px 0', background: CARD,
          border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: SHADOW,
          color: MUTED, fontSize: 11, fontWeight: 800, letterSpacing: 3,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', marginBottom: 10,
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER; }}>
          CLEAR RUN HISTORY
        </button>
      )}

      {/* Delete All Data */}
      <div style={{ border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, overflow: 'hidden', background: CARD, boxShadow: SHADOW }}>
        <AnimatePresence mode="wait">
          {!confirmDelete ? (
            <motion.button
              key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(true)}
              style={{
                width: '100%', padding: '16px 0', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                color: MUTED, fontSize: 11, fontWeight: 800, letterSpacing: 3,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
              onMouseLeave={e => e.currentTarget.style.color = MUTED}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2"/>
              </svg>
              DELETE ALL DATA
            </motion.button>
          ) : (
            <motion.div
              key="confirm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: '18px 20px', background: 'rgba(239,68,68,0.06)' }}
            >
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 900, color: '#EF4444' }}>Delete everything?</p>
              <p style={{ margin: '0 0 16px', fontSize: 11, color: MUTED, lineHeight: 1.5 }}>
                Removes your account, all run history, and all app data. Cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmDelete(false)} style={{
                  flex: 1, padding: '13px 0', border: `1px solid ${BORDER}`, borderRadius: 10,
                  background: 'none', color: MUTED, fontSize: 11, fontWeight: 800, letterSpacing: 2,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  CANCEL
                </button>
                <button onClick={onDeleteAll} style={{
                  flex: 1, padding: '13px 0', border: 'none', borderRadius: 10,
                  background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: 2,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
                }}>
                  YES, DELETE
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
