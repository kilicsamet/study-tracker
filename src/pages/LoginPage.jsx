import { signInWithEmailAndPassword } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from '../firebase'

const PARTICLES = ['📖','✏️','⭐','🌸','💫','📝','🌙','✨','🎯','💡']

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [err,   setErr]   = useState('')
  const [busy,  setBusy]  = useState(false)
  const [pts,   setPts]   = useState([])

  useEffect(() => {
    setPts(PARTICLES.map((emoji, i) => ({
      emoji, id: i,
      x: 5 + (i * 9.3) % 90,
      dur: 7 + (i * 1.3) % 8,
      delay: -(i * 1.1) % 7,
    })))
  }, [])

  async function handle(e) {
    e.preventDefault()
    if (busy) return
    setErr(''); setBusy(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass)
    } catch {
      setErr('E-posta veya şifre yanlış. Tekrar deneyin 🥺')
      setBusy(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.blob1}/>
      <div style={S.blob2}/>
      {pts.map(p => (
        <span key={p.id} style={{ position:'fixed', bottom:'-2rem', left:`${p.x}%`, fontSize:20, opacity:.15, pointerEvents:'none', animation:`floatUp ${p.dur}s ${p.delay}s linear infinite`, zIndex:0 }}>{p.emoji}</span>
      ))}
      <div style={S.card} className="anim-scalein">
        <div style={S.iconWrap}>
          <span style={{ fontSize:'32px' }}>📚</span>
        </div>
        <h1 style={S.title}>Çalışma Takibi</h1>
        <p style={S.subtitle}>Hedefine giden yolda seninleyim 💕</p>
        <form onSubmit={handle} style={S.form}>
          <div style={S.field}>
            <label style={S.label}>E-posta</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com" style={S.input} required autoComplete="email"/>
          </div>
          <div style={S.field}>
            <label style={S.label}>Şifre</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" style={S.input} required autoComplete="current-password"/>
          </div>
          {err && <div style={S.errBox}>{err}</div>}
          <button type="submit" disabled={busy} style={{ ...S.btn, opacity: busy ? .65 : 1 }}>
            {busy ? 'Giriş yapılıyor…' : 'Giriş Yap ✨'}
          </button>
        </form>
        <p style={S.footer}>Sadece yetkili kişiler girebilir.</p>
      </div>
      <style>{`
        @keyframes floatUp { 0%{transform:translateY(0) rotate(0);opacity:.15;} 50%{opacity:.28;} 100%{transform:translateY(-110vh) rotate(360deg);opacity:0;} }
        input:focus { border-color: var(--rose) !important; box-shadow: 0 0 0 3px var(--rose-dim); }
      `}</style>
    </div>
  )
}

const S = {
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', padding:'20px' },
  blob1: { position:'fixed', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(232,130,154,.15) 0%, transparent 70%)', top:'-100px', left:'-100px', pointerEvents:'none' },
  blob2: { position:'fixed', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(184,166,232,.1) 0%, transparent 70%)', bottom:'-80px', right:'-80px', pointerEvents:'none' },
  card: { position:'relative', zIndex:1, background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:'28px', padding:'44px 40px', width:'100%', maxWidth:'420px', boxShadow:'var(--shadow-lg)', textAlign:'center' },
  iconWrap: { width:'72px', height:'72px', borderRadius:'50%', background:'var(--rose-dim)', border:'1px solid var(--rose-glow)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', animation:'float 4s ease-in-out infinite' },
  title: { fontSize:'30px', fontWeight:'600', color:'var(--text)', marginBottom:'8px' },
  subtitle: { fontSize:'14px', color:'var(--text2)', marginBottom:'32px' },
  form: { display:'flex', flexDirection:'column', gap:'18px', textAlign:'left' },
  field: { display:'flex', flexDirection:'column', gap:'7px' },
  label: { fontSize:'13px', fontWeight:'600', color:'var(--text2)' },
  input: { background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'12px', padding:'13px 16px', color:'var(--text)', fontSize:'15px', transition:'border-color .2s, box-shadow .2s' },
  errBox: { background:'rgba(232,130,130,.12)', border:'1px solid rgba(232,130,130,.3)', borderRadius:'10px', padding:'12px 16px', fontSize:'13px', color:'var(--danger)', textAlign:'center' },
  btn: { background:'linear-gradient(135deg, var(--rose), #d4547a)', color:'#fff', padding:'15px', borderRadius:'14px', fontSize:'15px', fontWeight:'700', boxShadow:'0 4px 16px var(--rose-glow)', marginTop:'4px', cursor:'pointer' },
  footer: { marginTop:'24px', fontSize:'12px', color:'var(--text3)' },
}