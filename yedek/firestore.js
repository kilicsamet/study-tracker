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

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
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

async function createDailyIfMissing(key) {
  const ref = dailyRef(key)
  const snap = await getDoc(ref)

  if (snap.exists()) return snap.data()

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

export async function initDaily(key) {
  const ref = dailyRef(key)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    return await createDailyIfMissing(key)
  }

  const data = snap.data()

  if (data.activeSession?.startedAt) {
    const newTotal = buildRunningTotal(data)
    const target = data.target ?? TARGET_FULL
    const startedAtTs = data.activeSession.startedAt
    const elapsed = Math.max(
      0,
      Math.floor((Date.now() - startedAtTs.toDate().getTime()) / 1000)
    )

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

    return {
      ...data,
      totalSeconds: newTotal,
      activeSession: null,
      sessions,
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
    activeSession: {
      startedAt: Timestamp.now(),
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

/**
 * Gece yeni güne geçildiyse:
 * - eski günün aktif session'ını kapatır
 * - yeni gün dokümanını oluşturur
 * - isterse yeni güne aktif session başlatır
 */
export async function rolloverIfNeeded(currentKey, nextKey, shouldResume = true) {
  if (!currentKey || !nextKey || currentKey === nextKey) {
    return {
      rolled: false,
      nextDay: currentKey ? await ensureDaily(currentKey) : null,
    }
  }

  const currentRef = dailyRef(currentKey)
  const currentSnap = await getDoc(currentRef)

  if (currentSnap.exists()) {
    const currentData = currentSnap.data()

    if (currentData?.activeSession?.startedAt) {
      const startedAtTs = currentData.activeSession.startedAt
      const startedAt = startedAtTs.toDate()
      const baseTotalSeconds =
        currentData.activeSession.baseTotalSeconds ?? currentData.totalSeconds ?? 0
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000))
      const newTotal = baseTotalSeconds + elapsed
      const target = currentData.target ?? TARGET_FULL

      const sessions = [
        ...(currentData.sessions || []),
        {
          startedAt: startedAtTs,
          endedAt: Timestamp.now(),
          duration: elapsed,
        },
      ]

      await updateDoc(currentRef, {
        totalSeconds: newTotal,
        done: target > 0 ? newTotal >= target : false,
        activeSession: null,
        sessions,
        updatedAt: serverTimestamp(),
      })
    }
  }

  await createDailyIfMissing(nextKey)

  let nextDay = await getDaily(nextKey)

  if (shouldResume && nextDay && !nextDay.activeSession?.startedAt && nextDay.targetType !== 'holiday') {
    nextDay = await startSession(nextKey)
  }

  return {
    rolled: true,
    nextDay,
  }
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