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

export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

function dailyRef(key) {
  return doc(db, 'daily', key)
}

function buildRunningTotal(data) {
  if (!data?.activeSession?.startedAt) {
    return data?.totalSeconds || 0
  }

  const startedAt = data.activeSession.startedAt.toDate()
  const baseTotalSeconds = data.activeSession.baseTotalSeconds ?? data.totalSeconds ?? 0
  const elapsed = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000))

  return baseTotalSeconds + elapsed
}

/**
 * Günlük kayıt yoksa oluşturur.
 * Varsa döner.
 *
 * Eğer açık kalmış activeSession varsa:
 * - arka planda geçen süreyi EKLEMEZ
 * - sadece activeSession'ı temizler
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

    return {
      ...d,
      target: TARGETS[DEFAULT_TARGET].seconds,
    }
  }

  const data = snap.data()

  if (data.activeSession?.startedAt) {
    await updateDoc(ref, {
      activeSession: null,
      updatedAt: serverTimestamp(),
    })

    return {
      ...data,
      activeSession: null,
    }
  }

  return data
}

export async function ensureDaily(key) {
  return await initDaily(key)
}

export async function getDaily(key) {
  const snap = await getDoc(dailyRef(key))
  if (!snap.exists()) return null
  return snap.data()
}

export async function setDayTarget(key, targetType) {
  const ref = dailyRef(key)
  const snap = await getDoc(ref)
  const target = TARGETS[targetType].seconds

  if (snap.exists()) {
    const current = snap.data()

    await updateDoc(ref, {
      targetType,
      target,
      done: target > 0 ? (current.totalSeconds || 0) >= target : false,
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

  const startedAtTs = data.activeSession.startedAt
  const startedAt = startedAtTs.toDate()
  const baseTotalSeconds = data.activeSession.baseTotalSeconds ?? data.totalSeconds ?? 0
  const elapsed = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000))
  const newTotal = baseTotalSeconds + elapsed
  const target = data.target ?? TARGET_FULL

  const sessions = [
    ...(data.sessions || []),
    {
      startedAt: startedAtTs,
      endedAt: Timestamp.now(),
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

  return newTotal
}

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

export function liveTotal(data) {
  if (!data) return 0
  return buildRunningTotal(data)
}

export async function getAllDays() {
  const q = query(collection(db, 'daily'), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data())
}