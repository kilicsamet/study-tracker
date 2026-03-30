import { useEffect, useState } from 'react'
import { fmtHMS } from '../utils/helpers'
import { playBreakEnd } from '../utils/sounds'

const TIPS = [
  '💧 Bir bardak su iç.',
  '👀 Gözlerini kapat, 20 saniye dinlendir.',
  '🧘 Derin 5 nefes al.',
  '🚶 Biraz yürü, kanını dolaştır.',
  '🤸 Boynunu ve omuzlarını esnet.',
]

export default function BreakScreen({ duration, onEnd }) {
  const [rem] = useState(duration)
  const [cur, setCur] = useState(duration)
  const [tip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)])
  const pct = ((duration - cur) / duration) * 100
  const R = 88, C = 2 * Math.PI * R

  useEffect(() => {
    if (cur <= 0) { playBreakEnd(); onEnd(); return }
    const t = setTimeout(() => setCur(x => x - 1), 1000)
    return () => clearTimeout(t)
  }, [cur])

  return (
    <div style={S.wrap}>
      <div style={S.inner}>
        <span style={S.icon}>☕</span>
        <h2 style={S.title}>Mola zamanı!</h2>
        <p style={S.tip}>{tip}</p>
        <div style={S.ring}>
          <svg viewBox="0 0 200 200" style={S.svg}>
            <circle cx="100" cy="100" r={R} fill="none" stroke="var(--surface3)" strokeWidth="10"/>
            <circle cx="100" cy="100" r={R} fill="none" stroke="var(--mint)" strokeWidth="10"
              strokeDasharray={C} strokeDashoffset={C*(1 - pct/100)}
              strokeLinecap="round" transform="rotate(-90 100 100)"
              style={{ transition:'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={S.ringInner}>
            <span style={S.time}>{fmtHMS(cur)}</span>
            <span style={S.timeLabel}>kalan</span>
          </div>
        </div>
        <button style={S.endBtn} onClick={onEnd}>Molayı Bitir, Devam Et →</button>
      </div>
    </div>
  )
}

const S = {
  wrap: { display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', padding:'24px' },
  inner: { background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:'28px', padding:'40px 32px', maxWidth:'360px', width:'100%', textAlign:'center', boxShadow:'var(--shadow-lg)' },
  icon: { fontSize:'44px', display:'block', marginBottom:'12px', animation:'float 3s ease-in-out infinite' },
  title: { fontSize:'26px', color:'var(--mint)', marginBottom:'8px' },
  tip: { fontSize:'14px', color:'var(--text2)', marginBottom:'28px', lineHeight:1.6 },
  ring: { position:'relative', width:'200px', height:'200px', margin:'0 auto 28px', display:'flex', alignItems:'center', justifyContent:'center' },
  svg: { position:'absolute', inset:0, width:'100%', height:'100%' },
  ringInner: { position:'relative', textAlign:'center' },
  time: { display:'block', fontSize:'34px', fontWeight:'700', color:'var(--mint)', fontVariantNumeric:'tabular-nums', letterSpacing:'-1px' },
  timeLabel: { fontSize:'12px', color:'var(--text3)', marginTop:'2px', display:'block' },
  endBtn: { background:'var(--mint-dim)', color:'var(--mint)', border:'1px solid rgba(122,232,196,.3)', padding:'13px 28px', borderRadius:'14px', fontSize:'14px', fontWeight:'600', cursor:'pointer' },
}