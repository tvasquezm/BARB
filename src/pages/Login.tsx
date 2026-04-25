import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import createApiService from '../services/api'
import { User } from '../types'

const Login: React.FC = () => {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'technician' | 'admin' | 'engineer' | 'supervisor'>('technician')
  const { setUser, apiBase, setLoading, dark, setDark } = useAppContext()
  const navigate = useNavigate()

  const api = createApiService(apiBase)

  // Sincronizar tema oscuro incluso antes de entrar al Dashboard
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      document.body.dataset.theme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.body.dataset.theme = 'light'
    }
  }, [dark])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const resp = await api.auth.login(name || 'operator', password || '***', role)
      const usr: User = resp && resp.name ? { id: resp.id || String(Date.now()), name: resp.name, role: (resp.role as any) || role } : { id: String(Date.now()), name: name || 'Usuario', role }
      setUser(usr)
      // redirigir según el rol seleccionado (tercer campo)
      const dest = role === 'admin' ? '/dashboard' : '/menu'
      navigate(dest)
    } catch (err) {
      // fallback local login
      const usr: User = { id: String(Date.now()), name: name || 'Usuario', role }
      setUser(usr)
      const dest = role === 'admin' ? '/dashboard' : '/menu'
      navigate(dest)
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative" style={{ background: 'var(--bg)' }}>
      <div className="absolute top-6 right-6">
        <button className="icon-btn" onClick={() => setDark(!dark)} title="Toggle theme" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
      </div>
      <div className="login-card">
        <div className="login-icon">🏭</div>
        <div className="login-title">BARB</div>
        <div className="login-sub">Plant Maintenance System</div>
        <form onSubmit={submit}>
          <div className="form-field">
            <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Username" />
          </div>
          <div className="form-field">
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="form-input" placeholder="Password" />
          </div>
          <div className="form-field">
            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="form-select">
              <option value="technician">Technician</option>
              <option value="engineer">Engineer</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full mt-4">Login</button>
        </form>
      </div>
    </div>
  )
}

export default Login
