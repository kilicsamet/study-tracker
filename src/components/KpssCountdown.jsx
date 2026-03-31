import { useEffect, useState } from 'react'

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

  useEffect(() => {
    const id = setInterval(() => {
      setCd(calcCountdown())
    }, 60_000)

    return () => clearInterval(id)
  }, [])

  if (cd.passed) {
    return (
      <div style={S.wrap}>
        <span style={S.label}>🎓 KPSS tamamlandı!</span>
      </div>
    )
  }

  return (
    <div style={S.wrap}>
      <span style={S.tag}>📝 KPSS</span>

      <div style={S.blocks}>
        <div style={S.block}>
          <span style={S.num}>{cd.days}</span>
          <span style={S.unit}>gün</span>
        </div>

        <span style={S.sep}>:</span>

        <div style={S.block}>
          <span style={S.num}>{String(cd.hours).padStart(2, '0')}</span>
          <span style={S.unit}>saat</span>
        </div>

        <span style={S.sep}>:</span>

        <div style={S.block}>
          <span style={S.num}>{String(cd.minutes).padStart(2, '0')}</span>
          <span style={S.unit}>dk</span>
        </div>
      </div>
    </div>
  )
}

const S = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(232,201,122,.08)',
    border: '1px solid rgba(232,201,122,.25)',
    borderRadius: '12px',
    padding: '7px 14px',
    minHeight: '42px',
  },
  tag: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--gold)',
    whiteSpace: 'nowrap',
  },
  blocks: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  block: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '32px',
  },
  num: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--gold)',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  unit: {
    fontSize: '9px',
    color: 'var(--text3)',
    textTransform: 'uppercase',
    letterSpacing: '.4px',
    marginTop: '2px',
  },
  sep: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--gold)',
    opacity: 0.5,
    paddingBottom: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--mint)',
  },
}