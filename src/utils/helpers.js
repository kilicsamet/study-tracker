export function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 9)  return { emoji:'🌅', text:'Günaydın canım!',     sub:'Bugün de bir adım daha yakınsın hayallerine. 🌸' }
  if (h >= 9  && h < 12) return { emoji:'☀️', text:'Günaydın tatlım!',    sub:'Sabahın enerjisi seninle, harika gidiyorsun!' }
  if (h >= 12 && h < 14) return { emoji:'🌻', text:'İyi öğlenler!',        sub:'Bir mola hak ettin, sonra devam — sen yaparsın!' }
  if (h >= 14 && h < 17) return { emoji:'🍵', text:'Kolay gelsin aşkım!', sub:'Öğleden sonra odak zamanı, beynin seninle! 💙' }
  if (h >= 17 && h < 20) return { emoji:'🌆', text:'İyi akşamlar!',        sub:'Günün son koşusundasın, bitiriyorsun bunu! 🏁' }
  if (h >= 20 && h < 23) return { emoji:'🌙', text:'İyi geceler canım!',   sub:'Gece enerjinle parlıyorsun, gurur duyuyorum. 🌟' }
  return                         { emoji:'⭐', text:'Gece kuşum!',          sub:'Bu saatte bile çalışmak — işte bu karakter! 💪' }
}

export const START_MESSAGES = [
  // Türkçe — motivasyon
  'Hemşirelik okumuş, şimdi KPSS\'yi de geçecek. Bu ikisi senden daha zor değil. 💙',
  'Başladın mı? O zaman yarısını atlattın zaten. Hadi! 🚀',
  'Her konu çalıştığın, seni bir adım daha öne taşıyor. Dur bakayım sana — vallahi gurur duyuyorum. 🌸',
  'Bugünün emeği, beyaz önlüklü yarının temeli. 🩺',
  'Zor olan başlamak. Başladın. Yarısı bitti, devam et! 🎯',
  'Sen hastalara nasıl umut olacaksan, bugün de bu sayfaları fethedeceksin. 💪',
  'Küçük adımlar, büyük zaferler. Bugün de bir sayfa daha. 📖',
  'Yorulsan da dur, ama bırakma. Fark var ikisi arasında. 🌙',
  'Bu sınav seni seçemiyor — sen onu seçiyorsun. Hadi başlayalım! ✨',
  'Sabır, azim, ve bir de sen. Bu üçü bir araya gelince olmayacak iş yok. 🌟',

  // İngilizce — güzel sözler araya serpiştirildi
  '"The secret of getting ahead is getting started." — Mark Twain 🚀',
  '"You are braver than you believe, stronger than you seem." — A. A. Milne 💙',
  '"It always seems impossible until it\'s done." — Nelson Mandela ✊',
  '"Dream big. Work hard. Stay humble." 🌸',
  '"She believed she could, so she did." 👑',
  '"Push yourself, because no one else is going to do it for you." 💪',
  '"Your future self is watching you right now through your memories." ⏳',
  '"Be so good they can\'t ignore you." — Steve Martin 🌟',
  '"Hard days are the best because that\'s when champions are made." 🏆',
  '"You didn\'t come this far to only come this far." 🎯',
]

export const BREAK_MESSAGES = [
  // Türkçe
  'Bir saati doldurdun! Kalk, su iç, biraz esne — beynin seni seviyor. 💧',
  'Dur bir nefes al. Kısa mola, uzun odak demek. ☕',
  'Gözlerini dinlendir. Ekrana baktın yeter, şimdi uzağa bak. 👀',
  'Hemşireler de mola hakkını bilir — şimdi senin molan! 🩺',
  'Beyin de dinlenmek istiyor canım, kulak ver ona. 🌸',
  'Her saat başı mola vermek, verimliliği %40 artırıyor. Bilim öyle söylüyor! 🔬',
  'Kalk biraz yürü, kan dolaşsın. Sonra tekrar tam gaz! 🚶‍♀️',

  // İngilizce
  '"Almost everything will work again if you unplug it for a few minutes." — Anne Lamott ☕',
  '"Rest is not idleness." — John Lubbock 🌿',
  '"Take a deep breath. It\'s just a bad moment, not a bad life." 🌬️',
  '"Recharge, refocus, restart." 🔋',
]

export const DONE_MESSAGES = [
  // Türkçe
  '🎉 MUHTEŞEM! Bugünün hedefini tamamladın! Sana bayılıyorum!',
  '🏆 Hedef tamam. Bugün kendini geçtin. Gurur duyuyorum senden!',
  '🌟 Tam isabet! Bu kararlılık seni çok ileri taşıyacak. Aferin sana!',
  '✨ Bak işte! Söylemiştim yaparsın diye. Harikasın! 💙',
  '🩺 Bir gün bu emekler meyve verecek. Bugün çok iyi iş çıkardın!',
  '🌸 Bugün de kazandın. Bu mücadeleyi seninle izlemek gurur verici!',

  // İngilizce
  '"Well done is better than well said." — Benjamin Franklin 🏆',
  '"Success is the sum of small efforts, repeated day in and day out." 🌟',
  '"You did it. Now rest, and do it again tomorrow." ✨',
  '"Champions aren\'t made in gyms. They\'re made from something they have deep inside." 💙',
]

export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export function fmtHMS(sec) {
  sec = Math.max(0, Math.floor(sec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function fmtHM(sec) {
  sec = Math.max(0, Math.floor(sec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h === 0) return `${m} dk`
  if (m === 0) return `${h} saat`
  return `${h} saat ${m} dk`
}

export function fmtDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', weekday: 'long',
  })
}

export const TARGET_FULL = Number(import.meta.env.VITE_TARGET_FULL) || 21600
export const TARGET_HALF = Number(import.meta.env.VITE_TARGET_HALF) || 7200
export const BREAK_SECS  = Number(import.meta.env.VITE_BREAK_SECS)  || 600
export const SNOOZE_SECS = Number(import.meta.env.VITE_SNOOZE_SECS) || 900

export const TARGETS = {
  full:    { label: '📚 Tam gün (6 saat)',  seconds: TARGET_FULL },
  half:    { label: '⚡ Kısa gün (2 saat)', seconds: TARGET_HALF },
  holiday: { label: '🏖 Tatil',             seconds: 0           },
}