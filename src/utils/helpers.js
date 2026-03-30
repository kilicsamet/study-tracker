export function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 9)  return { emoji:'🌅', text:'Günaydın!',      sub:'Harika bir sabah seni bekliyor.' }
  if (h >= 9  && h < 12) return { emoji:'☀️', text:'Günaydın!',      sub:'Sabahın enerjisiyle tam gaz!' }
  if (h >= 12 && h < 14) return { emoji:'🌻', text:'İyi öğlenler!',  sub:'Öğle molanın ardından devam.' }
  if (h >= 14 && h < 17) return { emoji:'🍵', text:'Kolay gelsin!',  sub:'Öğleden sonra odak zamanı.' }
  if (h >= 17 && h < 20) return { emoji:'🌆', text:'İyi akşamlar!',  sub:'Günün son koşusundasın!' }
  if (h >= 20 && h < 23) return { emoji:'🌙', text:'İyi geceler!',   sub:'Gece enerjinle parlıyorsun.' }
  return                         { emoji:'⭐', text:'Gece kuşu!',     sub:'Geç saatte bile çalışmak cesaret ister.' }
}

export const START_MESSAGES = [
  'Odaklan, başarıya bir adım daha yakınsın. 💪',
  'Bugün ne kadar ekmek ekersen, yarın o kadar biçersin. 🌾',
  'Her dakika bir yatırım. Hadi başlayalım! 🚀',
  'Zor olan başlamak. Başladın, yarısı bitti! 🎯',
  'Bugünün emeği yarının özgürlüğü! 🦋',
]

export const BREAK_MESSAGES = [
  'Bir saati tamamladın! Beynin rest modunu seviyor. 🧘‍♀️',
  'Dur bir nefes al — kısa mola mucize yaratır. ☕',
  'Gözlerini dinlendir, su iç, esne. Hazır ol! 💧',
  'Her saat başı mola vermek verimliliği artırır. ✅',
]

export const DONE_MESSAGES = [
  '🎉 MÜTHIIŞ! Günlük hedefe ulaştın!',
  '✨ Bugün kendini geçtin!',
  '🏆 Hedef tamamlandı — gururla dinlen!',
  '🌟 Tam isabet. Aferin sana!',
]

export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export function fmtHMS(sec) {
  sec = Math.max(0, Math.floor(sec))
  const h = Math.floor(sec/3600)
  const m = Math.floor((sec%3600)/60)
  const s = sec%60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export function fmtHM(sec) {
  sec = Math.max(0, Math.floor(sec))
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60)
  if (h === 0) return `${m} dk`
  if (m === 0) return `${h} saat`
  return `${h} saat ${m} dk`
}

export function fmtDate(dateKey) {
  const [y,m,d] = dateKey.split('-').map(Number)
  return new Date(y, m-1, d).toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric', weekday:'long' })
}

export const TARGET_FULL  = Number(import.meta.env.VITE_TARGET_FULL)  || 21600
export const TARGET_HALF  = Number(import.meta.env.VITE_TARGET_HALF)  || 7200
export const BREAK_SECS   = Number(import.meta.env.VITE_BREAK_SECS)   || 600
export const SNOOZE_SECS  = Number(import.meta.env.VITE_SNOOZE_SECS)  || 900

export const TARGETS = {
  full:    { label: '📚 Tam gün (6 saat)',  seconds: TARGET_FULL },
  half:    { label: '⚡ Kısa gün (2 saat)', seconds: TARGET_HALF },
  holiday: { label: '🏖 Tatil',             seconds: 0           },
}