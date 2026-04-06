import { useEffect, useRef } from 'react'

const EMOJIS = ['💋', '💕', '💗']

export default function KissEffect() {
  const midRef = useRef(null)
  const counterRef = useRef(0)

  useEffect(() => {
    const mid = midRef.current
    if (!mid) return

    function spawnPair() {
      const id = ++counterRef.current
      const dy = ((Math.random() * 24 - 12) | 0)

      const makeEl = (emoji, side) => {
        const s = document.createElement('span')
        s.textContent = emoji
        s.style.cssText = `
          position:absolute;font-size:15px;top:50%;
          ${side === 'left' ? 'left:0' : 'right:0'};
          --dy:${dy};
          animation:${side === 'left' ? 'kissLeft' : 'kissRight'} 1.4s ease-out forwards;
          pointer-events:none;z-index:10;
        `
        return s
      }

      const left  = makeEl(EMOJIS[(id * 3) % EMOJIS.length], 'left')
      const right = makeEl(EMOJIS[(id * 7) % EMOJIS.length], 'right')
      mid.appendChild(left)
      mid.appendChild(right)

      setTimeout(() => {
        const heart = document.createElement('span')
        heart.textContent = '❤️'
        heart.style.cssText = `
          position:absolute;font-size:22px;top:50%;left:50%;
          transform:translate(-50%,-50%) scale(0);
          animation:heartPop 0.8s ease-out forwards;
          pointer-events:none;z-index:11;
        `
        mid.appendChild(heart)
        setTimeout(() => heart.remove(), 800)
      }, 1350)

      setTimeout(() => { left.remove(); right.remove() }, 1420)
    }

    spawnPair()
    const iv = setInterval(spawnPair, 900)
    return () => clearInterval(iv)
  }, [])

  return (
    <>
      <style>{`
        @keyframes kissLeft {
          0%   { transform:translate(0,0) scale(.4); opacity:0; }
          20%  { opacity:1; }
          100% { transform:translate(52px,calc(var(--dy)*1px)) scale(1); opacity:0; }
        }
        @keyframes kissRight {
          0%   { transform:translate(0,0) scale(.4); opacity:0; }
          20%  { opacity:1; }
          100% { transform:translate(-52px,calc(var(--dy)*1px)) scale(1); opacity:0; }
        }
        @keyframes heartPop {
          0%   { transform:translate(-50%,-50%) scale(0); opacity:0; }
          40%  { transform:translate(-50%,-50%) scale(1.4); opacity:1; }
          70%  { transform:translate(-50%,-50%) scale(.9); opacity:1; }
          100% { transform:translate(-50%,-50%) scale(1.1); opacity:0; }
        }
      `}</style>

      <img src="/images/image.png" alt="Profil" style={S.avatar} />

      <div ref={midRef} style={S.mid} />

      <img src="/images/image1.jpg" alt="Profil 2" style={{ ...S.avatar, border: '2px solid var(--mint)', boxShadow: '0 0 0 3px rgba(122,232,196,.3)' }} />
    </>
  )
}

const S = {
  avatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    objectFit: 'cover', border: '2px solid var(--rose)',
    boxShadow: '0 0 0 3px var(--rose-dim)', flexShrink: 0,
    position: 'relative', zIndex: 2,
  },
  mid: {
    position: 'relative', width: '56px', height: '40px', flexShrink: 0,
  },
}