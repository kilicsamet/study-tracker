// HTML5 Audio ile ses — daha güvenilir
function beep(frequency, duration, volume, type) {
  return new Promise(resolve => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = type || 'sine'
      oscillator.frequency.value = frequency
      gainNode.gain.value = volume || 0.3

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)

      oscillator.onended = () => {
        ctx.close()
        resolve()
      }
    } catch(e) {
      resolve()
    }
  })
}

export function initAudio() {
  // ilk tıklamada ses iznini aç
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ctx.resume().then(() => ctx.close())
  } catch(e) {}
}

// 🔔 Saat başı çan — 3 kez tekrar eder
export async function playBell() {
  const notes = [
    [880, 0.15],
    [784, 0.15],
    [880, 0.15],
    [0,   0.1],
    [880, 0.15],
    [784, 0.15],
    [880, 0.15],
    [0,   0.1],
    [880, 0.15],
    [784, 0.15],
    [1047, 0.4],
  ]
  for (const [freq, dur] of notes) {
    if (freq === 0) {
      await new Promise(r => setTimeout(r, dur * 1000))
    } else {
      await beep(freq, dur, 0.3, 'sine')
      await new Promise(r => setTimeout(r, 20))
    }
  }
}

// ✅ Hedef tamamlandı — neşeli melodi
export async function playSuccess() {
  const melody = [
    [523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.12],
    [0, 0.05],
    [784, 0.1], [1047, 0.1], [1319, 0.4],
  ]
  for (const [freq, dur] of melody) {
    if (freq === 0) {
      await new Promise(r => setTimeout(r, dur * 1000))
    } else {
      await beep(freq, dur, 0.25, 'sine')
      await new Promise(r => setTimeout(r, 15))
    }
  }
}

// ▶ Başlat
export async function playStart() {
  await beep(440, 0.1, 0.2, 'sine')
  await new Promise(r => setTimeout(r, 30))
  await beep(660, 0.1, 0.2, 'sine')
  await new Promise(r => setTimeout(r, 30))
  await beep(880, 0.2, 0.2, 'sine')
}

// ⏸ Durdur
export async function playStop() {
  await beep(880, 0.1, 0.2, 'sine')
  await new Promise(r => setTimeout(r, 30))
  await beep(660, 0.1, 0.2, 'sine')
  await new Promise(r => setTimeout(r, 30))
  await beep(440, 0.2, 0.2, 'sine')
}

// ☕ Mola bitti
export async function playBreakEnd() {
  await beep(523, 0.15, 0.25, 'triangle')
  await new Promise(r => setTimeout(r, 30))
  await beep(659, 0.15, 0.25, 'triangle')
  await new Promise(r => setTimeout(r, 30))
  await beep(784, 0.3, 0.25, 'triangle')
}