import { useEffect, useRef, useState } from 'react'
import BreakModal from '../components/BreakModal'
import BreakScreen from '../components/BreakScreen'
import CalendarView from '../components/CalendarView'
import WeatherEffects from '../components/WeatherEffects'
import { useAuth } from '../context/AuthContext'
import useTheme from '../hooks/useTheme'
import useWeather from '../hooks/useWeather'
import {
  initDaily, startSession, stopSession, syncRunningSession, todayKey,
} from '../utils/firestore'
import {
  BREAK_SECS, DONE_MESSAGES, fmtHM, fmtHMS,
  getGreeting, pick, SNOOZE_SECS, START_MESSAGES, TARGETS,
} from '../utils/helpers'
import { initAudio, playBell, playStart, playStop, playSuccess } from '../utils/sounds'

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour >= 6  && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'day'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}

const ST            = { IDLE: 'idle', RUNNING: 'running', BREAK: 'break' }
const SYNC_EVERY_MS = 2000

export default function StudentDashboard() {
  const { logout } = useAuth()
  const greeting   = getGreeting()
  const motivMsg   = useRef(pick(START_MESSAGES)).current
  const doneMsg    = useRef(pick(DONE_MESSAGES)).current

  const weather   = useWeather()
  const timeOfDay = getTimeOfDay()

  // useTheme artık return değeri yok — doğrudan :root'u günceller
  useTheme(weather, timeOfDay)

  const [mode,           setMode]           = useState(ST.IDLE)
  const [secs,           setSecs]           = useState(0)
  const [target,         setTarget]         = useState(0)
  const [targetType,     setTargetType]     = useState('full')
  const [done,           setDone]           = useState(false)
  const [showCal,        setShowCal]        = useState(false)
  const [showBreakModal, setShowBreakModal] = useState(false)
  const [snoozed,        setSnoozed]        = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [confetti,       setConfetti]       = useState(false)

  const tickRef    = useRef(null)
  const syncRef    = useRef(null)
  const snoozeRef  = useRef(null)
  const prevHour   = useRef(null)
  const modeRef    = useRef(ST.IDLE)
  const syncingRef = useRef(false)
  const runningRef = useRef({ base: 0, startedAt: null, target: 0, targetType: 'full' })

  const dateKey = todayKey()

  useEffect(() => { modeRef.current = mode }, [mode])

  function setRunningBaseFromDoc(data) {
    runningRef.current = {
      base:       data?.totalSeconds || 0,
      startedAt:  data?.activeSession?.startedAt?.toDate?.() || new Date(),
      target:     data?.target ?? TARGETS.full.seconds,
      targetType: data?.targetType || 'full',
    }
  }

  function getLiveRunningTotal() {
    const base      = runningRef.current.base || 0
    const startedAt = runningRef.current.startedAt
    if (!startedAt) return base
    return base + Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000))
  }

  function killTick() {
    if (tickRef.current)   { clearInterval(tickRef.current);  tickRef.current   = null }
    if (syncRef.current)   { clearInterval(syncRef.current);  syncRef.current   = null }
    if (snoozeRef.current) { clearTimeout(snoozeRef.current); snoozeRef.current = null }
  }

  function maybeTriggerDone(total, t) {
    if (t > 0 && total >= t) {
      setDone((prev) => {
        if (!prev) { playSuccess(); setConfetti(true); setTimeout(() => setConfetti(false), 4000) }
        return true
      })
    }
  }

  async function flushSync() {
    if (modeRef.current !== ST.RUNNING) return
    if (syncingRef.current) return
    syncingRef.current = true
    try {
      const fresh = await syncRunningSession(dateKey)
      if (!fresh?.activeSession?.startedAt) return
      setRunningBaseFromDoc(fresh)
      setSecs(fresh.totalSeconds || 0)
      setTarget(fresh.target ?? TARGETS.full.seconds)
      setTargetType(fresh.targetType || 'full')
      setDone(
        (fresh.target ?? TARGETS.full.seconds) > 0
          ? (fresh.totalSeconds || 0) >= (fresh.target ?? TARGETS.full.seconds)
          : false
      )
    } catch (err) {
      console.error('syncRunningSession error:', err)
    } finally {
      syncingRef.current = false
    }
  }

  function beginLoops(data) {
    killTick()
    setRunningBaseFromDoc(data)
    tickRef.current = setInterval(() => {
      const total = getLiveRunningTotal()
      setSecs(total)
      const hr = Math.floor(total / BREAK_SECS)
      if (prevHour.current !== null && hr > prevHour.current && !snoozed) setShowBreakModal(true)
      prevHour.current = hr
      maybeTriggerDone(total, runningRef.current.target)
    }, 1000)
    syncRef.current = setInterval(flushSync, SYNC_EVERY_MS)
  }

  useEffect(() => {
    async function bootstrap() {
      const d     = await initDaily(dateKey)
      const total = d?.totalSeconds || 0
      const t     = d?.target ?? TARGETS.full.seconds
      const type  = d?.targetType || 'full'
      setSecs(total); setTarget(t); setTargetType(type)
      setDone(t > 0 ? total >= t : false)
      setMode(ST.IDLE); modeRef.current = ST.IDLE
    }
    bootstrap()

    const onHide = () => { if (modeRef.current === ST.RUNNING) syncRunningSession(dateKey) }
    const onVis  = () => {
      if (document.visibilityState === 'hidden' && modeRef.current === ST.RUNNING)
        syncRunningSession(dateKey)
    }
    window.addEventListener('pagehide',           onHide)
    window.addEventListener('beforeunload',        onHide)
    document.addEventListener('visibilitychange',  onVis)
    return () => {
      window.removeEventListener('pagehide',          onHide)
      window.removeEventListener('beforeunload',       onHide)
      document.removeEventListener('visibilitychange', onVis)
      killTick()
    }
  }, [dateKey])

  async function handleStart() {
    if (saving || mode === ST.RUNNING || targetType === 'holiday') return
    initAudio(); setSaving(true)
    try {
      playStart()
      const fresh = await startSession(dateKey)
      const t     = fresh?.target ?? TARGETS.full.seconds
      const type  = fresh?.targetType || 'full'
      const base  = fresh?.totalSeconds || 0
      setTarget(t); setTargetType(type); setSecs(base)
      setDone(t > 0 ? base >= t : false)
      prevHour.current = Math.floor(base / BREAK_SECS)
      setMode(ST.RUNNING); modeRef.current = ST.RUNNING
      beginLoops(fresh)
    } finally { setSaving(false) }
  }

  async function handleStop() {
    if (saving || mode !== ST.RUNNING) return
    setSaving(true)
    try {
      killTick(); playStop()
      const newTotal = await stopSession(dateKey)
      setSecs(newTotal); setDone(target > 0 ? newTotal >= target : false)
      setMode(ST.IDLE); modeRef.current = ST.IDLE
    } finally { setSaving(false) }
  }

  async function handleLogout() {
    if (modeRef.current === ST.RUNNING) {
      killTick()
      const newTotal = await stopSession(dateKey)
      setSecs(newTotal); setDone(target > 0 ? newTotal >= target : false)
      setMode(ST.IDLE); modeRef.current = ST.IDLE
    }
    logout()
  }

  async function handleBreak() {
    setShowBreakModal(false)
    if (modeRef.current === ST.RUNNING) {
      killTick()
      const newTotal = await stopSession(dateKey)
      setSecs(newTotal); setDone(target > 0 ? newTotal >= target : false)
    }
    setMode(ST.BREAK); modeRef.current = ST.BREAK
  }

  function handleSnooze() {
    setShowBreakModal(false); setSnoozed(true)
    snoozeRef.current = setTimeout(() => {
      setSnoozed(false); setShowBreakModal(true); playBell()
    }, SNOOZE_SECS * 1000)
  }

  async function handleBreakEnd() {
    const fresh = await startSession(dateKey)
    const base  = fresh?.totalSeconds || 0
    prevHour.current = Math.floor(base / BREAK_SECS)
    setMode(ST.RUNNING); modeRef.current = ST.RUNNING
    beginLoops(fresh)
  }

  const pct         = target > 0 ? Math.min(100, (secs / target) * 100) : 100
  const rem         = target > 0 ? Math.max(0, target - secs) : 0
  const R           = 110
  const C           = 2 * Math.PI * R
  const targetLabel = TARGETS[targetType]?.label || TARGETS.full.label

  return (
    // artık themeVars yok — useTheme :root'u günceller, body doğru rengi alır
    <div style={S.page}>
      <WeatherEffects weather={weather} time={timeOfDay} />

      <div style={S.blob1} />
      <div style={S.blob2} />
      {confetti && <Confetti />}

      <header style={S.header}>
        <div style={S.greetWrap}>
          <span style={S.greetEmoji}>{greeting.emoji}</span>
          <div>
            <div style={S.greetText}>{greeting.text}</div>
            <div style={S.greetSub}>{greeting.sub}</div>
          </div>
        </div>
        <div style={S.headerRight}>
          <button style={S.calBtn}    onClick={() => setShowCal((s) => !s)}>
            {showCal ? '✕ Kapat' : '📅 Takvim'}
          </button>
          <button style={S.logoutBtn} onClick={handleLogout}>Çıkış</button>
        </div>
      </header>

      <main style={S.main}>
        {showCal && (
          <div className="anim-fadeup"><CalendarView /></div>
        )}

        {mode === ST.BREAK && !showCal && (
          <BreakScreen duration={BREAK_SECS} onEnd={handleBreakEnd} />
        )}

        {mode !== ST.BREAK && !showCal && (
          <>
            <div style={S.targetBadge}>
              <span>🎯 Bugünün hedefi:</span>
              <span style={{
                fontWeight: '700',
                color: targetType === 'holiday' ? 'var(--mint)'
                     : targetType === 'half'    ? 'var(--gold)'
                     :                            'var(--rose)',
              }}>
                {targetLabel}
              </span>
            </div>

            {targetType === 'holiday' && (
              <div style={S.holidayBanner}>🏖 Bugün tatil günü! İyi dinlenmeler 💕</div>
            )}

            {done && targetType !== 'holiday' && (
              <div style={S.doneBanner} className="anim-fadeup">{doneMsg}</div>
            )}

            {mode === ST.IDLE && !done && targetType !== 'holiday' && (
              <p style={S.motiv}>"{motivMsg}"</p>
            )}

            {snoozed && (
              <p style={S.snoozeNote}>⏰ Hatırlatıcı {SNOOZE_SECS} sn sonra tekrar çalacak</p>
            )}

            {targetType !== 'holiday' && (
              <div style={S.timerCard} className="anim-scalein">
                <div style={S.ringWrap}>
                  <svg viewBox="0 0 260 260" style={S.svg}>
                    <circle cx="130" cy="130" r={R} fill="none" stroke="var(--surface3)" strokeWidth="14" />

                    {[1, 2, 3, 4, 5].map((h) => {
                      const angle = (h / 6) * 360 - 90
                      const rad   = (angle * Math.PI) / 180
                      return (
                        <line key={h}
                          x1={130 + (R - 8) * Math.cos(rad)} y1={130 + (R - 8) * Math.sin(rad)}
                          x2={130 + (R + 4) * Math.cos(rad)} y2={130 + (R + 4) * Math.sin(rad)}
                          stroke="var(--surface2)" strokeWidth="2"
                        />
                      )
                    })}

                    <circle cx="130" cy="130" r={R} fill="none"
                      stroke={done ? 'var(--ok)' : mode === ST.RUNNING ? 'var(--rose)' : 'var(--surface3)'}
                      strokeWidth="14"
                      strokeDasharray={C}
                      strokeDashoffset={C * (1 - pct / 100)}
                      strokeLinecap="round"
                      transform="rotate(-90 130 130)"
                      style={{ transition: 'stroke-dashoffset 1s linear, stroke .4s' }}
                    />

                    {mode === ST.RUNNING && pct > 0 && (() => {
                      const angle = (pct / 100) * 360 - 90
                      const rad   = (angle * Math.PI) / 180
                      return (
                        <circle cx={130 + R * Math.cos(rad)} cy={130 + R * Math.sin(rad)} r="7" fill="var(--rose)">
                          <animate attributeName="r"       values="6;9;6" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="1;.5;1" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )
                    })()}
                  </svg>

                  <div style={S.ringInner}>
                    <div style={{
                      ...S.bigClock,
                      animation: mode === ST.RUNNING ? 'ringPop 2s ease infinite' : 'none',
                      color: done ? 'var(--ok)' : mode === ST.RUNNING ? 'var(--text)' : 'var(--text2)',
                    }}>
                      {fmtHMS(secs)}
                    </div>
                    <div style={S.statusLabel}>
                      {mode === ST.RUNNING ? '⏱ Çalışıyor' : done ? '🏆 Hedef tamam' : '⏸ Bekliyor'}
                    </div>
                    <div style={{ ...S.pctLabel, color: done ? 'var(--ok)' : 'var(--rose)' }}>
                      {Math.round(pct)}% tamamlandı
                    </div>
                  </div>
                </div>

                <div style={S.stats}>
                  <div style={S.stat}>
                    <span style={S.statV}>{fmtHM(secs)}</span>
                    <span style={S.statK}>Çalışıldı</span>
                  </div>
                  <div style={S.statDiv} />
                  <div style={S.stat}>
                    <span style={{ ...S.statV, color: rem === 0 ? 'var(--ok)' : 'var(--warn)' }}>
                      {rem === 0 ? '✅' : fmtHM(rem)}
                    </span>
                    <span style={S.statK}>Kalan</span>
                  </div>
                  <div style={S.statDiv} />
                  <div style={S.stat}>
                    <span style={S.statV}>{fmtHM(target)}</span>
                    <span style={S.statK}>Hedef</span>
                  </div>
                </div>

                <div style={S.ctrlWrap}>
                  {mode === ST.IDLE && !done && (
                    <button
                      style={{ ...S.ctrlBtn, ...S.ctrlStart, opacity: saving ? 0.6 : 1 }}
                      onClick={handleStart}
                      disabled={saving}
                    >
                      {saving ? '…' : '▶  Başla'}
                    </button>
                  )}
                  {mode === ST.RUNNING && (
                    <button
                      style={{ ...S.ctrlBtn, ...S.ctrlStop, opacity: saving ? 0.6 : 1 }}
                      onClick={handleStop}
                      disabled={saving}
                    >
                      {saving ? '…' : '⏹  Durdur'}
                    </button>
                  )}
                  {done && mode === ST.IDLE && (
                    <div style={S.doneChip}>🌟 Bugünlük hedef tamamlandı!</div>
                  )}
                </div>
              </div>
            )}

            {targetType !== 'holiday' && (
              <div style={S.barCard}>
                <div style={S.barHead}>
                  <span style={{ fontSize: '13px', color: 'var(--text2)' }}>Günlük ilerleme</span>
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{Math.round(pct)}%</span>
                </div>
                <div style={S.track}>
                  <div style={{
                    ...S.fill,
                    width: `${pct}%`,
                    background: done
                      ? 'linear-gradient(90deg,var(--ok),#5dd899)'
                      : pct >= 60
                      ? 'linear-gradient(90deg,var(--gold),#f5d580)'
                      : 'linear-gradient(90deg,var(--rose),#f0a0b5)',
                  }} />
                  {[1, 2, 3, 4, 5].map((h) => (
                    <div key={h} style={{ ...S.hnotch, left: `${(h / 6) * 100}%` }}>
                      <span style={S.hnotchL}>{h}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showBreakModal && (
        <BreakModal
          onBreak={handleBreak}
          onSnooze={handleSnooze}
          onDismiss={() => setShowBreakModal(false)}
        />
      )}
    </div>
  )
}

function Confetti() {
  const EMOJIS = ['⭐', '🌸', '✨', '💫', '🎉', '🏆', '💕', '🌟']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <span key={i} style={{
          position:  'absolute',
          left:      `${(i * 4.2) % 100}%`,
          top:       '100%',
          fontSize:  `${16 + (i % 3) * 10}px`,
          animation: `confetti ${2 + (i % 3) * 0.5}s ${i * 0.12}s ease-out forwards`,
        }}>
          {EMOJIS[i % EMOJIS.length]}
        </span>
      ))}
    </div>
  )
}

const S = {
  page: { minHeight: '100vh', position: 'relative', overflow: 'hidden' },
  blob1: {
    position: 'fixed', width: '600px', height: '600px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(232,130,154,.09) 0%, transparent 70%)',
    top: '-150px', left: '-150px', pointerEvents: 'none',
  },
  blob2: {
    position: 'fixed', width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(184,166,232,.07) 0%, transparent 70%)',
    bottom: '-100px', right: '-100px', pointerEvents: 'none',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', borderBottom: '1px solid var(--border)',
    background: 'rgba(15,12,26,.85)', backdropFilter: 'blur(20px)',
    position: 'sticky', top: 0, zIndex: 200, flexWrap: 'wrap', gap: '10px',
  },
  greetWrap:   { display: 'flex', alignItems: 'center', gap: '10px' },
  greetEmoji:  { fontSize: '26px' },
  greetText:   { fontSize: '15px', fontWeight: '700', color: 'var(--text)' },
  greetSub:    { fontSize: '12px', color: 'var(--text2)', marginTop: '1px' },
  headerRight: { display: 'flex', gap: '8px' },
  calBtn: {
    background: 'var(--rose-dim)', color: 'var(--rose)',
    border: '1px solid rgba(232,130,154,.3)', borderRadius: '10px',
    padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  logoutBtn: {
    background: 'var(--surface2)', color: 'var(--text2)',
    border: '1px solid var(--border)', borderRadius: '10px',
    padding: '8px 14px', fontSize: '13px', cursor: 'pointer',
  },
  main: {
    maxWidth: '500px', margin: '0 auto', padding: '24px 16px 48px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  targetBadge: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '12px 16px', fontSize: '14px', color: 'var(--text2)',
  },
  holidayBanner: {
    background: 'linear-gradient(135deg,rgba(122,232,196,.15),rgba(184,166,232,.1))',
    border: '1px solid rgba(122,232,196,.3)', borderRadius: '16px',
    padding: '20px', textAlign: 'center', fontSize: '16px', fontWeight: '700', color: 'var(--mint)',
  },
  doneBanner: {
    background: 'linear-gradient(135deg,rgba(130,201,160,.18),rgba(122,232,196,.12))',
    border: '1px solid rgba(130,201,160,.35)', borderRadius: '16px',
    padding: '14px 20px', textAlign: 'center', fontSize: '16px', fontWeight: '700',
    color: 'var(--ok)', fontFamily: 'var(--ff-serif)',
  },
  motiv: {
    fontSize: '14px', color: 'var(--text3)', fontStyle: 'italic',
    textAlign: 'center', lineHeight: 1.7, padding: '0 8px',
  },
  snoozeNote: { fontSize: '12px', color: 'var(--gold)', textAlign: 'center' },
  timerCard: {
    background: 'var(--surface)', border: '1px solid var(--border2)',
    borderRadius: '28px', padding: '28px 24px', boxShadow: 'var(--shadow)',
  },
  ringWrap: {
    position: 'relative', width: '260px', height: '260px', margin: '0 auto 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  svg:        { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  ringInner:  { position: 'relative', textAlign: 'center' },
  bigClock: {
    fontSize: '42px', fontWeight: '700', fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-2px', display: 'block', lineHeight: 1,
  },
  statusLabel: { fontSize: '13px', color: 'var(--text3)', marginTop: '6px' },
  pctLabel:    { fontSize: '14px', fontWeight: '700', marginTop: '4px' },
  stats: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginBottom: '24px',
  },
  stat:    { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' },
  statV:   { fontSize: '16px', fontWeight: '700', color: 'var(--text)' },
  statK:   { fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.4px' },
  statDiv: { width: '1px', height: '36px', background: 'var(--border)' },
  ctrlWrap: { display: 'flex', justifyContent: 'center' },
  ctrlBtn: {
    padding: '17px 56px', borderRadius: '18px', fontSize: '17px',
    fontWeight: '700', letterSpacing: '.3px', cursor: 'pointer',
  },
  ctrlStart: {
    background: 'linear-gradient(135deg,var(--rose),#d4547a)',
    color: '#fff', boxShadow: '0 6px 22px var(--rose-glow)',
  },
  ctrlStop: {
    background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border2)',
  },
  doneChip: {
    background: 'rgba(130,201,160,.14)', border: '1px solid rgba(130,201,160,.3)',
    borderRadius: '14px', padding: '14px 28px', fontSize: '15px', fontWeight: '700',
    color: 'var(--ok)', textAlign: 'center',
  },
  barCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '18px', padding: '16px 20px',
  },
  barHead: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  track: {
    height: '16px', background: 'var(--surface3)', borderRadius: '8px',
    overflow: 'visible', position: 'relative',
  },
  fill: { height: '100%', borderRadius: '8px', transition: 'width 1s linear', minWidth: '4px' },
  hnotch: {
    position: 'absolute', top: '-5px', transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  hnotchL: {
    position: 'absolute', top: '22px', fontSize: '9px', color: 'var(--text3)', whiteSpace: 'nowrap',
  },
}