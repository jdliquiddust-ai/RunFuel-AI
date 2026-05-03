import { useState, useEffect, useRef, useCallback } from 'react';
import {
  generateFuelingPlan,
  getActiveAlerts,
  formatTime,
  getCurrentMile,
  getNextMilestone,
  PACE_PER_MILE,
} from '../utils/fuelingLogic';

/* ── Streak calculation ── */
function getStreak() {
  const history = JSON.parse(localStorage.getItem('runfuel_history') || '[]');
  if (history.length === 0) return 0;
  const DAY = 86_400_000;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const uniqueDays = [...new Set(
    history.map(r => { const d = new Date(r.completedAt); d.setHours(0,0,0,0); return d.getTime(); })
  )].sort((a, b) => b - a);
  let streak = 0;
  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = today.getTime() - i * DAY;
    const yesterday = today.getTime() - DAY;
    if (i === 0 && uniqueDays[0] !== today.getTime() && uniqueDays[0] !== yesterday) break;
    if (uniqueDays[i] >= today.getTime() - (streak + 1) * DAY) streak++;
    else break;
  }
  return streak;
}

const INTENSITY_COLOR = { easy: '#22C55E', moderate: '#FF4F00', high: '#EF4444' };
const INTENSITY_EMOJI = { easy: '🟢', moderate: '🟡', high: '🔴' };

export default function LiveEngine() {
  const [scheduledRun, setScheduledRun]     = useState(null);
  const [milestones, setMilestones]         = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning]           = useState(false);
  const [hasStarted, setHasStarted]         = useState(false);
  const [flashMilestone, setFlashMilestone] = useState(null);
  const [isFlashing, setIsFlashing]         = useState(false);
  const [completedIds, setCompletedIds]     = useState(new Set());
  const [activeAlerts, setActiveAlerts]     = useState([]);
  const [runComplete, setRunComplete]       = useState(false);
  const [notifPermission, setNotifPermission] = useState('default');
  const [streak, setStreak]                 = useState(0);

  const completedRef  = useRef(new Set());
  const intervalRef   = useRef(null);
  const flashTimeout  = useRef(null);

  /* ── Auto-load on mount (ONE-TAP: no manual load step) ── */
  useEffect(() => {
    autoLoad();
    if ('Notification' in window) setNotifPermission(Notification.permission);
    setStreak(getStreak());
  }, []);

  function autoLoad() {
    const stored = localStorage.getItem('runfuel_scheduled_run');
    if (!stored) return;
    const run = JSON.parse(stored);
    const plan = generateFuelingPlan(run.distance, run.intensity);
    setScheduledRun(run);
    setMilestones(plan);
    resetState();
  }

  function resetState() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setElapsedSeconds(0);
    setIsRunning(false);
    setHasStarted(false);
    setRunComplete(false);
    setFlashMilestone(null);
    setIsFlashing(false);
    completedRef.current = new Set();
    setCompletedIds(new Set());
  }

  /* ── Poll lifecycle alerts ── */
  useEffect(() => {
    if (!scheduledRun) return;
    const check = () => setActiveAlerts(getActiveAlerts(scheduledRun));
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [scheduledRun]);

  /* ── Notification permission ── */
  function requestNotifications() {
    Notification.requestPermission().then(p => setNotifPermission(p));
  }

  /* ── Milestone trigger ── */
  const triggerMilestone = useCallback((m) => {
    setFlashMilestone(m);
    setIsFlashing(true);
    setCompletedIds(prev => new Set([...prev, m.id]));
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    flashTimeout.current = setTimeout(() => setIsFlashing(false), 4000);
    if (Notification.permission === 'granted') {
      try { new Notification(`RunFuel AI — ${m.label}`, { body: m.action, tag: m.id }); } catch (_) {}
    }
  }, []);

  /* ── Timer ── */
  function startTimer() {
    if (intervalRef.current) return;
    setIsRunning(true);
    setHasStarted(true);
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        const elapsedMin = next / 60;
        milestones.forEach(m => {
          if (!completedRef.current.has(m.id) && elapsedMin >= m.timeMin) {
            completedRef.current.add(m.id);
            triggerMilestone(m);
          }
        });
        if (scheduledRun) {
          const totalSec = scheduledRun.distance * PACE_PER_MILE[scheduledRun.intensity] * 60;
          if (next >= totalSec) {
            clearInterval(intervalRef.current); intervalRef.current = null;
            setIsRunning(false);
            setRunComplete(true);
            saveRun(scheduledRun, next);
            setStreak(getStreak());
          }
        }
        return next;
      });
    }, 1000);
  }

  function pauseTimer() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsRunning(false);
  }

  function stopTimer() {
    if (scheduledRun && elapsedSeconds > 30) saveRun(scheduledRun, elapsedSeconds);
    autoLoad(); // reload so it's ready for next run
    setStreak(getStreak());
  }

  function saveRun(run, seconds) {
    const history = JSON.parse(localStorage.getItem('runfuel_history') || '[]');
    history.unshift({
      id: Date.now(),
      name: run.name || `${run.distance} mi ${run.intensity} run`,
      distance: run.distance,
      intensity: run.intensity,
      durationSeconds: seconds,
      completedAt: new Date().toISOString(),
    });
    localStorage.setItem('runfuel_history', JSON.stringify(history.slice(0, 50)));
  }

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
  }, []);

  /* ── Derived values ── */
  const pacePerMile    = scheduledRun ? PACE_PER_MILE[scheduledRun.intensity] : 10;
  const currentMile    = getCurrentMile(elapsedSeconds, pacePerMile);
  const nextMilestone  = getNextMilestone(milestones, elapsedSeconds);
  const completed      = milestones.filter(m => completedIds.has(m.id));
  const totalSeconds   = scheduledRun ? scheduledRun.distance * pacePerMile * 60 : 0;
  const progressPct    = totalSeconds > 0 ? Math.min((elapsedSeconds / totalSeconds) * 100, 100) : 0;
  const R = 110; // stopwatch arc radius

  /* Next fuel countdown */
  let countdownStr = '--:--';
  let milesAway    = null;
  let nextFuelPct  = 0;
  if (nextMilestone && hasStarted) {
    const secsLeft  = Math.max(0, nextMilestone.timeMin * 60 - elapsedSeconds);
    const m = Math.floor(secsLeft / 60), s = secsLeft % 60;
    countdownStr = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    milesAway    = Math.max(0, nextMilestone.mile - currentMile).toFixed(1);
    const prev   = completed[completed.length - 1];
    const prevT  = prev ? prev.timeMin * 60 : 0;
    const intv   = nextMilestone.timeMin * 60 - prevT;
    nextFuelPct  = intv > 0 ? Math.min(((elapsedSeconds - prevT) / intv) * 100, 100) : 0;
  }

  const circumference = 2 * Math.PI * R;

  return (
    <div className={`live-bg flex flex-col${isFlashing ? ' flash-orange' : ''}`} style={{ minHeight: '100vh' }}>

      {/* ── Pre/Post-run lifecycle alert banners ── */}
      {activeAlerts.map(alert => (
        <div key={alert.id} className="alert-banner z-50 w-full" style={{ background: alert.color }}>
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <span style={{ fontSize: 20 }}>{alert.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm leading-none">{alert.label}</p>
              <p className="text-white text-xs opacity-85 mt-0.5 leading-snug line-clamp-2">{alert.message}</p>
            </div>
          </div>
        </div>
      ))}

      {/* ── Cinematic milestone flash banner ── */}
      {flashMilestone && isFlashing && (
        <div className="alert-banner fixed top-0 left-0 right-0 z-[60] overflow-hidden">
          <div className="px-4 py-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg,#FF4F00 0%,#FF6A20 100%)' }}>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              {flashMilestone.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-xl leading-tight">
                MILE {flashMilestone.mile} — {flashMilestone.label}
              </p>
              <p className="text-white text-sm mt-1 opacity-95 leading-snug">{flashMilestone.action}</p>
            </div>
            <span className="text-white text-3xl">✓</span>
          </div>
          {/* Depleting progress bar */}
          <div style={{ height: 4, background: 'rgba(0,0,0,0.25)' }}>
            <div style={{ height: '100%', background: 'rgba(255,255,255,0.7)', animation: 'deplete 4s linear forwards' }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes deplete { from { width: 100% } to { width: 0% } }
        .line-clamp-2 { display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
      `}</style>

      {/* ══════════════ HERO SECTION ══════════════ */}
      <div className="flex-1 flex flex-col items-center justify-start px-5 pt-4 pb-2 relative">

        {/* ── Top bar: Module label + Streak + Notif ── */}
        <div className="w-full max-w-lg flex items-center justify-between mb-5 pt-10">
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#FF4F00' }}>MODULE B</p>
            <p className="font-black text-sm text-white">THE LIVE ENGINE</p>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="streak-badge flex items-center gap-1.5 px-3 py-1.5 rounded-xl">
                <span style={{ fontSize: 16 }}>🔥</span>
                <span className="text-xs font-black" style={{ color: '#FF4F00' }}>{streak} DAY{streak !== 1 ? 'S' : ''}</span>
              </div>
            )}
            {notifPermission === 'default' && (
              <button
                onClick={requestNotifications}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(255,79,0,0.15)', color: '#FF4F00', border: '1px solid rgba(255,79,0,0.25)' }}
              >
                🔔 Alerts
              </button>
            )}
            {notifPermission === 'granted' && (
              <span className="text-xs font-bold" style={{ color: '#22C55E' }}>🔔 On</span>
            )}
          </div>
        </div>

        {/* ── NO RUN SCHEDULED ── */}
        {!scheduledRun ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 py-12">
            <div style={{ fontSize: 64 }}>🏃</div>
            <div>
              <p className="font-black text-xl text-white">No Run Scheduled</p>
              <p className="text-sm mt-1" style={{ color: '#4D4D4D' }}>Head to Plan → Schedule a run → come back here</p>
            </div>
            <div
              className="px-6 py-3 rounded-2xl text-sm font-bold"
              style={{ background: 'rgba(255,79,0,0.12)', color: '#FF4F00', border: '1px solid rgba(255,79,0,0.25)' }}
            >
              Plan → Schedule → Return here → START
            </div>
          </div>
        ) : (
          <>
            {/* ── Run badge ── */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className="px-3 py-1 rounded-full text-xs font-black uppercase"
                style={{ background: INTENSITY_COLOR[scheduledRun.intensity] + '25', color: INTENSITY_COLOR[scheduledRun.intensity], border: `1px solid ${INTENSITY_COLOR[scheduledRun.intensity]}40` }}
              >
                {INTENSITY_EMOJI[scheduledRun.intensity]} {scheduledRun.intensity}
              </span>
              <span className="text-sm font-semibold" style={{ color: '#5D5D5D' }}>
                {scheduledRun.distance} mi{scheduledRun.targetTime ? ` · ${scheduledRun.targetTime}` : ''}{scheduledRun.name ? ` · ${scheduledRun.name}` : ''}
              </span>
            </div>

            {/* ══════ MASSIVE STOPWATCH ══════ */}
            <div className="relative flex items-center justify-center mb-6">
              {/* Outer glow ring (when running) */}
              {isRunning && (
                <div
                  className="absolute rounded-full pulse-ring"
                  style={{ width: 268, height: 268, border: '2px solid rgba(255,79,0,0.15)' }}
                />
              )}

              {/* SVG arc progress */}
              <svg
                width="260" height="260"
                viewBox="0 0 260 260"
                style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
                className={isRunning ? 'ring-active' : ''}
              >
                {/* Track */}
                <circle cx="130" cy="130" r={R} fill="none" stroke="rgba(255,79,0,0.12)" strokeWidth="6" />
                {/* Progress fill */}
                <circle
                  cx="130" cy="130" r={R}
                  fill="none"
                  stroke="#FF4F00"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progressPct / 100)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>

              {/* Watch face */}
              <div
                className="relative flex flex-col items-center justify-center rounded-full z-10"
                style={{
                  width: 248,
                  height: 248,
                  background: 'radial-gradient(circle at 38% 28%, #222222, #0D0D0D)',
                  border: `3px solid ${isRunning ? '#FF4F0030' : '#1E1E1E'}`,
                  boxShadow: isRunning
                    ? '0 0 60px rgba(255,79,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  transition: 'all 0.5s ease',
                }}
              >
                {/* Elapsed timer */}
                <div
                  className="stopwatch-digits"
                  style={{ fontSize: elapsedSeconds >= 3600 ? 42 : 52 }}
                >
                  {formatTime(elapsedSeconds)}
                </div>

                {hasStarted ? (
                  <>
                    {/* Current mile */}
                    <div className="mt-1 flex items-center gap-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: '#FF4F00', animation: isRunning ? 'pulse-dot 1s infinite' : 'none' }}
                      />
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FF4F00' }}>
                        MI {currentMile.toFixed(2)}
                      </span>
                    </div>

                    {/* ── Finish countdown ── */}
                    {totalSeconds > 0 && !runComplete && (
                      <div
                        className="mt-2 px-3 py-1 rounded-lg flex items-center gap-1.5"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <span style={{ fontSize: 11, color: '#4D4D4D' }}>FINISH IN</span>
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 15,
                            fontWeight: 700,
                            color: progressPct > 80 ? '#FF4F00' : '#aaaaaa',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {formatTime(Math.max(0, totalSeconds - elapsedSeconds))}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-xs font-medium mt-1" style={{ color: '#3D3D3D' }}>READY TO RUN</span>
                )}
              </div>
            </div>

            <style>{`
              @keyframes pulse-dot {
                0%,100% { opacity:1; } 50% { opacity:0.2; }
              }
            `}</style>

            {/* ── Run complete celebration ── */}
            {runComplete && (
              <div className="mb-3 text-center fade-in">
                <div style={{ fontSize: 48 }}>🏆</div>
                <p className="font-black text-lg text-white">RUN COMPLETE!</p>
                <p className="text-sm mt-0.5" style={{ color: '#FF4F00' }}>Saved to Stats · Check recovery alert</p>
              </div>
            )}

            {/* ── Controls ── */}
            <div className="flex items-center gap-4 mb-5">
              {!hasStarted ? (
                /* ONE-TAP START — the only action needed */
                <button
                  onClick={startTimer}
                  className="start-btn flex items-center gap-3 px-12 py-4 rounded-2xl font-black text-white text-xl tracking-wide"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                  START RUN
                </button>
              ) : (
                <>
                  <button
                    onClick={isRunning ? pauseTimer : startTimer}
                    className="glass-btn flex items-center justify-center w-16 h-16 rounded-2xl font-black text-white text-2xl"
                    style={!isRunning ? { border: '1px solid rgba(255,79,0,0.4)' } : {}}
                  >
                    {isRunning ? '⏸' : '▶'}
                  </button>
                  <button
                    onClick={stopTimer}
                    className="glass-btn flex items-center justify-center w-16 h-16 rounded-2xl text-2xl"
                    style={{ color: '#6D6D6D' }}
                  >
                    ⏹
                  </button>
                </>
              )}
            </div>

            {/* ── Milestones preview (pre-start) ── */}
            {!hasStarted && milestones.length > 0 && (
              <div className="w-full max-w-lg space-y-2 pb-36">
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#3D3D3D' }}>
                  {milestones.length} Fuel Stops Queued
                </p>
                {milestones.map(m => (
                  <div key={m.id} className="dark-card rounded-xl flex items-center gap-3 px-3 py-2">
                    <span style={{ fontSize: 16 }}>{m.icon}</span>
                    <span className="text-xs font-semibold flex-1" style={{ color: '#6D6D6D' }}>
                      <span style={{ color: m.colorHex }}> Mi {m.mile}</span> — {m.action}
                    </span>
                    <span
                      className="text-xs font-black px-1.5 py-0.5 rounded-md flex-shrink-0"
                      style={{ background: m.colorHex + '20', color: m.colorHex }}
                    >
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Completed log (during run) ── */}
            {hasStarted && completed.length > 0 && (
              <div className="w-full max-w-lg space-y-2 pb-36">
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#3D3D3D' }}>
                  Completed ({completed.length})
                </p>
                {[...completed].reverse().map(m => (
                  <div key={m.id} className="dark-card rounded-xl flex items-center gap-3 px-3 py-2">
                    <span style={{ fontSize: 16 }}>{m.icon}</span>
                    <span className="text-xs font-semibold flex-1" style={{ color: '#5D5D5D' }}>
                      Mi {m.mile} — {m.action}
                    </span>
                    <span className="text-xs font-black" style={{ color: '#FF4F00' }}>✓</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════
          NEXT FUEL DOCK — persistent, pinned above nav
      ══════════════════════════════════════════ */}
      {scheduledRun && hasStarted && nextMilestone && (
        <div
          className="sticky bottom-16 left-0 right-0 z-40"
          style={{
            background: 'rgba(14,14,14,0.96)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 18 }}>{nextMilestone.icon}</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-white">
                    YOUR NEXT FUEL
                  </p>
                  <p className="text-xs" style={{ color: '#5D5D5D' }}>{nextMilestone.action}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className="font-black text-lg leading-none"
                  style={{ color: '#FF4F00', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {countdownStr}
                </p>
                {milesAway !== null && (
                  <p className="text-xs" style={{ color: '#4D4D4D' }}>{milesAway} mi away</p>
                )}
              </div>
            </div>
            {/* Fuel fill bar */}
            <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
              <div className="fuel-bar-fill h-full rounded-full" style={{ width: `${nextFuelPct}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
