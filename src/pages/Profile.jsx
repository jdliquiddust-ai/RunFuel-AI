import { motion } from 'framer-motion';

const O      = '#FF4F00';
const TEXT   = '#F2F2F2';
const MUTED  = '#666666';
const BG     = '#0D0D0D';
const CARD   = '#181818';
const BORDER = 'rgba(255,255,255,0.07)';
const SHADOW = '0 2px 8px rgba(0,0,0,0.3)';

/* ── iOS-style toggle ── */
function Toggle({ on, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      style={{
        position: 'relative', width: 50, height: 28, borderRadius: 14,
        border: 'none', background: on ? O : '#2A2A2A',
        cursor: disabled ? 'not-allowed' : 'pointer', padding: 0,
        transition: 'background 0.25s', flexShrink: 0,
        boxShadow: on ? '0 0 10px rgba(255,79,0,0.3)' : 'none',
      }}
    >
      <motion.div
        animate={{ x: on ? 24 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{
          position: 'absolute', top: 3,
          width: 22, height: 22, borderRadius: '50%',
          background: disabled ? '#CCC' : '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

function SettingRow({ icon, label, sublabel, right, border = true }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '17px 18px',
      borderBottom: border ? `1px solid ${BORDER}` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: '#222', border: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT }}>{label}</p>
          {sublabel && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{sublabel}</p>
          )}
        </div>
      </div>
      <div style={{ marginLeft: 12 }}>{right}</div>
    </div>
  );
}

export default function Profile({ user, settings, onUpdateSettings, onLogout, onDeleteAll }) {
  function toggle(key) {
    onUpdateSettings({ ...settings, [key]: !settings[key] });
  }

  return (
    <div style={{
      background: BG, minHeight: '100dvh', color: TEXT,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      padding: '52px 20px 100px', maxWidth: 420, margin: '0 auto',
    }}>

      <p style={{ color: O, fontSize: 9, fontWeight: 800, letterSpacing: 5, margin: '0 0 6px' }}>SETTINGS</p>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: TEXT, margin: '0 0 28px', letterSpacing: -0.5 }}>Profile</h1>

      {/* Avatar card */}
      <div style={{
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16,
        padding: '20px 18px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: SHADOW,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg,#FF4F00,#FF7433)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 900, color: '#fff', flexShrink: 0,
        }}>
          {(user?.name || user?.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: 17, fontWeight: 900, color: TEXT }}>
            {user?.name || 'Runner'}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{user?.email}</p>
        </div>
      </div>

      {/* Notifications section */}
      <p style={{ color: MUTED, fontSize: 9, fontWeight: 800, letterSpacing: 4, margin: '0 0 10px 4px' }}>
        NOTIFICATIONS & FEEDBACK
      </p>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, marginBottom: 20, overflow: 'hidden', boxShadow: SHADOW }}>
        <SettingRow
          icon="📳"
          label="Haptic Alerts"
          sublabel="Vibrate at every fuel stop"
          right={
            <Toggle
              on={!!settings.haptics}
              onChange={() => toggle('haptics')}
            />
          }
        />
        <SettingRow
          icon="💥"
          label="Strobe Flash"
          sublabel="Full-screen flash synced with haptic pulse"
          border={false}
          right={<Toggle on={settings.strobe} onChange={() => toggle('strobe')} />}
        />
      </div>

      {/* Display section */}
      <p style={{ color: MUTED, fontSize: 9, fontWeight: 800, letterSpacing: 4, margin: '0 0 10px 4px' }}>
        DISPLAY
      </p>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, marginBottom: 28, overflow: 'hidden', boxShadow: SHADOW }}>
        <SettingRow
          icon="🔔"
          label="Fuel Banner"
          sublabel="Show the fuel-stop card during live runs"
          border={false}
          right={<Toggle on={settings.fuelBanner} onChange={() => toggle('fuelBanner')} />}
        />
      </div>

      {/* Account section */}
      <p style={{ color: MUTED, fontSize: 9, fontWeight: 800, letterSpacing: 4, margin: '0 0 10px 4px' }}>ACCOUNT</p>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, marginBottom: 10, overflow: 'hidden', boxShadow: SHADOW }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: '17px 18px', background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', fontFamily: 'inherit',
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: '#222',
            border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M16 17l5-5-5-5M21 12H9" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={MUTED} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: MUTED }}>Log Out</p>
        </button>

        <button
          onClick={onDeleteAll}
          style={{
            width: '100%', padding: '17px 18px', background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <polyline points="3 6 5 6 21 6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#EF4444' }}>Delete All Data</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#FFAAAA' }}>Removes account, history & settings</p>
          </div>
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, color: '#CCCCCC', letterSpacing: 0.5 }}>
        RunFuel AI · v1.1.0 · Data stored on device
      </p>
    </div>
  );
}
