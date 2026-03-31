import { useEffect, useMemo, useState } from 'react'

const EXAM_DATE = new Date('2026-09-06T09:00:00+03:00')

function calcCountdown() {
  const now = new Date()
  const diff = EXAM_DATE.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, passed: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes, passed: false }
}

export default function KpssCountdown() {
  const [cd, setCd] = useState(calcCountdown)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const update = () => {
      setCd(calcCountdown())
      setPulse((p) => !p)
    }

    update()

    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  const examDateText = useMemo(() => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(EXAM_DATE)
  }, [])

  if (cd.passed) {
    return (
      <div style={S.shell}>
        <style>{styles}</style>
        <div style={S.passedWrap}>
          <div style={S.passedIcon}>🎓</div>
          <div style={S.passedTextWrap}>
            <div style={S.passedTitle}>KPSS tamamlandı</div>
            <div style={S.passedSub}>Sınav tarihi geçti.</div>
          </div>
        </div>
      </div>
    )
  }

  const units = [
    { value: cd.days, label: 'Gün' },
    { value: String(cd.hours).padStart(2, '0'), label: 'Saat' },
    { value: String(cd.minutes).padStart(2, '0'), label: 'Dakika' },
  ]

  return (
    <div style={S.shell}>
      <style>{styles}</style>

      <div style={S.card}>
        <div style={S.leftGlow} />
        <div style={S.rightGlow} />

        <div style={S.topRow}>
          <div style={S.badge}>
            <span style={S.badgeIcon}>📝</span>
            <span style={S.badgeText}>KPSS Geri Sayım</span>
          </div>

          <div style={S.datePill}>{examDateText}</div>
        </div>

        <div style={S.mainRow}>
          <div style={S.titleArea}>
            <div style={S.title}>Sınava kalan süre</div>
            <div style={S.subtitle}>
              Hedefe her gün biraz daha yakınsınız.
            </div>
          </div>

          <div style={S.countdownWrap}>
            {units.map((item, index) => (
              <div key={item.label} style={S.countdownGroup}>
                <div style={S.timeCard}>
                  <div style={S.timeValue}>{item.value}</div>
                  <div style={S.timeLabel}>{item.label}</div>
                </div>

                {index < units.length - 1 && (
                  <div
                    style={{
                      ...S.separator,
                      opacity: pulse ? 1 : 0.45,
                      transform: pulse ? 'scale(1)' : 'scale(0.92)',
                    }}
                  >
                    :
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={S.bottomLine}>
          <div style={S.bottomLineFill} />
        </div>
      </div>
    </div>
  )
}

const styles = `
  @keyframes softFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-1px); }
  }

  @keyframes softGlow {
    0%, 100% {
      box-shadow:
        0 10px 30px rgba(0,0,0,0.12),
        0 0 0 1px rgba(232,201,122,0.10) inset;
    }
    50% {
      box-shadow:
        0 14px 36px rgba(0,0,0,0.16),
        0 0 0 1px rgba(232,201,122,0.16) inset,
        0 0 22px rgba(232,201,122,0.10);
    }
  }
`

const S = {
  shell: {
    width: '100%',
  },

  card: {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    padding: '10px 14px',
    borderRadius: '16px',
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(232,201,122,0.06))',
    border: '1px solid rgba(232,201,122,0.18)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    animation: 'softGlow 4s ease-in-out infinite, softFloat 5s ease-in-out infinite',
  },

  leftGlow: {
    position: 'absolute',
    top: '-40px',
    left: '-30px',
    width: '120px',
    height: '120px',
    borderRadius: '999px',
    background: 'rgba(232,201,122,0.10)',
    filter: 'blur(40px)',
    pointerEvents: 'none',
  },

  rightGlow: {
    position: 'absolute',
    bottom: '-50px',
    right: '-20px',
    width: '140px',
    height: '140px',
    borderRadius: '999px',
    background: 'rgba(232,201,122,0.08)',
    filter: 'blur(44px)',
    pointerEvents: 'none',
  },

  topRow: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },

  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '999px',
    background: 'rgba(232,201,122,0.10)',
    border: '1px solid rgba(232,201,122,0.18)',
  },

  badgeIcon: {
    fontSize: '15px',
    lineHeight: 1,
  },

  badgeText: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.9px',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    whiteSpace: 'nowrap',
  },

  datePill: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text2)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    padding: '8px 12px',
    borderRadius: '999px',
    whiteSpace: 'nowrap',
  },

  mainRow: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '18px',
    flexWrap: 'wrap',
  },

  titleArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '220px',
    flex: 1,
  },

  title: {
    fontSize: '14px',
    lineHeight: 1.1,
    fontWeight: 700,
    color: 'var(--text1)',
    letterSpacing: '-0.4px',
  },

  subtitle: {
    fontSize: '10px',
    lineHeight: 1.5,
    color: 'var(--text3)',
    maxWidth: '420px',
  },

  countdownWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },

  countdownGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  timeCard: {
    minWidth: '58px',
    padding: '8px 6px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(232,201,122,0.16)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  },

  timeValue: {
    fontSize: '20px',
    lineHeight: 1,
    fontWeight: 900,
    color: 'var(--gold)',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-1px',
  },

  timeLabel: {
    marginTop: '8px',
    fontSize: '10px',
    lineHeight: 1,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'var(--text3)',
  },

  separator: {
    width: '12px',
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: 800,
    color: 'var(--gold)',
    transition: 'all 0.5s ease',
    paddingBottom: '6px',
    userSelect: 'none',
  },

  bottomLine: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    height: '4px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },

  bottomLineFill: {
    width: '38%',
    height: '100%',
    borderRadius: '999px',
    background:
      'linear-gradient(90deg, rgba(232,201,122,0.20), rgba(232,201,122,0.85), rgba(232,201,122,0.20))',
  },

  passedWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '18px 20px',
    borderRadius: '20px',
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(232,201,122,0.06))',
    border: '1px solid rgba(232,201,122,0.18)',
  },

  passedIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'grid',
    placeItems: 'center',
    fontSize: '24px',
    background: 'rgba(232,201,122,0.12)',
    border: '1px solid rgba(232,201,122,0.18)',
  },

  passedTextWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  passedTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: 'var(--text1)',
  },

  passedSub: {
    fontSize: '13px',
    color: 'var(--text3)',
  },
}