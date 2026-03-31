import { useEffect, useState } from 'react'

const EXAM_DATE = new Date('2026-09-06T09:00:00+03:00')

function calcCountdown() {
  const diff = EXAM_DATE.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, passed: true }
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    passed:  false,
  }
}

export default function KpssCountdown() {
  const [cd, setCd] = useState(calcCountdown)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setCd(calcCountdown())
      setPulse(p => !p)
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  if (cd.passed) return null

  const pad = n => String(n).padStart(2, '0')

  return (
    <div style={S.strip}>
      <span style={S.label}>KPSS</span>
      <div style={S.divider} />
      <div style={S.units}>
        <Unit value={cd.days}        label="gün" />
        <Sep pulse={pulse} />
        <Unit value={pad(cd.hours)}   label="sa" />
        <Sep pulse={pulse} />
        <Unit value={pad(cd.minutes)} label="dk" />
      </div>
    </div>
  )
}

function Unit({ value, label }) {
  return (
    <div style={S.unit}>
      <span style={S.value}>{value}</span>
      <span style={S.unitLabel}>{label}</span>
    </div>
  )
}

function Sep({ pulse }) {
  return (
    <span style={{
      ...S.sep,
      opacity: pulse ? 1 : 0.3,
      transition: 'opacity 0.5s ease',
    }}>:</span>
  )
}

const S = {
  strip: {
    display:        'inline-flex',
    alignItems:     'center',
    gap:            '10px',
    padding:        '5px 12px',
    borderRadius:   '10px',
    background:     'rgba(232,201,122,0.07)',
    border:         '1px solid rgba(232,201,122,0.15)',
  },
  label: {
    fontSize:      '10px',
    fontWeight:    '700',
    letterSpacing: '1px',
    color:         'var(--gold)',
    opacity:       0.7,
    textTransform: 'uppercase',
  },
  divider: {
    width:        '1px',
    height:       '14px',
    background:   'rgba(232,201,122,0.2)',
  },
  units: {
    display:     'flex',
    alignItems:  'center',
    gap:         '4px',
  },
  unit: {
    display:    'flex',
    alignItems: 'baseline',
    gap:        '3px',
  },
  value: {
    fontSize:           '14px',
    fontWeight:         '700',
    color:              'var(--gold)',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing:      '-0.5px',
  },
  unitLabel: {
    fontSize:  '9px',
    color:     'var(--text3)',
    fontWeight:'600',
    letterSpacing: '0.3px',
  },
  sep: {
    fontSize:   '12px',
    fontWeight: '700',
    color:      'var(--gold)',
    lineHeight: 1,
    userSelect: 'none',
  },
}