// WeatherEffects.jsx
// Lightning.jsx, NightStars.jsx, Wind.jsx artık ayrı dosya gerekmez.
// Hepsini buradan export edebilirsin ya da sadece WeatherEffects kullanırsın.

import { useMemo } from 'react'

// ─── Sabit seed'li rastgele sayı (her render'da farklı konum olmasın) ───────
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ─── Ana bileşen ─────────────────────────────────────────────────────────────
export default function WeatherEffects({ weather, time }) {
  return (
    <>
      {/* Arka plan katmanları önce */}
      {time === 'night' && <NightStars />}
      {weather === 'Clear'        && <Sun time={time} />}
      {weather === 'Clouds'       && <Clouds />}
      {weather === 'Rain'         && <Rain />}
      {weather === 'Drizzle'      && <Rain light />}
      {weather === 'Snow'         && <Snow />}
      {weather === 'Thunderstorm' && <><Rain heavy /><Lightning /></>}
      {weather === 'Mist'         && <Mist />}
      {weather === 'Fog'          && <Mist dense />}
      {/* Rüzgar her zaman var, hafif */}
      <Wind weather={weather} />
    </>
  )
}

// ─── Yıldızlar ───────────────────────────────────────────────────────────────
export function NightStars() {
  const stars = useMemo(() => {
    const rng = seededRandom(42)
    return Array.from({ length: 120 }, (_, i) => ({
      left:     rng() * 100,
      top:      rng() * 85,
      size:     rng() * 2 + 1,           // 1–3px
      dur:      rng() * 3 + 1.5,         // 1.5–4.5s titreşim
      delay:    rng() * 4,
      opacity:  rng() * 0.6 + 0.2,
    }))
  }, [])

  return (
    <div style={L.layer}>
      {stars.map((s, i) => (
        <div key={i} style={{
          position:        'absolute',
          left:            s.left + '%',
          top:             s.top  + '%',
          width:           s.size + 'px',
          height:          s.size + 'px',
          borderRadius:    '50%',
          background:      s.size > 2.2
            ? 'radial-gradient(circle, #fff 30%, rgba(200,220,255,0.3) 100%)'
            : '#fff',
          boxShadow:       s.size > 2.2 ? '0 0 4px rgba(200,220,255,0.8)' : 'none',
          opacity:         s.opacity,
          animation:       `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}
      <style>{`
        @keyframes twinkle {
          0%,100% { opacity: var(--base-op, 0.3); transform: scale(1); }
          50%      { opacity: 1;                   transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}

// ─── Güneş ───────────────────────────────────────────────────────────────────
export function Sun({ time }) {
  const colors = {
    morning: { core: '#fff8e0', mid: '#ffcc44', outer: '#ff8800', glow: 'rgba(255,160,0,0.45)' },
    day:     { core: '#ffffff', mid: '#ffe566', outer: '#ffcc00', glow: 'rgba(255,210,0,0.40)' },
    evening: { core: '#ffe0b0', mid: '#ff9933', outer: '#cc4400', glow: 'rgba(220,100,0,0.50)' },
    night:   null,
  }
  const c = colors[time] || colors.day
  if (!c) return null

  const rays = Array.from({ length: 12 }, (_, i) => ({
    angle: i * 30,
    length: 55 + (i % 3) * 15,
    width:  2  + (i % 2),
  }))

  return (
    <div style={{ position: 'fixed', top: '70px', right: '90px', zIndex: 1, pointerEvents: 'none' }}>
      {/* Işınlar */}
      <div style={{ position: 'absolute', width: 120, height: 120, top: 0, left: 0, animation: 'sunRaysRotate 18s linear infinite' }}>
        {rays.map((r, i) => (
          <div key={i} style={{
            position:        'absolute',
            top:             '50%',
            left:            '50%',
            width:           r.length + 'px',
            height:          r.width  + 'px',
            background:      `linear-gradient(to right, ${c.glow}, transparent)`,
            transformOrigin: '0 50%',
            transform:       `rotate(${r.angle}deg)`,
            opacity:         0.7,
            borderRadius:    '2px',
          }} />
        ))}
      </div>

      {/* Dış parıltı */}
      <div style={{
        position:     'absolute',
        width:        160,
        height:       160,
        top:          -20,
        left:         -20,
        borderRadius: '50%',
        background:   `radial-gradient(circle, ${c.glow} 0%, transparent 70%)`,
        animation:    'sunGlow 4s ease-in-out infinite',
      }} />

      {/* Güneş gövdesi */}
      <div style={{
        width:        120,
        height:       120,
        borderRadius: '50%',
        background:   `radial-gradient(circle, ${c.core} 0%, ${c.mid} 45%, ${c.outer} 100%)`,
        boxShadow:    `0 0 60px ${c.glow}, 0 0 120px ${c.glow}`,
        animation:    'sunPulse 5s ease-in-out infinite',
        position:     'relative',
        zIndex:       2,
      }} />

      <style>{`
        @keyframes sunPulse       { 0%,100%{transform:scale(1)}   50%{transform:scale(1.06)} }
        @keyframes sunGlow        { 0%,100%{opacity:.6}           50%{opacity:1} }
        @keyframes sunRaysRotate  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

// ─── Bulutlar ─────────────────────────────────────────────────────────────────
// SVG tabanlı gerçekçi bulut şekilleri, paralaks katmanlar
const CLOUD_SHAPES = [
  // [cx, cy, rx, ry] ellipsis dizisi — her bulut birden fazla elips
  [[60,40,55,38],[30,52,32,26],[95,52,35,28],[120,48,28,22]],
  [[70,45,65,42],[25,58,28,22],[110,55,38,30],[145,50,25,20]],
  [[55,38,48,35],[20,50,26,20],[85,48,32,26],[108,44,22,18]],
  [[80,50,70,45],[30,62,30,24],[120,60,40,32],[160,55,28,22]],
]

function CloudSVG({ shapeIdx = 0, opacity = 0.18, fill = 'white' }) {
  const ellipses = CLOUD_SHAPES[shapeIdx % CLOUD_SHAPES.length]
  const maxX = Math.max(...ellipses.map(([cx,,rx]) => cx + rx))
  const maxY = Math.max(...ellipses.map(([,cy,,ry]) => cy + ry))
  return (
    <svg viewBox={`0 0 ${maxX + 10} ${maxY + 10}`} width={maxX + 10} height={maxY + 10}
      style={{ display: 'block' }}>
      <filter id="blur-cloud">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      {/* Yumuşak gölge katmanı */}
      <g filter="url(#blur-cloud)" opacity={0.4}>
        {ellipses.map(([cx, cy, rx, ry], i) => (
          <ellipse key={i} cx={cx} cy={cy + 6} rx={rx * 0.9} ry={ry * 0.5}
            fill="rgba(0,0,0,0.25)" />
        ))}
      </g>
      {/* Ana bulut */}
      {ellipses.map(([cx, cy, rx, ry], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} opacity={opacity} />
      ))}
    </svg>
  )
}

export function Clouds() {
  const clouds = useMemo(() => {
    const rng = seededRandom(99)
    return [
      // Arka plan — büyük, soluk, yavaş
      { top: 4,  scale: 2.2, opacity: 0.07, dur: 80, delay: 0,    shape: 3 },
      { top: 10, scale: 1.8, opacity: 0.08, dur: 65, delay: -20,  shape: 1 },
      { top: 3,  scale: 2.4, opacity: 0.06, dur: 95, delay: -40,  shape: 2 },
      // Orta katman
      { top: 8,  scale: 1.4, opacity: 0.12, dur: 50, delay: -10,  shape: 0 },
      { top: 14, scale: 1.2, opacity: 0.13, dur: 42, delay: -30,  shape: 3 },
      { top: 6,  scale: 1.5, opacity: 0.11, dur: 58, delay: -5,   shape: 1 },
      // Ön katman — küçük, belirgin, hızlı
      { top: 12, scale: 0.9, opacity: 0.20, dur: 30, delay: -8,   shape: 2 },
      { top: 18, scale: 0.8, opacity: 0.18, dur: 26, delay: -15,  shape: 0 },
      { top: 5,  scale: 1.0, opacity: 0.22, dur: 34, delay: -22,  shape: 3 },
    ].map((c, i) => ({ ...c, startX: rng() * -100 - 50 }))
  }, [])

  return (
    <div style={L.layer}>
      {clouds.map((c, i) => (
        <div key={i} style={{
          position:        'absolute',
          top:             c.top + '%',
          left:            0,
          transform:       `scale(${c.scale})`,
          transformOrigin: 'top left',
          animation:       `cloudDrift${i} ${c.dur}s ${c.delay}s linear infinite`,
          willChange:      'transform',
        }}>
          <CloudSVG shapeIdx={c.shape} opacity={c.opacity} />
        </div>
      ))}
      <style>{clouds.map((c, i) => `
        @keyframes cloudDrift${i} {
          from { transform: scale(${c.scale}) translateX(${c.startX}vw); }
          to   { transform: scale(${c.scale}) translateX(120vw); }
        }
      `).join('')}</style>
    </div>
  )
}

// ─── Yağmur ───────────────────────────────────────────────────────────────────
export function Rain({ light = false, heavy = false }) {
  const count   = light ? 35 : heavy ? 100 : 65
  const drops   = useMemo(() => {
    const rng = seededRandom(77)
    return Array.from({ length: count }, (_, i) => {
      const layer = i % 3  // 0=arka, 1=orta, 2=ön
      return {
        left:    rng() * 100,
        top:     rng() * -30,               // ekranın üstünden başlar
        height:  (layer + 1) * 8 + rng() * 12,   // 8-36px
        width:   layer === 2 ? 2 : 1.5,
        opacity: 0.2 + layer * 0.15 + rng() * 0.2,
        dur:     0.35 + (2 - layer) * 0.15 + rng() * 0.2,
        delay:   rng() * -2,
        angle:   -12 - rng() * 8,           // -12 ile -20 derece arası
      }
    })
  }, [count])

  return (
    <div style={L.layer}>
      {drops.map((d, i) => (
        <div key={i} style={{
          position:        'absolute',
          left:            d.left + '%',
          top:             d.top + '%',
          width:           d.width + 'px',
          height:          d.height + 'px',
          background:      `linear-gradient(to bottom, transparent, rgba(180,200,255,${d.opacity}))`,
          borderRadius:    '2px',
          transform:       `rotate(${d.angle}deg)`,
          animation:       `rainFall ${d.dur}s ${d.delay}s linear infinite`,
          willChange:      'transform',
        }} />
      ))}
      <style>{`
        @keyframes rainFall {
          from { transform: rotate(${drops[0]?.angle ?? -15}deg) translateY(-10px); }
          to   { transform: rotate(${drops[0]?.angle ?? -15}deg) translateY(110vh); }
        }
      `}</style>
      {/* Her damla kendi açısında düşsün */}
      <style>{drops.map((d, i) => `
        div[data-rain="${i}"] {
          animation: rainFall${i} ${d.dur}s ${d.delay}s linear infinite;
        }
        @keyframes rainFall${i} {
          from { transform: rotate(${d.angle}deg) translateY(-10px); }
          to   { transform: rotate(${d.angle}deg) translateY(110vh); }
        }
      `).join('')}</style>
      {/* data-rain override */}
      <div style={{ display: 'none' }}>
        {drops.map((d, i) => (
          <div key={i} data-rain={i} />
        ))}
      </div>
    </div>
  )
}

// ─── Kar ─────────────────────────────────────────────────────────────────────
export function Snow() {
  const flakes = useMemo(() => {
    const rng = seededRandom(55)
    return Array.from({ length: 60 }, (_, i) => {
      const layer = i % 3
      return {
        left:    rng() * 100,
        size:    (layer + 1) * 3 + rng() * 4,   // 3-13px
        opacity: 0.4 + layer * 0.2 + rng() * 0.2,
        dur:     4 + (2 - layer) * 3 + rng() * 3, // ön yavaş, arka hızlı
        delay:   rng() * -8,
        sway:    20 + rng() * 30,               // sallanma genişliği
        swayDur: 3 + rng() * 4,
      }
    })
  }, [])

  return (
    <div style={L.layer}>
      {flakes.map((f, i) => (
        <div key={i} style={{
          position:   'absolute',
          left:       f.left + '%',
          top:        '-20px',
          width:      f.size + 'px',
          height:     f.size + 'px',
          borderRadius: '50%',
          background: f.size > 8
            ? 'radial-gradient(circle, rgba(255,255,255,0.95) 40%, rgba(200,230,255,0.4) 100%)'
            : 'rgba(255,255,255,0.88)',
          boxShadow:  f.size > 8 ? '0 0 4px rgba(200,230,255,0.6)' : 'none',
          opacity:    f.opacity,
          animation:  `snowFall${i} ${f.dur}s ${f.delay}s linear infinite, snowSway${i} ${f.swayDur}s ${f.delay}s ease-in-out infinite`,
        }} />
      ))}
      <style>{flakes.map((f, i) => `
        @keyframes snowFall${i} {
          from { transform: translateY(0) translateX(0); }
          to   { transform: translateY(110vh) translateX(${f.sway * (Math.sin(i) > 0 ? 1 : -1)}px); }
        }
        @keyframes snowSway${i} {
          0%,100% { margin-left: 0; }
          50%     { margin-left: ${f.sway}px; }
        }
      `).join('')}</style>
    </div>
  )
}

// ─── Şimşek ───────────────────────────────────────────────────────────────────
export function Lightning() {
  const bolts = useMemo(() => {
    const rng = seededRandom(33)
    return Array.from({ length: 3 }, (_, i) => ({
      left:  20 + rng() * 60,
      dur:   6 + rng() * 8,
      delay: rng() * 6,
    }))
  }, [])

  return (
    <>
      {/* Genel flash */}
      <div style={{
        ...L.layer,
        background: 'rgba(180,200,255,0.85)',
        animation:  'lightningFlash 7s 0s infinite',
        zIndex:     5,
      }} />
      {/* SVG şimşek çakmaları */}
      <div style={{ ...L.layer, zIndex: 6 }}>
        {bolts.map((b, i) => (
          <svg key={i}
            style={{
              position:  'absolute',
              left:      b.left + '%',
              top:       0,
              width:     '3px',
              height:    '60vh',
              overflow:  'visible',
              animation: `boltFlash ${b.dur}s ${b.delay}s infinite`,
              opacity:   0,
            }}
            viewBox="0 0 20 300"
          >
            <polyline
              points="10,0 4,80 14,100 2,200 16,220 6,300"
              fill="none"
              stroke="rgba(220,235,255,0.95)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="10,0 4,80 14,100 2,200 16,220 6,300"
              fill="none"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ))}
      </div>
      <style>{`
        @keyframes lightningFlash {
          0%,88%,100%  { opacity: 0; }
          89%           { opacity: .6; }
          90%           { opacity: 0; }
          92%           { opacity: .3; }
          93%           { opacity: 0; }
        }
        @keyframes boltFlash {
          0%,88%,100%  { opacity: 0; }
          89%           { opacity: 1; }
          90%           { opacity: 0; }
          92%           { opacity: .6; }
          93%           { opacity: 0; }
        }
      `}</style>
    </>
  )
}

// ─── Sis / Pus ────────────────────────────────────────────────────────────────
export function Mist({ dense = false }) {
  const layers = useMemo(() => {
    const rng = seededRandom(11)
    return Array.from({ length: dense ? 6 : 4 }, (_, i) => ({
      top:     10 + i * (dense ? 12 : 16),
      opacity: (dense ? 0.12 : 0.07) + rng() * 0.06,
      dur:     20 + rng() * 20,
      delay:   rng() * -15,
      height:  60 + rng() * 80,
    }))
  }, [dense])

  return (
    <div style={L.layer}>
      {layers.map((m, i) => (
        <div key={i} style={{
          position:   'absolute',
          left:       '-10%',
          top:        m.top + '%',
          width:      '120%',
          height:     m.height + 'px',
          background: 'linear-gradient(to right, transparent 0%, rgba(200,210,220,1) 30%, rgba(200,210,220,1) 70%, transparent 100%)',
          opacity:    m.opacity,
          filter:     'blur(18px)',
          animation:  `mistDrift${i} ${m.dur}s ${m.delay}s ease-in-out infinite`,
        }} />
      ))}
      <style>{layers.map((m, i) => `
        @keyframes mistDrift${i} {
          0%,100% { transform: translateX(0);   opacity: ${m.opacity}; }
          50%     { transform: translateX(5%); opacity: ${m.opacity * 1.4}; }
        }
      `).join('')}</style>
    </div>
  )
}

// ─── Rüzgar ───────────────────────────────────────────────────────────────────
export function Wind({ weather }) {
  const isWindy = ['Rain', 'Thunderstorm', 'Drizzle'].includes(weather)
  const count   = isWindy ? 14 : 7

  const lines = useMemo(() => {
    const rng = seededRandom(66)
    return Array.from({ length: count }, (_, i) => ({
      top:     rng() * 90,
      width:   40 + rng() * 120,
      opacity: 0.04 + rng() * 0.06,
      dur:     3  + rng() * 5,
      delay:   rng() * -6,
      thick:   rng() > 0.7 ? 2 : 1,
    }))
  }, [count])

  return (
    <div style={L.layer}>
      {lines.map((l, i) => (
        <div key={i} style={{
          position:     'absolute',
          left:         '-15%',
          top:          l.top + '%',
          width:        l.width + 'px',
          height:       l.thick + 'px',
          background:   'linear-gradient(to right, transparent, rgba(255,255,255,0.7), transparent)',
          borderRadius: '2px',
          opacity:      l.opacity,
          animation:    `windLine ${l.dur}s ${l.delay}s linear infinite`,
        }} />
      ))}
      <style>{`
        @keyframes windLine {
          from { transform: translateX(0); }
          to   { transform: translateX(120vw); }
        }
      `}</style>
    </div>
  )
}

// ─── Paylaşılan stil ─────────────────────────────────────────────────────────
const L = {
  layer: {
    position:      'fixed',
    inset:         0,
    pointerEvents: 'none',
    zIndex:        0,
    overflow:      'hidden',
  },
}