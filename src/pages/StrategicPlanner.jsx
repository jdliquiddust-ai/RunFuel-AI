import { useState, useEffect } from 'react';
import {
  generateFuelingPlan,
  getAlertSchedule,
  PACE_PER_MILE,
} from '../utils/fuelingLogic';
import RunCountdown from '../components/RunCountdown';
import AiTip from '../components/AiTip';

const INTENSITY_CONFIG = {
  easy:     { label: 'Easy',     emoji: '🟢', desc: '~12 min/mi — conversational pace' },
  moderate: { label: 'Moderate', emoji: '🟡', desc: '~10 min/mi — comfortably hard' },
  high:     { label: 'High',     emoji: '🔴', desc: '~8 min/mi — race effort' },
};

const TEMPLATES = [
  { name: 'Easy Recovery',    distance: 3,    intensity: 'easy',     emoji: '🟢', color: '#22C55E', desc: '3 mi · ~36 min' },
  { name: 'Tempo Run',        distance: 6,    intensity: 'moderate', emoji: '🟡', color: '#FF4F00', desc: '6 mi · ~60 min' },
  { name: 'Long Run',         distance: 13,   intensity: 'easy',     emoji: '🏃', color: '#3B82F6', desc: '13 mi · ~2h 36m' },
  { name: 'Race Simulation',  distance: 10,   intensity: 'high',     emoji: '🔴', color: '#EF4444', desc: '10 mi · ~1h 20m' },
  { name: '5K Shakeout',      distance: 3.1,  intensity: 'moderate', emoji: '⚡', color: '#F59E0B', desc: '3.1 mi · ~31 min' },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function StrategicPlanner({ onSave, onSwitchToLive, user }) {
  const [form, setForm] = useState({
    name: '',
    date: todayStr(),
    time: '08:00',
    distance: 10,
    intensity: 'moderate',
    targetHours: 0,
    targetMins: 0,
  });
  const [activeSection, setActiveSection] = useState('plan');
  const [saved, setSaved]   = useState(false);
  const [paused, setPaused] = useState(false);
  const [existingRun, setExistingRun] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('runfuel_scheduled_run');
    if (stored) setExistingRun(JSON.parse(stored));
    const p = localStorage.getItem('runfuel_paused');
    if (p) setPaused(JSON.parse(p));
  }, []);

  function deleteRun() {
    localStorage.removeItem('runfuel_scheduled_run');
    setExistingRun(null);
    setSaved(false);
  }

  function togglePause() {
    const next = !paused;
    setPaused(next);
    localStorage.setItem('runfuel_paused', JSON.stringify(next));
  }

  const pacePerMile = PACE_PER_MILE[form.intensity];
  const totalMinutes = form.distance * pacePerMile;
  const estH = Math.floor(totalMinutes / 60);
  const estM = totalMinutes % 60;
  const estLabel = estH > 0 ? `${estH}h ${estM}m` : `${estM}m`;
  const fillPct = Math.round(((form.distance - 1) / 49) * 100);

  // Target time derived values
  const targetTotalMins = form.targetHours * 60 + form.targetMins;
  const hasTarget = targetTotalMins > 0;
  const impliedPace = hasTarget && form.distance > 0
    ? (targetTotalMins / form.distance).toFixed(1)
    : null;
  const targetTimeStr = hasTarget
    ? form.targetHours > 0
      ? `${form.targetHours}h ${String(form.targetMins).padStart(2,'0')}m`
      : `${form.targetMins}m`
    : null;

  // Pace zone label
  function paceZone(pace) {
    if (!pace) return null;
    const p = parseFloat(pace);
    if (p <= 8)  return { label: 'Race Effort', color: '#EF4444', emoji: '🔴' };
    if (p <= 10) return { label: 'Comfortably Hard', color: '#FF4F00', emoji: '🟡' };
    if (p <= 12) return { label: 'Conversational', color: '#22C55E', emoji: '🟢' };
    return { label: 'Recovery', color: '#3B82F6', emoji: '🔵' };
  }
  const zone = paceZone(impliedPace);

  const dateTime = `${form.date}T${form.time}`;
  const fuelingPlan = generateFuelingPlan(form.distance, form.intensity);
  const alertSchedule = getAlertSchedule(dateTime, form.distance, form.intensity);

  function handleSave() {
    const run = {
      ...form,
      dateTime,
      targetTime: targetTimeStr,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('runfuel_scheduled_run', JSON.stringify(run));
    setExistingRun(run);
    setSaved(true);
    onSave?.(run);
    setTimeout(() => setSaved(false), 2500);
  }

  const sections = [
    { id: 'plan',   label: 'Plan' },
    { id: 'alerts', label: 'Alert Schedule' },
    { id: 'fuel',   label: 'Fuel Plan' },
  ];

  return (
    <div className="fade-in pb-24" style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-40 px-5 pt-12 pb-4"
        style={{ background: 'linear-gradient(180deg, #ffffff 80%, rgba(255,255,255,0))', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#FF4F00,#FF7433)' }}
          >
            <span style={{ fontSize: 20 }}>📋</span>
          </div>
          <div>
            <h1 className="font-black text-xl leading-none" style={{ color: '#2D2D2D' }}>
              THE STRATEGIC PLANNER
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#FF4F00' }}>MODULE A — THE BRAIN</p>
          </div>
        </div>

        {/* Sub-nav */}
        <div className="flex gap-1 mt-3 p-1 rounded-xl" style={{ background: '#F3F4F6' }}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: activeSection === s.id ? '#ffffff' : 'transparent',
                color: activeSection === s.id ? '#FF4F00' : '#6B7280',
                boxShadow: activeSection === s.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* ═══════════════════════════ PLAN SECTION ═══════════════════════════ */}
        {activeSection === 'plan' && (
          <>
            {/* ── Scheduled run card with Delete + Pause ── */}
            {existingRun && (
              <div
                className="rounded-2xl p-4"
                style={{ background: '#FFF3ED', border: '1.5px solid #FFD5C0' }}
              >
                <div className="flex items-start gap-3">
                  <span style={{ fontSize: 22, flexShrink: 0 }}>✅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black" style={{ color: '#FF4F00' }}>Run Scheduled</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                      {existingRun.distance} mi · {existingRun.intensity}
                      {existingRun.targetTime ? ` · ${existingRun.targetTime}` : ''}
                      {' · '}{new Date(existingRun.dateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Action row */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={togglePause}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                    style={{
                      background: paused ? '#FFF3ED' : 'rgba(255,79,0,0.1)',
                      color: paused ? '#FF4F00' : '#FF4F00',
                      border: '1px solid rgba(255,79,0,0.2)',
                    }}
                  >
                    {paused ? '▶ Resume Alerts' : '⏸ Pause Alerts'}
                  </button>
                  <button
                    onClick={deleteRun}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      color: '#EF4444',
                      border: '1px solid rgba(239,68,68,0.15)',
                    }}
                  >
                    🗑 Delete Run
                  </button>
                </div>
              </div>
            )}

            {/* ── Live Countdown + Phase Fueling Guidance ── */}
            {existingRun && !paused && new Date(existingRun.dateTime).getTime() > Date.now() && (
              <RunCountdown
                scheduledRun={existingRun}
                onSwitchToLive={onSwitchToLive}
              />
            )}

            {/* ── AI Coach Tip ── */}
            {existingRun && (
              <AiTip
                key={existingRun.dateTime}
                distance={existingRun.distance}
                intensity={existingRun.intensity}
                phase="pre-run preparation"
                userName={user?.name}
              />
            )}

            {/* ── Run Templates ── */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#9CA3AF' }}>
                Quick Start
              </p>
              <div className="grid grid-cols-1 gap-2">
                {TEMPLATES.map(t => (
                  <button
                    key={t.name}
                    onClick={() => setForm(f => ({ ...f, name: t.name, distance: t.distance, intensity: t.intensity }))}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all duration-150 active:scale-95"
                    style={{
                      background: form.name === t.name ? t.color + '14' : 'white',
                      border: `1.5px solid ${form.name === t.name ? t.color : '#F3F4F6'}`,
                      boxShadow: form.name === t.name ? `0 4px 14px ${t.color}20` : '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: t.color + '18' }}
                    >
                      {t.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm" style={{ color: '#1A1A1A' }}>{t.name}</p>
                      <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{t.desc}</p>
                    </div>
                    {form.name === t.name && (
                      <span className="text-xs font-black px-2 py-1 rounded-lg flex-shrink-0" style={{ background: t.color, color: 'white' }}>
                        Selected
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Form card */}
            <div className="glass-card rounded-2xl p-5 space-y-5">
              {/* Run Name */}
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
                  Run Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="Sunday Long Run"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all"
                  style={{
                    border: '1.5px solid #E5E7EB',
                    color: '#2D2D2D',
                    background: '#FAFAFA',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#FF4F00')}
                  onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-medium border outline-none"
                    style={{ border: '1.5px solid #E5E7EB', color: '#2D2D2D', background: '#FAFAFA' }}
                    onFocus={e => (e.target.style.borderColor = '#FF4F00')}
                    onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Start Time</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-medium border outline-none"
                    style={{ border: '1.5px solid #E5E7EB', color: '#2D2D2D', background: '#FAFAFA' }}
                    onFocus={e => (e.target.style.borderColor = '#FF4F00')}
                    onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
              </div>

              {/* Distance Slider */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Distance</label>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black" style={{ color: '#FF4F00' }}>{form.distance}</span>
                    <span className="text-sm font-semibold" style={{ color: '#2D2D2D' }}>miles</span>
                    <span className="text-xs ml-2 font-medium" style={{ color: '#9CA3AF' }}>~{estLabel}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={form.distance}
                  style={{ '--fill': `${fillPct}%` }}
                  onChange={e => setForm(f => ({ ...f, distance: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs" style={{ color: '#D1D5DB' }}>1 mi</span>
                  <span className="text-xs" style={{ color: '#D1D5DB' }}>50 mi</span>
                </div>
              </div>

              {/* Intensity Pills */}
              <div>
                <label className="block text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Intensity</label>
                <div className="flex gap-2">
                  {Object.entries(INTENSITY_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setForm(f => ({ ...f, intensity: key }))}
                      className="intensity-pill flex-1"
                      style={form.intensity === key
                        ? { background: '#FF4F00', color: '#fff', border: '2px solid #FF4F00', boxShadow: '0 4px 14px rgba(255,79,0,0.3)' }
                        : { background: '#fff', color: '#2D2D2D', border: '2px solid #E5E7EB' }
                      }
                    >
                      <span>{cfg.emoji}</span> {cfg.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-2 font-medium" style={{ color: '#9CA3AF' }}>
                  {INTENSITY_CONFIG[form.intensity].desc}
                </p>
              </div>

              {/* ── Target Run Time ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
                    Target Run Time
                    <span className="ml-1 font-normal normal-case tracking-normal" style={{ color: '#D1D5DB' }}>(optional)</span>
                  </label>
                  {hasTarget && (
                    <button
                      onClick={() => setForm(f => ({ ...f, targetHours: 0, targetMins: 0 }))}
                      className="text-xs font-bold"
                      style={{ color: '#9CA3AF' }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex gap-3 items-start">
                  {/* Hours */}
                  <div className="flex-1">
                    <p className="text-xs font-medium mb-1.5 text-center" style={{ color: '#D1D5DB' }}>Hours</p>
                    <div className="grid grid-cols-4 gap-1">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(h => (
                        <button
                          key={h}
                          onClick={() => setForm(f => ({ ...f, targetHours: h }))}
                          className="py-2 rounded-xl text-sm font-black transition-all duration-150 active:scale-95"
                          style={form.targetHours === h
                            ? { background: '#FF4F00', color: '#fff', boxShadow: '0 2px 8px rgba(255,79,0,0.35)' }
                            : { background: '#F3F4F6', color: '#6B7280' }
                          }
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center pt-7" style={{ color: '#D1D5DB', fontSize: 20, fontWeight: 900 }}>:</div>

                  {/* Minutes */}
                  <div className="flex-1">
                    <p className="text-xs font-medium mb-1.5 text-center" style={{ color: '#D1D5DB' }}>Minutes</p>
                    <div className="grid grid-cols-3 gap-1">
                      {[0, 10, 15, 20, 30, 45].map(m => (
                        <button
                          key={m}
                          onClick={() => setForm(f => ({ ...f, targetMins: m }))}
                          className="py-2 rounded-xl text-sm font-black transition-all duration-150 active:scale-95"
                          style={form.targetMins === m
                            ? { background: '#FF4F00', color: '#fff', boxShadow: '0 2px 8px rgba(255,79,0,0.35)' }
                            : { background: '#F3F4F6', color: '#6B7280' }
                          }
                        >
                          :{String(m).padStart(2,'0')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Implied pace readout */}
                {hasTarget && impliedPace && zone && (
                  <div
                    className="mt-3 rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: zone.color + '12', border: `1px solid ${zone.color}30` }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 18 }}>{zone.emoji}</span>
                      <div>
                        <p className="text-xs font-black" style={{ color: zone.color }}>{zone.label}</p>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Implied effort zone</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg leading-none" style={{ color: zone.color }}>{impliedPace}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>min/mi</p>
                    </div>
                  </div>
                )}

                {hasTarget && (
                  <div className="flex items-center justify-between mt-2 px-1">
                    <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>
                      Target: <span style={{ color: '#FF4F00', fontWeight: 900 }}>{targetTimeStr}</span>
                    </span>
                    <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>
                      Est. pace-based: <span style={{ color: '#2D2D2D', fontWeight: 900 }}>{estLabel}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Run Summary */}
            <RunSummary distance={form.distance} intensity={form.intensity} fuelingPlan={fuelingPlan} />

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full py-4 rounded-2xl font-black text-white text-base tracking-wide transition-all duration-200 active:scale-95"
              style={{
                background: saved
                  ? 'linear-gradient(135deg,#22C55E,#16A34A)'
                  : 'linear-gradient(135deg,#FF4F00,#FF7433)',
                boxShadow: saved ? '0 4px 20px rgba(34,197,94,0.4)' : '0 4px 20px rgba(255,79,0,0.4)',
              }}
            >
              {saved ? '✅  Run Scheduled!' : '⚡  SCHEDULE THIS RUN'}
            </button>
          </>
        )}

        {/* ════════════════════════ ALERT SCHEDULE ════════════════════════ */}
        {activeSection === 'alerts' && (
          <AlertScheduleView schedule={alertSchedule} runDateTime={dateTime} />
        )}

        {/* ═════════════════════════ FUEL PLAN ═════════════════════════ */}
        {activeSection === 'fuel' && (
          <FuelPlanView milestones={fuelingPlan} pacePerMile={pacePerMile} />
        )}
      </div>
    </div>
  );
}

/* ── Run Summary Card ── */
function RunSummary({ distance, intensity, fuelingPlan }) {
  const guCount = fuelingPlan.filter(m => m.type === 'gu').length;
  const saltCount = fuelingPlan.filter(m => m.hasSalt || m.type === 'salt').length;
  const calsBurned = Math.round(distance * 100);
  const carbsNeeded = fuelingPlan.filter(m => m.type === 'gu' || m.hasSalt).length * 100;

  const stats = [
    { label: 'GU Gels', value: guCount, icon: '⚡', color: '#FF4F00' },
    { label: 'SaltStick', value: saltCount, icon: '💊', color: '#3B82F6' },
    { label: 'Cal Burned', value: `~${calsBurned}`, icon: '🔥', color: '#F59E0B' },
    { label: 'Carbs In', value: `~${carbsNeeded}g`, icon: '🌾', color: '#22C55E' },
  ];

  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#9CA3AF' }}>Run Summary</p>
      <div className="grid grid-cols-4 gap-2">
        {stats.map(s => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: `${s.color}18` }}
            >
              {s.icon}
            </div>
            <span className="text-base font-black" style={{ color: s.color }}>{s.value}</span>
            <span className="text-xs font-medium text-center leading-tight" style={{ color: '#9CA3AF' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Alert Schedule View ── */
function AlertScheduleView({ schedule, runDateTime }) {
  const runTime = new Date(runDateTime);

  return (
    <div className="space-y-3">
      <p className="text-xs font-black uppercase tracking-widest px-1" style={{ color: '#9CA3AF' }}>
        Smart Alert Timeline
      </p>
      {schedule.map((alert, i) => {
        const alertTime = new Date(alert.time);
        const timeStr = alertTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateStr = alertTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        return (
          <div key={alert.id} className="glass-card rounded-2xl p-4 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
              style={{ background: alert.color }}
            />
            <div className="pl-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 22 }}>{alert.icon}</span>
                  <div>
                    <p className="text-sm font-black" style={{ color: '#2D2D2D' }}>{alert.label}</p>
                    <p className="text-xs font-medium" style={{ color: alert.color }}>
                      {alert.phase === 'post' ? 'POST-RUN' : 'PRE-RUN'} ALERT
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black" style={{ color: '#2D2D2D' }}>{timeStr}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{dateStr}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: '#6B7280' }}>{alert.message}</p>
              {alert.tips && (
                <div className="flex flex-wrap gap-1.5">
                  {alert.tips.map(tip => (
                    <span
                      key={tip}
                      className="px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ background: `${alert.color}15`, color: alert.color }}
                    >
                      {tip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Fuel Plan View ── */
function FuelPlanView({ milestones, pacePerMile }) {
  const types = ['gu', 'salt', 'hydration'];
  const typeLabels = { gu: 'GU Gels', salt: 'SaltStick', hydration: 'Hydration' };

  return (
    <div className="space-y-3">
      <p className="text-xs font-black uppercase tracking-widest px-1" style={{ color: '#9CA3AF' }}>
        {milestones.length} Fueling Milestones
      </p>
      {milestones.map(m => (
        <MilestoneCard key={m.id} m={m} />
      ))}
      {milestones.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p style={{ color: '#9CA3AF' }}>No milestones for this distance/intensity.</p>
        </div>
      )}
    </div>
  );
}

function MilestoneCard({ m }) {
  const typeIcon = { gu: '⚡', salt: '💊', hydration: '💧' };
  const minutes = Math.floor(m.timeMin);
  const seconds = Math.round((m.timeMin - minutes) * 60);
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className="glass-card rounded-2xl p-4 flex items-center gap-4"
      style={{ borderLeft: `4px solid ${m.colorHex}` }}
    >
      <div
        className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
        style={{ background: `${m.colorHex}18` }}
      >
        {m.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-xs font-black px-2 py-0.5 rounded-full"
            style={{ background: m.colorHex, color: '#fff' }}
          >
            {m.label}
          </span>
          {m.hasSalt && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#3B82F615', color: '#3B82F6' }}>
              + SALT
            </span>
          )}
        </div>
        <p className="text-xs font-medium mt-0.5 truncate" style={{ color: '#6B7280' }}>{m.action}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black" style={{ color: '#2D2D2D' }}>Mi {m.mile}</p>
        <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{timeStr}</p>
      </div>
    </div>
  );
}
