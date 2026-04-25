import React from 'react'
import { useAppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

const Menu: React.FC = () => {
  const { user } = useAppContext()
  const navigate = useNavigate()

  return (
    <div className="menu-body">
      <div className="page-title">Main Menu</div>
      <div className="menu-grid">
        <button className="menu-card" onClick={() => navigate('/docchat')}>
          <div className="menu-card-icon blue">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a5fa8" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div className="menu-card-text">
            <h3>Document Chat</h3>
            <p>Chat with plant manuals and documentation by discipline</p>
          </div>
        </button>
        <button className="menu-card" onClick={() => navigate('/topology')}>
          <div className="menu-card-icon green">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a7a50" strokeWidth="2"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="5.5" y2="16"/><line x1="12" y1="8" x2="18.5" y2="16"/><line x1="7" y1="19" x2="17" y2="19"/></svg>
          </div>
          <div className="menu-card-text">
            <h3>Plant Topology</h3>
            <p>View machines and their connections in the plant</p>
          </div>
        </button>
        {user?.role === 'admin' && (
          <button className="menu-card admin-only" onClick={() => navigate('/dashboard')} style={{ borderColor: 'rgba(94,61,179,0.3)' }}>
            <div className="menu-card-icon purple">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#5e3db3" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </div>
            <div className="menu-card-text">
              <h3>OT Dashboard <span style={{ fontSize: '10px', background: 'var(--purple-bg)', color: 'var(--purple)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, marginLeft: '4px' }}>ADMIN</span></h3>
              <p>Work orders dashboard — tickets automáticos, tiempos inicio/cierre, KPIs de mantenimiento</p>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

export default Menu
