import { useEffect, useRef, useState } from 'react'

import BreakModal from '../components/BreakModal'
import BreakScreen from '../components/BreakScreen'
import CalendarView from '../components/CalendarView'
import DailyNoteModal from '../components/DailyNoteModal'
import KissEffect from '../components/KissEffect'
import KpssCountdown from '../components/KpssCountdown'
import WeatherEffects from '../components/WeatherEffects'
import { useAuth } from '../context/AuthContext'
import useTheme from '../hooks/useTheme'
import useWeather from '../hooks/useWeather'
import {
  getDaily,
  initDaily,
  rolloverIfNeeded,
  saveDailyNote,
  startSession,
  stopSession,
  syncRunningSession,
  todayKey,
} from '../utils/firestore'
import {
  BREAK_SECS,
  DONE_MESSAGES,
  fmtHM,
  fmtHMS,
  getGreeting,
  pick,
  SNOOZE_SECS,
  START_MESSAGES,
  TARGETS,
} from '../utils/helpers'
import { initAudio, playBell, playStart, playStop, playSuccess } from '../utils/sounds'

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'day'      // 17'ye çektik
  if (hour >= 17 && hour < 20) return 'evening'  // 17-20 arası akşam
  return 'night'
}
const ST = { IDLE: 'idle', RUNNING: 'running', BREAK: 'break' }
const SYNC_EVERY_MS = 30_000

export default function StudentDashboard() {
  const { logout } = useAuth()
  const greeting = getGreeting()
  const motivMsg = useRef(pick(START_MESSAGES)).current
  const doneMsg = useRef(pick(DONE_MESSAGES)).current

  const weather = useWeather()
  const timeOfDay = getTimeOfDay()

  useTheme(weather, timeOfDay)

  const [mode, setMode] = useState(ST.IDLE)
  const [secs, setSecs] = useState(0)
  const [target, setTarget] = useState(0)
  const [targetType, setTargetType] = useState('full')
  const [done, setDone] = useState(false)
  const [showCal, setShowCal] = useState(false)
  const [showBreakModal, setShowBreakModal] = useState(false)
  const [showDailyNoteModal, setShowDailyNoteModal] = useState(false)
  const [dailyNote, setDailyNote] = useState('')
  const [dailyNoteSaving, setDailyNoteSaving] = useState(false)
  const [snoozed, setSnoozed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confetti, setConfetti] = useState(false)

  const tickRef = useRef(null)
  const syncRef = useRef(null)
  const dayWatchRef = useRef(null)
  const snoozeRef = useRef(null)
  const modeRef = useRef(ST.IDLE)
  const syncingRef = useRef(false)
  const doneTriggeredRef = useRef(false)
  const dateKeyRef = useRef(todayKey())

  const runningRef = useRef({
    baseTotalSeconds: 0,
    sessionStartedAt: null,
    target: 0,
    targetType: 'full',
  })

  const prevBreakStepRef = useRef(0)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  function applyDayData(d) {
    const total = d?.totalSeconds || 0
    const t = d?.target ?? TARGETS.full.seconds
    const type = d?.targetType || 'full'
    const note = String(d?.dailyNote || '').trim()

    setSecs(total)
    setTarget(t)
    setTargetType(type)
    setDailyNote(note)
    setDone(t > 0 ? total >= t : false)
    doneTriggeredRef.current = t > 0 ? total >= t : false
  }

  function setRunningFromDoc(data) {
    runningRef.current = {
      baseTotalSeconds: data?.activeSession?.baseTotalSeconds ?? data?.totalSeconds ?? 0,
      sessionStartedAt: data?.activeSession?.startedAt?.toDate?.() || null,
      target: data?.target ?? TARGETS.full.seconds,
      targetType: data?.targetType || 'full',
    }
  }

  function getLiveDailyTotal() {
    const { baseTotalSeconds, sessionStartedAt } = runningRef.current

    if (!sessionStartedAt) return baseTotalSeconds

    const elapsed = Math.max(0, Math.floor((Date.now() - sessionStartedAt.getTime()) / 1000))
    return baseTotalSeconds + elapsed
  }

  function getLiveSessionSecs() {
    const { sessionStartedAt } = runningRef.current

    if (!sessionStartedAt) return 0

    return Math.max(0, Math.floor((Date.now() - sessionStartedAt.getTime()) / 1000))
  }

  function killTick() {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    if (syncRef.current) {
      clearInterval(syncRef.current)
      syncRef.current = null
    }
    if (dayWatchRef.current) {
      clearInterval(dayWatchRef.current)
      dayWatchRef.current = null
    }
    if (snoozeRef.current) {
      clearTimeout(snoozeRef.current)
      snoozeRef.current = null
    }
  }

  function startIdleWatch() {
  dayWatchRef.current = setInterval(async () => {
    void checkDayRollover()

    if (modeRef.current !== ST.IDLE) return

    try {
      const fresh = await getDaily(dateKeyRef.current)
      if (!fresh) return

      const newTarget = fresh.target ?? TARGETS.full.seconds
      const newSecs = fresh.totalSeconds || 0
      const nowDone = newTarget > 0 ? newSecs >= newTarget : false

      setTarget(newTarget)
      setTargetType(fresh.targetType || 'full')
      setSecs(newSecs)
      runningRef.current.target = newTarget

    if (nowDone) {
  setDone(true)
  const note = String(fresh?.dailyNote || '').trim()
  if (!note && !showDailyNoteModal) {
    setShowDailyNoteModal(true)
  }
}
    } catch (err) {
      console.error('idleWatch error:', err)
    }
  }, 1000)
}

  async function maybeOpenDailyNoteModal(total, t) {
    if (t <= 0) return
    if (doneTriggeredRef.current) return
    if (total < t) return

    doneTriggeredRef.current = true

    const fresh = await getDaily(dateKeyRef.current)
    const existingNote = String(fresh?.dailyNote || '').trim()

    if (!existingNote) {
      setDailyNote('')
      setShowDailyNoteModal(true)
    }
  }

  function maybeTriggerDone(total, t) {
    if (t > 0 && total >= t) {
      setDone((prev) => {
        if (!prev) {
          playSuccess()
          setConfetti(true)
          setTimeout(() => setConfetti(false), 4000)
        }
        return true
      })

      void maybeOpenDailyNoteModal(total, t)
    }
  }

  async function flushSync() {
    if (modeRef.current !== ST.RUNNING) return
    if (syncingRef.current) return

    syncingRef.current = true
    try {
      const fresh = await syncRunningSession(dateKeyRef.current)
      if (fresh) {
        setRunningFromDoc(fresh)
        setSecs(fresh.totalSeconds || 0)
        prevBreakStepRef.current = Math.floor(getLiveSessionSecs() / BREAK_SECS)
      }
    } catch (err) {
      console.error('syncRunningSession error:', err)
    } finally {
      syncingRef.current = false
    }
  }

  async function checkDayRollover() {
    const liveKey = todayKey()

    if (liveKey === dateKeyRef.current) return

    const wasRunning = modeRef.current === ST.RUNNING
    const result = await rolloverIfNeeded(dateKeyRef.current, liveKey, wasRunning)

    dateKeyRef.current = liveKey
    setShowBreakModal(false)
    setSnoozed(false)

    if (result?.nextDay) {
      applyDayData(result.nextDay)

      if (wasRunning && result.nextDay.activeSession?.startedAt) {
        setMode(ST.RUNNING)
        modeRef.current = ST.RUNNING
        beginLoops(result.nextDay)
      } else {
        killTick()
        setMode(ST.IDLE)
        modeRef.current = ST.IDLE
      }
    }
  }

  function beginLoops(data) {
    killTick()
    setRunningFromDoc(data)

    const initialSessionSecs = (() => {
      const startedAt = data?.activeSession?.startedAt?.toDate?.()
      return startedAt
        ? Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000))
        : 0
    })()

    prevBreakStepRef.current = Math.floor(initialSessionSecs / BREAK_SECS)

    tickRef.current = setInterval(() => {
      const dailyTotal = getLiveDailyTotal()
      const sessionSecs = getLiveSessionSecs()

      setSecs(dailyTotal)

      const breakStep = Math.floor(sessionSecs / BREAK_SECS)
      if (breakStep > prevBreakStepRef.current && !snoozed) {
        setShowBreakModal(true)
      }
      prevBreakStepRef.current = breakStep

      maybeTriggerDone(dailyTotal, runningRef.current.target)
    }, 1000)

    syncRef.current = setInterval(flushSync, SYNC_EVERY_MS)
    dayWatchRef.current = setInterval(() => {
      void checkDayRollover()
    }, 1000)
  }

  useEffect(() => {
    async function bootstrap() {
      const key = todayKey()
      dateKeyRef.current = key

      const d = await initDaily(key)
      applyDayData(d)

      if (d?.activeSession?.startedAt) {
        setMode(ST.RUNNING)
        modeRef.current = ST.RUNNING
        beginLoops(d)
      } else {
        setMode(ST.IDLE)
        modeRef.current = ST.IDLE
        startIdleWatch()
      }
    }

    bootstrap()

    const onHide = () => {
      if (modeRef.current === ST.RUNNING) {
        void syncRunningSession(dateKeyRef.current)
      }
    }

    const onVis = () => {
      if (document.visibilityState === 'hidden' && modeRef.current === ST.RUNNING) {
        void syncRunningSession(dateKeyRef.current)
      }
    }

    window.addEventListener('pagehide', onHide)
    window.addEventListener('beforeunload', onHide)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      window.removeEventListener('pagehide', onHide)
      window.removeEventListener('beforeunload', onHide)
      document.removeEventListener('visibilitychange', onVis)
      killTick()
    }
  }, [])

  async function handleStart() {
    if (saving || mode === ST.RUNNING || targetType === 'holiday') return

    initAudio()
    setSaving(true)

    try {
      await checkDayRollover()

      playStart()

      const fresh = await startSession(dateKeyRef.current)
      applyDayData(fresh)

      setMode(ST.RUNNING)
      modeRef.current = ST.RUNNING
      beginLoops(fresh)
    } finally {
      setSaving(false)
    }
  }

  async function handleStop() {
    if (saving || mode !== ST.RUNNING) return

    setSaving(true)

    try {
      killTick()
      playStop()

      const newTotal = await stopSession(dateKeyRef.current)
      setSecs(newTotal)
      setDone(target > 0 ? newTotal >= target : false)

      if (target > 0 && newTotal >= target) {
        doneTriggeredRef.current = true
        const fresh = await getDaily(dateKeyRef.current)
        const note = String(fresh?.dailyNote || '').trim()
        setDailyNote(note)

        if (!note) {
          setShowDailyNoteModal(true)
        }
      }

      setMode(ST.IDLE)
      modeRef.current = ST.IDLE
      startIdleWatch()
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    if (modeRef.current === ST.RUNNING) {
      killTick()
      const newTotal = await stopSession(dateKeyRef.current)
      setSecs(newTotal)
      setDone(target > 0 ? newTotal >= target : false)
      setMode(ST.IDLE)
      modeRef.current = ST.IDLE
    }

    logout()
  }

  async function handleBreak() {
    setShowBreakModal(false)

    if (modeRef.current === ST.RUNNING) {
      killTick()
      const newTotal = await stopSession(dateKeyRef.current)
      setSecs(newTotal)
      setDone(target > 0 ? newTotal >= target : false)
    }

    setMode(ST.BREAK)
    modeRef.current = ST.BREAK
    startIdleWatch()
  }

  function handleSnooze() {
    setShowBreakModal(false)
    setSnoozed(true)

    snoozeRef.current = setTimeout(() => {
      setSnoozed(false)
      setShowBreakModal(true)
      playBell()
    }, SNOOZE_SECS * 1000)
  }

  async function handleBreakEnd() {
    await checkDayRollover()

    const fresh = await startSession(dateKeyRef.current)
    applyDayData(fresh)

    setMode(ST.RUNNING)
    modeRef.current = ST.RUNNING
    beginLoops(fresh)
  }

  async function handleSaveDailyNote(note) {
    setDailyNoteSaving(true)
    try {
      const fresh = await saveDailyNote(dateKeyRef.current, note)
      setDailyNote(String(fresh?.dailyNote || '').trim())
      setShowDailyNoteModal(false)
    } finally {
      setDailyNoteSaving(false)
    }
  }

  const pct = target > 0 ? Math.min(100, (secs / target) * 100) : 100
  const rem = target > 0 ? Math.max(0, target - secs) : 0
  const R = 110
  const C = 2 * Math.PI * R
  const targetLabel = TARGETS[targetType]?.label || TARGETS.full.label


const [anniversaryModal, setAnniversaryModal] = useState({ isOpen: false, message: '' });

useEffect(() => {
    const today = new Date();
    const day   = today.getDate();
    const month = today.getMonth(); // 0-indexed
    const year  = today.getFullYear();

  if (day === 16) {
    const startDate = new Date(2026, 0, 16);
    const months    = (year - startDate.getFullYear()) * 12 + (month - startDate.getMonth());
    setAnniversaryModal({
        isOpen  : true,
        message : `${months} ay önce hayatıma girdin ve o günden bu yana her şey değişti 🌸 Seninle gülmek, seninle konuşmak, seninle olmak... hepsi benim için çok kıymetli. Yanımda olduğun her an kendimi şanslı hissediyorum. Seni tanıdığım için çok mutluyum, iyi ki varsın 💫✨`,
    });
} else if (day === 28) {
    const startDate = new Date(2026, 0, 28);
    const months    = (year - startDate.getFullYear()) * 12 + (month - startDate.getMonth());
    setAnniversaryModal({
        isOpen  : true,
        message : `${months}. ayımız kutlu olsun sevgilim 💕 Seninle geçirdiğim her gün, her an, her saniye hayatımın en güzel hediyesi. Seni sevmek bana ne kadar doğal geliyor, sanki hep böyleymiş gibi. Yanımda olduğun için, beni seçtiğin için, her şeyinle her halimle beni sevdiğin için teşekkür ederim. Seni çok ama çok seviyorum 🌹🥰✨`,
    });
}
}, []);

  return (
    <div style={S.page}>
      <WeatherEffects weather={weather} time={timeOfDay} />

      <div style={S.blob1} />
      <div style={S.blob2} />
      {confetti && <Confetti />}

      <header style={S.header}>
        <div style={S.headerTop}>
          <div style={S.greetWrap}>
            {/* <img src="/images/image.png" alt="Profil" style={S.avatar} /> */}
            <KissEffect />
            <div>
              <div style={S.greetText}>{greeting.text}</div>
              <div style={S.greetSub}>{greeting.sub}</div>
            </div>
          </div>

          <KpssCountdown />

          <div style={S.headerRight}>
            <button style={S.calBtn} onClick={() => setShowCal((s) => !s)}>
              {showCal ? '✕ Kapat' : '📅 Takvim'}
            </button>
            <button style={S.logoutBtn} onClick={handleLogout}>
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main style={S.main}>
        {showCal && (
          <div className="anim-fadeup">
            <CalendarView />
          </div>
        )}

        {mode === ST.BREAK && !showCal && (
          <BreakScreen duration={BREAK_SECS} onEnd={handleBreakEnd} />
        )}

        {mode !== ST.BREAK && !showCal && (
          <>
            <div style={S.targetBadge}>
              <span>🎯 Bugünün hedefi:</span>
              <span
                style={{
                  fontWeight: '700',
                  color:
                    targetType === 'holiday'
                      ? 'var(--mint)'
                      : targetType === 'half'
                      ? 'var(--gold)'
                      : 'var(--rose)',
                }}
              >
                {targetLabel}
              </span>
            </div>

            {targetType === 'holiday' && (
              <div style={S.holidayBanner}>🏖 Bugün tatil günü! İyi dinlenmeler 💕</div>
            )}

            {done && targetType !== 'holiday' && (
              <div style={S.doneBanner} className="anim-fadeup">
                {doneMsg}
              </div>
            )}

            {dailyNote && (
              <div style={S.noteCard}>
                <div style={S.noteLabel}>📝 Bugünün sözü</div>
                <div style={S.noteText}>{dailyNote}</div>
              </div>
            )}

            {mode === ST.IDLE && !done && targetType !== 'holiday' && (
              <p style={S.motiv}>"{motivMsg}"</p>
            )}

            {snoozed && (
              <p style={S.snoozeNote}>
                ⏰ Hatırlatıcı {SNOOZE_SECS} sn sonra tekrar çalacak
              </p>
            )}

            {targetType !== 'holiday' && (
              <div style={S.timerCard} className="anim-scalein">
                <div style={S.ringWrap}>
                  <svg viewBox="0 0 260 260" style={S.svg}>
                    <circle
                      cx="130"
                      cy="130"
                      r={R}
                      fill="none"
                      stroke="var(--surface3)"
                      strokeWidth="14"
                    />

                    {[1, 2, 3, 4, 5].map((h) => {
                      const angle = (h / 6) * 360 - 90
                      const rad = (angle * Math.PI) / 180
                      return (
                        <line
                          key={h}
                          x1={130 + (R - 8) * Math.cos(rad)}
                          y1={130 + (R - 8) * Math.sin(rad)}
                          x2={130 + (R + 4) * Math.cos(rad)}
                          y2={130 + (R + 4) * Math.sin(rad)}
                          stroke="var(--surface2)"
                          strokeWidth="2"
                        />
                      )
                    })}

                    <circle
                      cx="130"
                      cy="130"
                      r={R}
                      fill="none"
                      stroke={
                        done
                          ? 'var(--ok)'
                          : mode === ST.RUNNING
                          ? 'var(--rose)'
                          : 'var(--surface3)'
                      }
                      strokeWidth="14"
                      strokeDasharray={C}
                      strokeDashoffset={C * (1 - pct / 100)}
                      strokeLinecap="round"
                      transform="rotate(-90 130 130)"
                      style={{ transition: 'stroke-dashoffset 1s linear, stroke .4s' }}
                    />

                    {mode === ST.RUNNING &&
                      pct > 0 &&
                      (() => {
                        const angle = (pct / 100) * 360 - 90
                        const rad = (angle * Math.PI) / 180
                        return (
                          <circle
                            cx={130 + R * Math.cos(rad)}
                            cy={130 + R * Math.sin(rad)}
                            r="7"
                            fill="var(--rose)"
                          >
                            <animate
                              attributeName="r"
                              values="6;9;6"
                              dur="2s"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              values="1;.5;1"
                              dur="2s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        )
                      })()}
                  </svg>

                  <div style={S.ringInner}>
                    <div
                      style={{
                        ...S.bigClock,
                        animation: mode === ST.RUNNING ? 'ringPop 2s ease infinite' : 'none',
                        color:
                          done
                            ? 'var(--ok)'
                            : mode === ST.RUNNING
                            ? 'var(--text)'
                            : 'var(--text2)',
                      }}
                    >
                      {fmtHMS(secs)}
                    </div>

                    <div style={S.statusLabel}>
                      {mode === ST.RUNNING
                        ? '⏱ Çalışıyor'
                        : done
                        ? '🏆 Hedef tamam'
                        : '⏸ Bekliyor'}
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
                    <span
                      style={{
                        ...S.statV,
                        color: rem === 0 ? 'var(--ok)' : 'var(--warn)',
                      }}
                    >
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
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    {Math.round(pct)}%
                  </span>
                </div>

                <div style={S.track}>
                  <div
                    style={{
                      ...S.fill,
                      width: `${pct}%`,
                      background: done
                        ? 'linear-gradient(90deg,var(--ok),#5dd899)'
                        : pct >= 60
                        ? 'linear-gradient(90deg,var(--gold),#f5d580)'
                        : 'linear-gradient(90deg,var(--rose),#f0a0b5)',
                    }}
                  />

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

      <DailyNoteModal
        open={showDailyNoteModal}
        saving={dailyNoteSaving}
        onClose={() => setShowDailyNoteModal(false)}
        onSave={handleSaveDailyNote}
      />

      {anniversaryModal.isOpen && (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            }}>
                <div style={{
                    background: 'var(--surface)',
                    border: '1px solid rgba(232,130,154,.4)',
                    borderRadius: '28px',
                    padding: '40px 36px',
                    maxWidth: '340px',
                    width: '90%',
                    textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(232,130,154,.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                }}>
                    <div style={{ fontSize: '48px' }}>
                        {anniversaryModal.message.includes('tanışalı') ? '🌸' : '💕'}
                    </div>
                    <p style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: 'var(--text)',
                        lineHeight: 1.6,
                    }}>
                        {anniversaryModal.message}
                    </p>
                    <button
                        onClick={() => setAnniversaryModal({ isOpen: false, message: '' })}
                        style={{
                            background: 'linear-gradient(135deg,var(--rose),#d4547a)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '14px',
                            padding: '14px 28px',
                            fontSize: '15px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 6px 20px var(--rose-glow)',
                        }}
                    >
                        💖 Kapat
                    </button>
                </div>
            </div>
        )}
        </div>
  )
}

function Confetti() {
  const EMOJIS = ['⭐', '🌸', '✨', '💫', '🎉', '🏆', '💕', '🌟']
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9998,
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${(i * 4.2) % 100}%`,
            top: '100%',
            fontSize: `${16 + (i % 3) * 10}px`,
            animation: `confetti ${2 + (i % 3) * 0.5}s ${i * 0.12}s ease-out forwards`,
          }}
        >
          {EMOJIS[i % EMOJIS.length]}
        </span>
      ))}
    </div>
  )
}

const S = {
  page: { minHeight: '100vh', position: 'relative', overflow: 'hidden' },

  blob1: {
    position: 'fixed',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(232,130,154,.09) 0%, transparent 70%)',
    top: '-150px',
    left: '-150px',
    pointerEvents: 'none',
  },

  blob2: {
    position: 'fixed',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(184,166,232,.07) 0%, transparent 70%)',
    bottom: '-100px',
    right: '-100px',
    pointerEvents: 'none',
  },

  header: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 20px',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(15,12,26,.85)',
    backdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 200,
  },

  headerTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },

  greetWrap: { display: 'flex', alignItems: 'center', gap: '10px' },
  greetEmoji: { fontSize: '26px' },
  greetText: { fontSize: '15px', fontWeight: '700', color: 'var(--text)' },
  greetSub: { fontSize: '12px', color: 'var(--text2)', marginTop: '1px' },

  calBtn: {
    background: 'var(--rose-dim)',
    color: 'var(--rose)',
    border: '1px solid rgba(232,130,154,.3)',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  logoutBtn: {
    background: 'var(--surface2)',
    color: 'var(--text2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '13px',
    cursor: 'pointer',
  },

  main: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '24px 16px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  targetBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '12px 16px',
    fontSize: '14px',
    color: 'var(--text2)',
  },

  holidayBanner: {
    background: 'linear-gradient(135deg,rgba(122,232,196,.15),rgba(184,166,232,.1))',
    border: '1px solid rgba(122,232,196,.3)',
    borderRadius: '16px',
    padding: '20px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--mint)',
  },

  doneBanner: {
    background: 'linear-gradient(135deg,rgba(130,201,160,.18),rgba(122,232,196,.12))',
    border: '1px solid rgba(130,201,160,.35)',
    borderRadius: '16px',
    padding: '14px 20px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--ok)',
    fontFamily: 'var(--ff-serif)',
  },

  noteCard: {
    background: 'rgba(184,166,232,.10)',
    border: '1px solid rgba(184,166,232,.22)',
    borderRadius: '18px',
    padding: '16px 18px',
  },

  noteLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text3)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '.4px',
  },

  noteText: {
    fontSize: '15px',
    lineHeight: 1.7,
    color: 'var(--text)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },

  motiv: {
    fontSize: '14px',
    color: 'var(--text3)',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 1.7,
    padding: '0 8px',
  },

  snoozeNote: {
    fontSize: '12px',
    color: 'var(--gold)',
    textAlign: 'center',
  },

  timerCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border2)',
    borderRadius: '28px',
    padding: '28px 24px',
    boxShadow: 'var(--shadow)',
  },

  ringWrap: {
    position: 'relative',
    width: '260px',
    height: '260px',
    margin: '0 auto 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  svg: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  ringInner: { position: 'relative', textAlign: 'center' },

  bigClock: {
    fontSize: '42px',
    fontWeight: '700',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-2px',
    display: 'block',
    lineHeight: 1,
  },

  statusLabel: { fontSize: '13px', color: 'var(--text3)', marginTop: '6px' },
  pctLabel: { fontSize: '14px', fontWeight: '700', marginTop: '4px' },

  stats: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: '24px',
  },

  stat: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  statV: { fontSize: '16px', fontWeight: '700', color: 'var(--text)' },

  statK: {
    fontSize: '11px',
    color: 'var(--text3)',
    textTransform: 'uppercase',
    letterSpacing: '.4px',
  },

  statDiv: { width: '1px', height: '36px', background: 'var(--border)' },

  ctrlWrap: { display: 'flex', justifyContent: 'center' },

  ctrlBtn: {
    padding: '17px 56px',
    borderRadius: '18px',
    fontSize: '17px',
    fontWeight: '700',
    letterSpacing: '.3px',
    cursor: 'pointer',
  },

  ctrlStart: {
    background: 'linear-gradient(135deg,var(--rose),#d4547a)',
    color: '#fff',
    boxShadow: '0 6px 22px var(--rose-glow)',
  },

  ctrlStop: {
    background: 'var(--surface2)',
    color: 'var(--text2)',
    border: '1px solid var(--border2)',
  },

  doneChip: {
    background: 'rgba(130,201,160,.14)',
    border: '1px solid rgba(130,201,160,.3)',
    borderRadius: '14px',
    padding: '14px 28px',
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--ok)',
    textAlign: 'center',
  },

  barCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '18px',
    padding: '16px 20px',
  },

  barHead: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },

  track: {
    height: '16px',
    background: 'var(--surface3)',
    borderRadius: '8px',
    overflow: 'visible',
    position: 'relative',
  },

  fill: {
    height: '100%',
    borderRadius: '8px',
    transition: 'width 1s linear',
    minWidth: '4px',
  },

  hnotch: {
    position: 'absolute',
    top: '-5px',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  hnotchL: {
    position: 'absolute',
    top: '22px',
    fontSize: '9px',
    color: 'var(--text3)',
    whiteSpace: 'nowrap',
  },

  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--rose)',
    boxShadow: '0 0 0 3px var(--rose-dim)',
    flexShrink: 0,
  },

  headerBottom: {
    width: '100%',
  },

  headerRight: {
    display: 'flex',
    gap: '8px',
  },
}