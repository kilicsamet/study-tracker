import { useEffect, useMemo, useRef } from 'react'

// ─── Seed'li RNG ─────────────────────────────────────────────────────────────
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ─── Paylaşılan stil ─────────────────────────────────────────────────────────
const L = {
  layer: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden',
  },
}

// ─── Ana bileşen ─────────────────────────────────────────────────────────────
export default function WeatherEffects({ weather, time }) {
  return (
    <>
      {time === 'night' && <NightStars />}
      {weather === 'Clear'        && <Sun time={time} />}
      {weather === 'Clouds'       && <Clouds />}
      {weather === 'Rain'         && <Rain />}
      {weather === 'Drizzle'      && <Rain light />}
      {weather === 'Snow'         && <Snow />}
      {weather === 'Thunderstorm' && <><Rain heavy /><Lightning /></>}
      {weather === 'Mist'         && <Mist />}
      {weather === 'Fog'          && <Mist dense />}
      <Wind weather={weather} />
    </>
  )
}

// ─── Yıldızlar ───────────────────────────────────────────────────────────────
// Seed'li → render'lar arası stabil konum
// Büyük yıldızlar için halo + çapraz ışık çizgisi
export function NightStars() {
  const stars = useMemo(() => {
    const rng = seededRandom(42)
    return Array.from({ length: 140 }, (_, i) => {
      const size = rng() * 2.5 + 0.8
      const isBig = size > 2.2
      return {
        left:    rng() * 100,
        top:     rng() * 88,
        size,
        isBig,
        dur:     rng() * 4 + 2,
        delay:   rng() * 5,
        opacity: rng() * 0.5 + (isBig ? 0.5 : 0.2),
        // Büyük yıldızlar için çapraz açı (simetri kırmak için)
        crossAngle: Math.floor(rng() * 4) * 45,
      }
    })
  }, [])

  return (
    <div style={L.layer}>
      <style>{`
        @keyframes twinkle {
          0%,100% { opacity: 0.2; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.4); }
        }
        @keyframes twinkleBig {
          0%,100% { opacity: 0.5; transform: scale(1); filter: blur(0px); }
          50%      { opacity: 1;   transform: scale(1.2); filter: blur(0.5px); }
        }
      `}</style>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left:     s.left + '%',
          top:      s.top + '%',
        }}>
          {/* Ana yıldız noktası */}
          <div style={{
            width:        s.size + 'px',
            height:       s.size + 'px',
            borderRadius: '50%',
            background:   s.isBig
              ? `radial-gradient(circle, #ffffff 20%, rgba(200,220,255,0.6) 60%, transparent 100%)`
              : '#fff',
            opacity:      s.opacity,
            animation:    `${s.isBig ? 'twinkleBig' : 'twinkle'} ${s.dur}s ${s.delay}s ease-in-out infinite`,
          }} />
          {/* Büyük yıldızlar için haç şeklinde ışıma */}
          {s.isBig && (
            <>
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: s.size * 8 + 'px', height: '1px',
                marginLeft: -(s.size * 4) + 'px',
                marginTop: '-0.5px',
                background: 'linear-gradient(to right, transparent, rgba(200,220,255,0.4), transparent)',
                transform: `rotate(${s.crossAngle}deg)`,
                animation: `twinkleBig ${s.dur}s ${s.delay}s ease-in-out infinite`,
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: s.size * 6 + 'px', height: '1px',
                marginLeft: -(s.size * 3) + 'px',
                marginTop: '-0.5px',
                background: 'linear-gradient(to right, transparent, rgba(200,220,255,0.25), transparent)',
                transform: `rotate(${s.crossAngle + 90}deg)`,
                animation: `twinkleBig ${s.dur * 1.2}s ${s.delay}s ease-in-out infinite`,
                pointerEvents: 'none',
              }} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Güneş ───────────────────────────────────────────────────────────────────
// Atmosferik saçılma: 3 katman blur halo + yumuşak ışın demeti
export function Sun({ time }) {
  const palette = {
    morning: { core: '#fff9f0', mid: '#ffd080', outer: '#ff8c00', halo1: 'rgba(255,160,60,0.35)', halo2: 'rgba(255,100,0,0.15)', halo3: 'rgba(255,80,0,0.06)' },
    day:     { core: '#ffffff', mid: '#ffe566', outer: '#ffc200', halo1: 'rgba(255,220,0,0.30)', halo2: 'rgba(255,200,0,0.12)', halo3: 'rgba(255,180,0,0.05)' },
    evening: { core: '#ffe8c0', mid: '#ff9933', outer: '#c04000', halo1: 'rgba(220,90,0,0.40)', halo2: 'rgba(180,60,0,0.18)', halo3: 'rgba(140,30,0,0.07)' },
    night:   null,
  }
  const c = palette[time] || palette.day
  if (!c) return null

  // 16 ışın — değişen uzunluk ve opaklıkla daha organik
  const rays = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const rng = seededRandom(i * 7 + 3)
    return {
      angle:   i * 22.5,
      length:  50 + rng() * 40,
      opacity: 0.35 + rng() * 0.35,
      width:   1 + rng() * 2.5,
    }
  }), [])

  return (
    <div style={{ position: 'fixed', top: '60px', right: '80px', zIndex: 1, pointerEvents: 'none' }}>
      {/* Atmosferik halo katmanları — büyükten küçüğe blur */}
      <div style={{
        position: 'absolute', borderRadius: '50%',
        width: 400, height: 400, top: -150, left: -150,
        background: `radial-gradient(circle, ${c.halo3} 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute', borderRadius: '50%',
        width: 260, height: 260, top: -70, left: -70,
        background: `radial-gradient(circle, ${c.halo2} 0%, transparent 70%)`,
        filter: 'blur(20px)',
      }} />
      <div style={{
        position: 'absolute', borderRadius: '50%',
        width: 180, height: 180, top: -30, left: -30,
        background: `radial-gradient(circle, ${c.halo1} 0%, transparent 70%)`,
        filter: 'blur(8px)',
        animation: 'sunGlow 5s ease-in-out infinite',
      }} />

      {/* Işın demeti — döner */}
      <div style={{
        position: 'absolute',
        width: 120, height: 120,
        top: 0, left: 0,
        animation: 'sunRaysRotate 24s linear infinite',
      }}>
        {rays.map((r, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: r.length + 'px',
            height: r.width + 'px',
            marginTop: -(r.width / 2) + 'px',
            background: `linear-gradient(to right, ${c.halo1}, transparent)`,
            transformOrigin: '0 50%',
            transform: `rotate(${r.angle}deg)`,
            opacity: r.opacity,
            borderRadius: '4px',
          }} />
        ))}
      </div>

      {/* Güneş gövdesi */}
      <div style={{
        width: 120, height: 120,
        borderRadius: '50%',
        background: `radial-gradient(circle at 40% 40%, ${c.core} 0%, ${c.mid} 50%, ${c.outer} 100%)`,
        boxShadow: `0 0 40px ${c.halo1}, 0 0 80px ${c.halo2}`,
        animation: 'sunPulse 6s ease-in-out infinite',
        position: 'relative', zIndex: 2,
      }} />

      <style>{`
        @keyframes sunPulse      { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes sunGlow       { 0%,100%{opacity:.7} 50%{opacity:1} }
        @keyframes sunRaysRotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

// ─── Bulutlar ─────────────────────────────────────────────────────────────────
// Canvas + feTurbulence → organik, yumuşak kenarlı gerçek bulut görünümü
// Her bulut birden fazla örtüşen gaussian blob'dan oluşur
function CloudCanvas({ width, height, opacity, seed }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rng = seededRandom(seed)
    ctx.clearRect(0, 0, width, height)

    // Blob sayısı ve pozisyon — tamamen seed'e göre
    const blobCount = 6 + Math.floor(rng() * 5)
    const blobs = []

    // Ana eksen boyunca blob'ları dağıt
    for (let i = 0; i < blobCount; i++) {
      const t = i / (blobCount - 1)
      blobs.push({
        x:  width * (0.1 + t * 0.8) + (rng() - 0.5) * width * 0.15,
        y:  height * (0.45 + (rng() - 0.5) * 0.3),
        rx: width  * (0.18 + rng() * 0.14),
        ry: height * (0.30 + rng() * 0.25),
      })
    }

    blobs.forEach(b => {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, Math.max(b.rx, b.ry))
      grad.addColorStop(0,   `rgba(255,255,255,${opacity * 1.4})`)
      grad.addColorStop(0.5, `rgba(240,245,255,${opacity * 0.9})`)
      grad.addColorStop(1,   'rgba(230,240,255,0)')
      ctx.save()
      ctx.scale(b.rx / Math.max(b.rx, b.ry), b.ry / Math.max(b.rx, b.ry))
      ctx.beginPath()
      ctx.arc(
        b.x * Math.max(b.rx, b.ry) / b.rx,
        b.y * Math.max(b.rx, b.ry) / b.ry,
        Math.max(b.rx, b.ry), 0, Math.PI * 2
      )
      ctx.restore()
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.scale(1, b.ry / b.rx)
      ctx.beginPath()
      ctx.arc(0, 0, b.rx, 0, Math.PI * 2)
      ctx.restore()
      // Gerçek çizim: ellipse API
      ctx.save()
      ctx.globalAlpha = 1
      const g2 = ctx.createRadialGradient(b.x, b.y * 0.9, 0, b.x, b.y, Math.max(b.rx, b.ry))
      g2.addColorStop(0,   `rgba(255,255,255,${opacity * 1.6})`)
      g2.addColorStop(0.4, `rgba(245,248,255,${opacity * 1.1})`)
      g2.addColorStop(0.75,`rgba(235,242,255,${opacity * 0.5})`)
      g2.addColorStop(1,   'rgba(220,235,255,0)')
      ctx.fillStyle = g2
      ctx.beginPath()
      ctx.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // Hafif alt gölge — derinlik hissi
    const shadowGrad = ctx.createLinearGradient(0, height * 0.6, 0, height)
    shadowGrad.addColorStop(0, `rgba(100,120,160,${opacity * 0.18})`)
    shadowGrad.addColorStop(1, 'rgba(80,100,140,0)')
    ctx.fillStyle = shadowGrad
    ctx.fillRect(width * 0.05, height * 0.55, width * 0.9, height * 0.45)

  }, [width, height, opacity, seed])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block', filter: 'blur(8px)' }}
    />
  )
}

export function Clouds() {
  const clouds = useMemo(() => {
    const rng = seededRandom(99)
    return [
      // Arka plan — yavaş, büyük, soluk
      { top: 2,  w: 520, h: 160, opacity: 0.18, dur: 90, delay: 0,    seed: 10 },
      { top: 8,  w: 460, h: 140, opacity: 0.14, dur: 75, delay: -25,  seed: 20 },
      { top: -2, w: 580, h: 180, opacity: 0.12, dur: 110, delay: -50, seed: 30 },
      // Orta katman
      { top: 10, w: 380, h: 130, opacity: 0.22, dur: 55, delay: -12,  seed: 40 },
      { top: 15, w: 340, h: 120, opacity: 0.20, dur: 48, delay: -30,  seed: 50 },
      { top: 5,  w: 420, h: 140, opacity: 0.18, dur: 65, delay: -7,   seed: 60 },
      // Ön katman — hızlı, belirgin
      { top: 14, w: 280, h: 110, opacity: 0.30, dur: 32, delay: -8,   seed: 70 },
      { top: 20, w: 240, h: 100, opacity: 0.28, dur: 28, delay: -18,  seed: 80 },
      { top: 7,  w: 300, h: 115, opacity: 0.32, dur: 36, delay: -22,  seed: 90 },
    ].map((c, i) => ({ ...c, startPct: -(rng() * 80 + 20) }))
  }, [])

  return (
    <div style={L.layer}>
      {clouds.map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          top:      c.top + '%',
          left:     0,
          animation: `cloudDrift${i} ${c.dur}s ${c.delay}s linear infinite`,
          willChange: 'transform',
        }}>
          <CloudCanvas width={c.w} height={c.h} opacity={c.opacity} seed={c.seed} />
        </div>
      ))}
      <style>{clouds.map((c, i) => `
        @keyframes cloudDrift${i} {
          from { transform: translateX(${c.startPct}vw); }
          to   { transform: translateX(115vw); }
        }
      `).join('')}</style>
    </div>
  )
}

// ─── Yağmur ───────────────────────────────────────────────────────────────────
// Her damla kendi keyframe'ine sahip → gerçek açı + hız farkı
// Motion blur etkisi: damla uzunluğu hıza orantılı
export function Rain({ light = false, heavy = false }) {
  const count = light ? 40 : heavy ? 110 : 70

  const drops = useMemo(() => {
    const rng = seededRandom(77)
    return Array.from({ length: count }, (_, i) => {
      const layer   = i % 3
      const speed   = 0.28 + (2 - layer) * 0.1 + rng() * 0.18  // ön hızlı
      const angle   = -(14 + rng() * 10)
      // Motion blur: hız arttıkça damla uzar
      const blurLen = Math.round(speed * 120)
      return {
        left:    rng() * 105 - 5,
        startY:  -(rng() * 40 + 10),
        height:  blurLen,
        width:   layer === 2 ? 1.8 : layer === 1 ? 1.4 : 1.0,
        opacity: 0.15 + layer * 0.12 + rng() * 0.15,
        dur:     speed,
        delay:   -(rng() * 2.5),
        angle,
      }
    })
  }, [count])

  return (
    <div style={L.layer}>
      {drops.map((d, i) => (
        <div key={i} style={{
          position:    'absolute',
          left:        d.left + '%',
          top:         d.startY + '%',
          width:       d.width + 'px',
          height:      d.height + 'px',
          // Üst %20 şeffaf → alt opak: motion blur hissi
          background:  `linear-gradient(to bottom, transparent 0%, rgba(174,198,255,${d.opacity * 0.4}) 30%, rgba(174,198,255,${d.opacity}) 100%)`,
          borderRadius: '1px',
          animation:   `rd${i} ${d.dur}s ${d.delay}s linear infinite`,
          willChange:  'transform',
        }} />
      ))}
      <style>{drops.map((d, i) => `
        @keyframes rd${i} {
          from { transform: rotate(${d.angle}deg) translateY(0); }
          to   { transform: rotate(${d.angle}deg) translateY(115vh); }
        }
      `).join('')}</style>
    </div>
  )
}

// ─── Kar ─────────────────────────────────────────────────────────────────────
// Sinüs eğrisi ile gerçek sallanma hareketi
// Büyük taneler için hexagonal şekil simülasyonu (blur ile yumuşatılmış)
export function Snow() {
  const flakes = useMemo(() => {
    const rng = seededRandom(55)
    return Array.from({ length: 65 }, (_, i) => {
      const layer = i % 3
      const size  = (layer + 1) * 2.5 + rng() * 4
      return {
        startLeft: rng() * 100,
        size,
        layer,
        opacity:   0.45 + layer * 0.18 + rng() * 0.2,
        fallDur:   5 + (2 - layer) * 4 + rng() * 4,
        delay:     -(rng() * 10),
        // Yatay sway: sinüs dalga genişlik ve periyodu
        swayAmp:   12 + rng() * 28,
        swayDur:   2.5 + rng() * 3.5,
        swayPhase: rng() * Math.PI * 2,
        rotate:    rng() * 360,
        rotateDur: 4 + rng() * 8,
      }
    })
  }, [])

  return (
    <div style={L.layer}>
      {flakes.map((f, i) => (
        <div key={i} style={{
          position:    'absolute',
          left:        f.startLeft + '%',
          top:         '-20px',
          width:       f.size + 'px',
          height:      f.size + 'px',
          borderRadius: '50%',
          background:  f.size > 7
            ? `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.98) 0%, rgba(220,235,255,0.7) 55%, rgba(200,220,255,0.15) 100%)`
            : 'rgba(255,255,255,0.90)',
          opacity:     f.opacity,
          filter:      f.size > 7 ? 'blur(0.3px)' : 'none',
          // Düşme + dönme aynı element'te
          animation:   `sf${i} ${f.fallDur}s ${f.delay}s linear infinite, sr${i} ${f.rotateDur}s ${f.delay}s linear infinite`,
          willChange:  'transform',
        }} />
      ))}
      {/* Düşme: translateX sinüs eğrisi ile yatay kayma */}
      <style>{flakes.map((f, i) => {
        // Birden fazla keyframe noktasıyla gerçek sinüs yaklaşımı
        const steps = 8
        const kf = Array.from({ length: steps + 1 }, (_, k) => {
          const pct = (k / steps) * 100
          const vy  = (pct / 100) * 115  // vh
          const vx  = Math.sin((pct / 100) * Math.PI * 2 + f.swayPhase) * f.swayAmp
          return `${Math.round(pct)}% { transform: translateY(${vy.toFixed(1)}vh) translateX(${vx.toFixed(1)}px); }`
        }).join('\n')
        return `
          @keyframes sf${i} { ${kf} }
          @keyframes sr${i} {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `
      }).join('')}</style>
    </div>
  )
}

// ─── Şimşek ───────────────────────────────────────────────────────────────────
// Her çakışta JS ile yeni rastgele path üretilir (statik değil)
// Birden fazla çatal — gerçek şimşek morfolojisi
export function Lightning() {
  const svgRefs = useRef([])
  const timeouts = useRef([])

  function generateBoltPath(rng) {
    // Ana dal
    const points = [[10, 0]]
    let x = 10, y = 0
    const steps = 8 + Math.floor(rng() * 5)
    for (let i = 0; i < steps; i++) {
      x += (rng() - 0.5) * 22
      y += 300 / steps
      x = Math.max(2, Math.min(18, x))
      points.push([x, y])
    }
    // Çatal dal (ortadan)
    const forkStart = Math.floor(steps * (0.3 + rng() * 0.3))
    const forkPoints = [points[forkStart]]
    let fx = points[forkStart][0], fy = points[forkStart][1]
    const forkSteps = 3 + Math.floor(rng() * 3)
    for (let i = 0; i < forkSteps; i++) {
      fx += (rng() * 12 + 4) * (rng() > 0.5 ? 1 : -1)
      fy += (300 - fy) / (forkSteps - i) * 0.8
      fx = Math.max(0, Math.min(20, fx))
      forkPoints.push([fx, fy])
    }
    return {
      main: points.map(p => p.join(',')).join(' '),
      fork: forkPoints.map(p => p.join(',')).join(' '),
    }
  }

  function triggerBolt(svgEl, rng) {
    if (!svgEl) return
    const { main, fork } = generateBoltPath(rng)

    const mainEl = svgEl.querySelector('.bolt-main')
    const forkEl = svgEl.querySelector('.bolt-fork')
    const glowEl = svgEl.querySelector('.bolt-glow')
    if (mainEl) { mainEl.setAttribute('points', main); glowEl?.setAttribute('points', main) }
    if (forkEl)   forkEl.setAttribute('points', fork)

    // Flash sekansı: ani görün → sön → tekrar → yok
    svgEl.style.opacity = '1'
    const t1 = setTimeout(() => { svgEl.style.opacity = '0.1' }, 80)
    const t2 = setTimeout(() => { svgEl.style.opacity = '0.8' }, 130)
    const t3 = setTimeout(() => { svgEl.style.opacity = '0'   }, 220)
    return [t1, t2, t3]
  }

  useEffect(() => {
    const rng = seededRandom(Date.now() & 0xfffff)
    const intervals = svgRefs.current.map((svgEl, i) => {
      const fire = () => {
        const ts = triggerBolt(svgEl, rng)
        if (ts) timeouts.current.push(...ts)
      }
      // İlk gecikme — birbirinden farklı olsun
      const initDelay = setTimeout(fire, i * 2000 + rng() * 1500)
      const interval  = setInterval(fire, 5000 + rng() * 7000)
      return { initDelay, interval }
    })

    return () => {
      intervals.forEach(({ initDelay, interval }) => {
        clearTimeout(initDelay)
        clearInterval(interval)
      })
      timeouts.current.forEach(clearTimeout)
    }
  }, [])

  const boltPositions = [22, 50, 74]

  return (
    <>
      {/* Genel alan aydınlanması */}
      <div style={{
        ...L.layer,
        background: 'rgba(180,205,255,0.75)',
        opacity: 0,
        zIndex: 5,
        animation: 'skyFlash 8s 0.5s infinite',
        transition: 'opacity 0.05s',
      }} />

      {/* Bireysel şimşek dalları */}
      <div style={{ ...L.layer, zIndex: 6 }}>
        {boltPositions.map((pos, i) => (
          <svg
            key={i}
            ref={el => svgRefs.current[i] = el}
            style={{
              position: 'absolute',
              left:     pos + '%',
              top:      0,
              width:    '24px',
              height:   '65vh',
              overflow: 'visible',
              opacity:  0,
              transition: 'opacity 0.04s',
              filter:   'drop-shadow(0 0 6px rgba(180,210,255,0.9))',
            }}
            viewBox="0 0 20 300"
          >
            {/* Glow katmanı (kalın, bulanık) */}
            <polyline className="bolt-glow"
              points="10,0 5,75 13,95 3,190 14,210 7,300"
              fill="none" stroke="rgba(200,225,255,0.4)"
              strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Ana dal */}
            <polyline className="bolt-main"
              points="10,0 5,75 13,95 3,190 14,210 7,300"
              fill="none" stroke="rgba(220,235,255,0.95)"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Parlak iç çizgi */}
            <polyline className="bolt-main"
              points="10,0 5,75 13,95 3,190 14,210 7,300"
              fill="none" stroke="rgba(255,255,255,0.9)"
              strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Çatal */}
            <polyline className="bolt-fork"
              points="10,100 16,145 12,180"
              fill="none" stroke="rgba(210,228,255,0.7)"
              strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        ))}
      </div>

      <style>{`
        @keyframes skyFlash {
          0%,87%,100% { opacity:0; }
          88%          { opacity:.5; }
          89%          { opacity:0; }
          91%          { opacity:.25; }
          92%          { opacity:0; }
        }
      `}</style>
    </>
  )
}

// ─── Sis / Pus ────────────────────────────────────────────────────────────────
// Çok katmanlı, farklı hızlarda kayan sis şeritleri
// Wispy: her katman biraz farklı yükseklikte ve opaklıkta
export function Mist({ dense = false }) {
  const layers = useMemo(() => {
    const rng = seededRandom(11)
    const count = dense ? 8 : 5
    return Array.from({ length: count }, (_, i) => ({
      top:      5 + i * (dense ? 11 : 17),
      opacity:  (dense ? 0.14 : 0.08) + rng() * 0.07,
      dur:      22 + rng() * 25,
      delay:    -(rng() * 18),
      height:   50 + rng() * 90,
      // Her katman biraz farklı kayar — paralaks
      dir:      i % 2 === 0 ? 1 : -1,
    }))
  }, [dense])

  return (
    <div style={L.layer}>
      {layers.map((m, i) => (
        <div key={i} style={{
          position: 'absolute',
          left:     '-15%',
          top:      m.top + '%',
          width:    '130%',
          height:   m.height + 'px',
          // Wispy kenar için çift gradient
          background: i % 3 === 0
            ? `radial-gradient(ellipse 70% 50% at 40% 50%, rgba(210,218,228,1) 0%, transparent 100%)`
            : `linear-gradient(to right, transparent 0%, rgba(205,215,225,1) 20%, rgba(208,217,226,1) 60%, rgba(200,212,222,1) 80%, transparent 100%)`,
          opacity:  m.opacity,
          filter:   `blur(${dense ? 22 : 16}px)`,
          animation: `mist${i} ${m.dur}s ${m.delay}s ease-in-out infinite`,
        }} />
      ))}
      <style>{layers.map((m, i) => `
        @keyframes mist${i} {
          0%   { transform: translateX(0)          scaleY(1);    opacity: ${m.opacity}; }
          33%  { transform: translateX(${m.dir * 3}%) scaleY(1.1); opacity: ${(m.opacity * 1.3).toFixed(3)}; }
          66%  { transform: translateX(${m.dir * 6}%) scaleY(0.95); opacity: ${(m.opacity * 0.85).toFixed(3)}; }
          100% { transform: translateX(0)          scaleY(1);    opacity: ${m.opacity}; }
        }
      `).join('')}</style>
    </div>
  )
}

// ─── Rüzgar ───────────────────────────────────────────────────────────────────
// Değişken uzunluk + eğrisel hareket ile daha organik
// Fırtınalı havada daha yoğun ve daha hızlı
export function Wind({ weather }) {
  const isStormy = ['Rain', 'Thunderstorm', 'Drizzle'].includes(weather)
  const count    = isStormy ? 18 : 8

  const lines = useMemo(() => {
    const rng = seededRandom(66)
    return Array.from({ length: count }, (_, i) => ({
      top:     rng() * 92,
      width:   30 + rng() * (isStormy ? 180 : 130),
      opacity: isStormy ? 0.06 + rng() * 0.09 : 0.03 + rng() * 0.05,
      dur:     isStormy ? 1.5 + rng() * 3 : 3 + rng() * 6,
      delay:   -(rng() * 8),
      thick:   rng() > 0.65 ? 1.5 : 1,
      curve:   (rng() - 0.5) * 12,  // dikey sapma
    }))
  }, [count])

  return (
    <div style={L.layer}>
      {lines.map((l, i) => (
        <div key={i} style={{
          position:     'absolute',
          left:         '-20%',
          top:          l.top + '%',
          width:        l.width + 'px',
          height:       l.thick + 'px',
          background:   `linear-gradient(to right, transparent 0%, rgba(255,255,255,0.65) 30%, rgba(255,255,255,0.65) 70%, transparent 100%)`,
          borderRadius: '2px',
          opacity:      l.opacity,
          animation:    `wl${i} ${l.dur}s ${l.delay}s linear infinite`,
          willChange:   'transform',
        }} />
      ))}
      <style>{lines.map((l, i) => `
        @keyframes wl${i} {
          from { transform: translateX(0)      translateY(0); }
          50%  { transform: translateX(60vw)   translateY(${l.curve}px); }
          to   { transform: translateX(125vw)  translateY(0); }
        }
      `).join('')}</style>
    </div>
  )
}