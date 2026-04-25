import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import createApiService from '../services/api'
import { useNavigate, useLocation } from 'react-router-dom'
import SettingsModal from './SettingsModal'
import { showToast } from './Toast'

const TopBar: React.FC = () => {
  const { user, setUser, dark, setDark, apiBase, setLoading } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const api = createApiService(apiBase)

  // Sincronizar el estado oscuro de React con el DOM (para Tailwind y CSS nativo)
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      document.body.dataset.theme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.body.dataset.theme = 'light'
    }
  }, [dark])

  const handleLogout = async () => {
    setLoading(true)
    try {
      await api.auth.logout()
    } catch (_) {}
    setUser(null)
    setLoading(false)
    navigate('/login')
  }

  const toggleTheme = () => setDark(!dark)

  // Dinamismo del TopBar según la pantalla actual (replicando barb_v3.html)
  const path = location.pathname
  let title = 'Plant Maintenance'
  let showBack = true
  let backPath: string | number = '/menu'
  let badge = null
  let showStatus = false

  if (path.includes('/menu')) { showBack = false; title = 'Main Menu'; showStatus = true }
  else if (path.includes('/dashboard')) { title = 'OT Dashboard'; showStatus = true; badge = <span style={{ fontSize: '10px', background: 'var(--purple-bg)', color: 'var(--purple)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--mono)', fontWeight: 600, marginLeft: '8px' }}>ADMIN</span> }
  else if (path.includes('/docchat')) { title = 'Document Chat' }
  else if (path.includes('/debug')) { title = 'Machine Debug'; backPath = '/topology' }
  else if (path.includes('/topology')) { title = 'Plant Topology' }
  else if (path.includes('/memory')) { title = 'Machine Memory'; backPath = -1 }
  else if (path.includes('/report')) { title = 'Debug Session Report'; backPath = '/debug' }

  return (
    <div className="topbar">
      <div className="topbar-left">
        {showBack && (
          <button className="back-btn" onClick={() => typeof backPath === 'string' ? navigate(backPath) : navigate(-1)}>‹</button>
        )}
        <div className="topbar-logo">
          <span className="logo-mark">BARB</span>
        </div>
        <span className="topbar-title">{title}</span>
        {badge}
      </div>
      <div className="topbar-right">
        {showStatus && (
          <div className="status-badge" title="FastAPI Status">
            <div className="status-dot online"></div>
            <span>API</span>
          </div>
        )}
        <button className="icon-btn" onClick={() => showToast('Language: Español / English (Simulado)')} title="Language">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </button>
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
        {user && (
          <button className="icon-btn" onClick={handleLogout} title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        )}
      </div>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default TopBar
