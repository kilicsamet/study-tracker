import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminDashboard from './pages/AdminDashboard'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'

function Guard() {
  const { user, role, loading } = useAuth()

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px' }}>
      <span style={{ fontSize:'40px', animation:'float 2s ease-in-out infinite', display:'block' }}>📚</span>
      <p style={{ color:'var(--text3)', fontSize:'14px' }}>Yükleniyor…</p>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </div>
  )

  if (!user)              return <Navigate to="/login" replace />
  if (role === 'admin')   return <Navigate to="/admin" replace />
  if (role === 'student') return <Navigate to="/app"   replace />

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px' }}>
      <span style={{ fontSize:'40px' }}>🚫</span>
      <p style={{ color:'var(--text2)', fontSize:'15px' }}>Bu hesabın erişim yetkisi yok.</p>
      <button onClick={() => import('./firebase').then(m => m.auth.signOut())}
        style={{ background:'var(--rose-dim)', color:'var(--rose)', border:'1px solid rgba(232,130,154,.3)', borderRadius:'10px', padding:'10px 20px', fontSize:'14px', cursor:'pointer' }}>
        Çıkış Yap
      </button>
    </div>
  )
}

function AuthedRedirect({ children }) {
  const { user, role, loading } = useAuth()
  if (loading) return null
  if (user && role === 'admin')   return <Navigate to="/admin" replace />
  if (user && role === 'student') return <Navigate to="/app"   replace />
  return children
}

function RequireRole({ role, children }) {
  const { user, role: userRole, loading } = useAuth()
  if (loading) return null
  if (!user)             return <Navigate to="/login" replace />
  if (userRole !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthedRedirect><LoginPage /></AuthedRedirect>} />
          <Route path="/app"   element={<RequireRole role="student"><StudentDashboard /></RequireRole>} />
          <Route path="/admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
          <Route path="*"      element={<Guard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}