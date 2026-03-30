import { onAuthStateChanged, signOut } from 'firebase/auth'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../firebase'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)
  const [role, setRole] = useState(null)

  const ADMIN   = import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase()
  const STUDENT = import.meta.env.VITE_STUDENT_EMAIL?.toLowerCase()

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u)
      if (!u) return setRole(null)
      const em = u.email?.toLowerCase()
      if (em === ADMIN)   return setRole('admin')
      if (em === STUDENT) return setRole('student')
      setRole('unauthorized')
    })
  }, [])

  const logout = () => signOut(auth)

  return (
    <Ctx.Provider value={{ user, role, logout, loading: user === undefined }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)