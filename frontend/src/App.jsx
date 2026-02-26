import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import ChangePassword from './pages/ChangePassword'
import ForgotPassword from './pages/ForgotPassword'
import Community from './pages/Community'
import MovieDetails from './pages/MovieDetails'
import Startup from './pages/Startup'

function ProtectedRoute({ children, user, loading }) {
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children, user, loading }) {
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/status', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.isAuthenticated) setUser(data.user)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Startup />} />
        <Route path="/login" element={
          <PublicRoute user={user} loading={loading}>
            <Login setUser={setUser} />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute user={user} loading={loading}>
            <Signup setUser={setUser} />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={
          <ProtectedRoute user={user} loading={loading}>
            <Dashboard user={user} setUser={setUser} />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute user={user} loading={loading}>
            <Profile user={user} setUser={setUser} />
          </ProtectedRoute>
        } />
        <Route path="/edit-profile" element={
          <ProtectedRoute user={user} loading={loading}>
            <EditProfile user={user} />
          </ProtectedRoute>
        } />
        <Route path="/change-password" element={
          <ProtectedRoute user={user} loading={loading}>
            <ChangePassword user={user} />
          </ProtectedRoute>
        } />
        <Route path="/movie/:id" element={
          <ProtectedRoute user={user} loading={loading}>
            <MovieDetails user={user} />
          </ProtectedRoute>
        } />
        <Route path="/community" element={
          <ProtectedRoute user={user} loading={loading}>
            <Community user={user} />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
