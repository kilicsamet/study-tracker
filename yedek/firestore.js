import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { TARGET_FULL, TARGETS } from './helpers'

export const DEFAULT_TARGET = 'full'

// ─── Helpers ────────────────────────────────────────────────────────────────

export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

function dailyRef(key) {
  return doc(db, 'daily', key)
}

/**
 * Bir dokümanın o anki gerçek toplam süresini hesaplar.
 * activeSession varsa elapsed'i base'e ekler.
 * Gece yarısı geçişinde güvenli: elapsed max ile kesilir.
 */
function buildRunningTotal(data, capAt) {
  if (!data?.activeSession?.startedAt) {
    return data?.totalSeconds || 0
  }

  const startedAt = data.activeSession.startedAt.toDate()
  const baseTotalSeconds = data.activeSession.baseTotalSeconds ?? data.totalSeconds ?? 0

  // capAt: gece yarısı geçişinde o günün 23:59:59'una kadar say
  const now = capAt ? capAt.getTime() : Date.now()
  const elapsed = Math.max(0, Math.floor((now - startedAt.getTime()) / 1000))

  return baseTotalSeconds + elapsed
}

/**
 * Verilen doküman verisini kapatır (activeSession → null, totalSeconds yazar).
 * Hem initDaily hem de gece geçişi için kullanılır.
 * capAt: o günün son anı (gece geçişinde dünü doğru kapatmak için)
 */
async function closeActiveSession(ref, data, capAt) {
  const startedAtTs = data.activeSession.startedAt
  const startedAt = startedAtTs.toDate()
  const baseTotalSeconds = data.activeSession.baseTotalSeconds ?? data.totalSeconds ?? 0

  const now = capAt ? capAt.getTime() : Date.now()
  const elapsed = Math.max(0, Math.floor((now - startedAt.getTime()) / 1000))
  const newTotal = baseTotalSeconds + elapsed
  const target = data.target ?? TARGET_FULL

  const sessions = [
    ...(data.sessions || []),
    {
      startedAt: startedAtTs,
      endedAt: Timestamp.fromMillis(now),
      duration: elapsed,
    },
  ]

  await updateDoc(ref, {
    totalSeconds: newTotal,
    done: target > 0 ? newTotal >= target : false,
    activeSession: null,
    sessions,
    updatedAt: serverTimestamp(),
  })

  return { ...data, totalSeconds: newTotal, activeSession: null, sessions }
}

// ─── Gece Geçişi ─────────────────────────────────────────────────────────────

/**
 * Sayfa açılırken VEYA dateKey değişince çağrılır.
 * Dün (veya daha eski) açık kalan session'ları bulup kapatır.
 * Sadece öğrenci tarafından çağrılmalı.
 */
export async function closeStaleSessions(currentKey) {
  // Son 3 günü kontrol et (sayfa kapalı kalma ihtimaline karşı)
  const keys = []
  for (let i = 1; i <= 3; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    keys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    )
  }

  for (const key of keys) {
    if (key === currentKey) continue

    const ref = dailyRef(key)
    const snap = await getDoc(ref)

    if (!snap.exists()) continue

    const data = snap.data()

    if (!data.activeSession?.startedAt) continue

    // O günün gece 23:59:59'unu cap olarak ver
    const [y, m, day] = key.split('-').map(Number)
    const endOfDay = new Date(y, m - 1, day, 23, 59, 59, 999)

    await closeActiveSession(ref, data, endOfDay)
  }
}

// ─── initDaily ───────────────────────────────────────────────────────────────

/**
 * Bugünün dokümanını başlatır / varsa döndürür.
 * Eğer BUGÜNÜN dokümanında açık session varsa → canlı çalışıyor demektir,
 * KAPATMAZ, olduğu gibi döndürür. (Admin bug'ı düzeltildi)
 *
 * Eski günlerin açık session'larını kapatmak için closeStaleSession kullan.
 */
export async function initDaily(key) {
  const ref = dailyRef(key)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const d = {
      date: key,
      totalSeconds: 0,
      targetType: DEFAULT_TARGET,
      target: TARGETS[DEFAULT_TARGET].seconds,
      done: false,
      sessions: [],
      activeSession: null,
      dailyNote: '',
      dailyNoteCreatedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(ref, d)
    return d
  }

  return snap.data()
}

/**
 * Admin tarafı için: sadece dökümanı oluştur/getir, asla session kapatma.
 */
export async function ensureDaily(key) {
  return await initDaily(key)
}

export async function getDaily(key) {
  const snap = await getDoc(dailyRef(key))
  if (!snap.exists()) return null
  return snap.data()
}

// ─── Target ──────────────────────────────────────────────────────────────────

export async function setDayTarget(key, targetType) {
  const ref = dailyRef(key)
  const snap = await getDoc(ref)
  const target = TARGETS[targetType].seconds

  if (snap.exists()) {
    const current = snap.data()
    const currentTotal = current.totalSeconds || 0

    await updateDoc(ref, {
      targetType,
      target,
      done: target > 0 ? currentTotal >= target : false,
      updatedAt: serverTimestamp(),
    })
  } else {
    await setDoc(ref, {
      date: key,
      totalSeconds: 0,
      targetType,
      target,
      done: false,
      sessions: [],
      activeSession: null,
      dailyNote: '',
      dailyNoteCreatedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  return await getDaily(key)
}

// ─── Session ─────────────────────────────────────────────────────────────────

export async function startSession(key) {
  const ref = dailyRef(key)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      date: key,
      totalSeconds: 0,
      targetType: DEFAULT_TARGET,
      target: TARGETS[DEFAULT_TARGET].seconds,
      done: false,
      sessions: [],
      activeSession: {
        startedAt: Timestamp.now(),
        baseTotalSeconds: 0,
      },
      dailyNote: '',
      dailyNoteCreatedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return await getDaily(key)
  }

  const data = snap.data()

  // Zaten aktif session var, tekrar başlatma
  if (data.activeSession?.startedAt) {
    return data
  }

  const baseTotalSeconds = data.totalSeconds || 0

  await updateDoc(ref, {
    activeSession: {
      startedAt: Timestamp.now(),
      baseTotalSeconds,
    },
    updatedAt: serverTimestamp(),
  })

  return await getDaily(key)
}

/**
 * Çalışan session'ı durdurmadan checkpoint alır.
 * startedAt sıfırlanır, baseTotalSeconds güncellenir.
 * Böylece elapsed bir sonraki sync'te sıfırdan sayılır → double-count yok.
 */
export async function syncRunningSession(key) {
  const ref = dailyRef(key)
  const snap = await getDoc(ref)

  if (!snap.exists()) return null

  const data = snap.data()

  if (!data.activeSession?.startedAt) {
    return data
  }

  const newTotal = buildRunningTotal(data)
  const target = data.target ?? TARGET_FULL

  await updateDoc(ref, {
    totalSeconds: newTotal,
    done: target > 0 ? newTotal >= target : false,
    activeSession: {
      startedAt: Timestamp.now(), // sıfırla — elapsed bir daha eklenmez
      baseTotalSeconds: newTotal,
    },
    updatedAt: serverTimestamp(),
  })

  return await getDaily(key)
}

export async function stopSession(key) {
  const ref = dailyRef(key)
  const snap = await getDoc(ref)

  if (!snap.exists()) return 0

  const data = snap.data()

  if (!data.activeSession?.startedAt) {
    return data.totalSeconds || 0
  }

  const closed = await closeActiveSession(ref, data, null)
  return closed.totalSeconds
}

// ─── Daily Note ──────────────────────────────────────────────────────────────

export async function saveDailyNote(key, note) {
  const ref = dailyRef(key)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      date: key,
      totalSeconds: 0,
      targetType: DEFAULT_TARGET,
      target: TARGETS[DEFAULT_TARGET].seconds,
      done: false,
      sessions: [],
      activeSession: null,
      dailyNote: note,
      dailyNoteCreatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return await getDaily(key)
  }

  const data = snap.data()

  // Not zaten varsa üzerine yazma
  if (data?.dailyNote && String(data.dailyNote).trim() !== '') {
    return data
  }

  await updateDoc(ref, {
    dailyNote: note,
    dailyNoteCreatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return await getDaily(key)
}

// ─── Admin ───────────────────────────────────────────────────────────────────

/**
 * Tüm günleri getirir.
 * Aktif session olan günler için live total hesaplanır.
 * Admin paneli doğru değerleri görmüş olur.
 */
export async function getAllDays() {
  const q = query(collection(db, 'daily'), orderBy('date', 'desc'))
  const snap = await getDocs(q)

  return snap.docs.map((d) => {
    const data = d.data()

    // Aktif session varsa live total hesapla (admin doğru görsün)
    if (data.activeSession?.startedAt) {
      const liveTotal = buildRunningTotal(data)
      const target = data.target ?? TARGET_FULL
      return {
        ...data,
        totalSeconds: liveTotal,
        done: target > 0 ? liveTotal >= target : false,
      }
    }

    return data
  })
}

export function liveTotal(data) {
  if (!data) return 0
  return buildRunningTotal(data)
}