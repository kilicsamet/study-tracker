import { useEffect, useRef, useState } from 'react'
import { BREAK_MESSAGES, pick } from '../utils/helpers'
import { playBell } from '../utils/sounds'

export default function BreakModal({ onBreak, onSnooze, onDismiss }) {
  const msg      = pick(BREAK_MESSAGES)
  const ringRef  = useRef(null)
  const [ringing, setRinging] = useState(true)

  useEffect(() => {
    // Hemen çal
    playBell()

    // Her 8 saniyede tekrar çal
    ringRef.current = setInterval(() => {
      playBell()
    }, 8000)

    return () => {
      clearInterval(ringRef.current)
    }
  }, [])

  function act(fn) {
    setRinging(false)
    clearInterval(ringRef.current)
    fn()
  }

  return (
    <div style={S.overlay}>
      <div style={S.box} className="anim-scalein">
        <div style={S.bellWrap}>
          <span style={{
            fontSize: '52px',
            display: 'block',
            animation: ringing ? 'bellRing 1s ease infinite' : 'none'
          }}>🔔</span>
          <div style={S.pulse} />
        </div>

        <h2 style={S.title}>Saat başı molası!</h2>
        <p style={S.msg}>{msg}</p>
        <p style={S.dur}>10 dakika mola önerilir ☕</p>

        <div style={S.btns}>
          <button style={{...S.btn, ...S.btnPrimary}} onClick={() => act(onBreak)}>
            ✅ Mola veriyorum (10 dk)
          </button>
          <button style={{...S.btn, ...S.btnSnooze}} onClick={() => act(onSnooze)}>
            ⏰ 15 dakika sonra hatırlat
          </button>
          <button style={{...S.btn, ...S.btnDismiss}} onClick={() => act(onDismiss)}>
            ✕ Devam ediyorum
          </button>
        </div>
      </div>
    </div>
  )
}

const S = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.72)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'20px' },
  box: { background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:'28px', padding:'40px 32px', maxWidth:'380px', width:'100%', textAlign:'center', boxShadow:'0 32px 80px rgba(0,0,0,.65)' },
  bellWrap: { position:'relative', display:'inline-block', marginBottom:'20px' },
  pulse: { position:'absolute', inset:'-8px', borderRadius:'50%', border:'2px solid var(--rose)', opacity:.4, animation:'ringPop 1.5s ease infinite' },
  title: { fontSize:'24px', color:'var(--gold)', marginBottom:'12px' },
  msg: { fontSize:'15px', color:'var(--text)', marginBottom:'6px', lineHeight:1.6 },
  dur: { fontSize:'13px', color:'var(--text3)', marginBottom:'28px' },
  btns: { display:'flex', flexDirection:'column', gap:'10px' },
  btn: { padding:'14px 20px', borderRadius:'14px', fontSize:'14px', fontWeight:'600', cursor:'pointer' },
  btnPrimary: { background:'linear-gradient(135deg,var(--rose),#d4547a)', color:'#fff', boxShadow:'0 4px 14px var(--rose-glow)' },
  btnSnooze: { background:'var(--gold-dim)', color:'var(--gold)', border:'1px solid rgba(232,201,122,.3)' },
  btnDismiss: { background:'transparent', color:'var(--text3)', border:'1px solid var(--border)', fontSize:'13px' },
}