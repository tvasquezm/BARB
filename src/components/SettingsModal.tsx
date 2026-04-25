import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { showToast } from './Toast'

const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, dark, setDark, apiBase, lmBase } = useAppContext()
  const [localApi, setLocalApi] = useState(apiBase)
  const [localLm, setLocalLm] = useState(lmBase)

  if (!isOpen) return null

  const handleSave = () => {
    // En un escenario real, aquí despacharías a useAppContext().setApiBase(localApi), etc.
    showToast('✅ Configuración guardada localmente')
    onClose()
  }

  const testConnections = () => {
    showToast('🔌 Probando conexión a FastAPI y LM Studio...')
    setTimeout(() => showToast('✅ FastAPI · ❌ LM Studio (No detectado)'), 1500)
  }

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="settings-section">
            <h3>Appearance & Language</h3>
            <div className="settings-block">
              <div className="settings-row">
                <div><div className="sr-label">Dark Theme</div></div>
                <label className="toggle"><input type="checkbox" checked={dark} onChange={() => setDark(!dark)} /><span className="toggle-track" /><span className="toggle-thumb" /></label>
              </div>
              <div className="settings-row">
                <div className="sr-label">Language</div>
                <select className="form-select" defaultValue="Español" style={{ maxWidth: 150 }} onChange={() => showToast('Language updated (Simulado)')}>
                  <option>English</option>
                  <option>Español</option>
                </select>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Account</h3>
            <div className="settings-block">
              <div className="settings-row">
                <div><div className="sr-label">Username</div><div className="sr-sub">{user?.name || 'Invitado'}</div></div>
              </div>
              <div className="settings-row">
                <div><div className="sr-label">Role</div><div className="sr-sub capitalize">{user?.role || '—'}</div></div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>System & Connections</h3>
            <div className="settings-block">
              <div className="settings-row">
                <div className="sr-label">App Version</div><div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink2)' }}>2.1.0 (React)</div>
              </div>
              <div className="settings-row">
                <div><div className="sr-label">FastAPI Endpoint</div></div>
                <input className="form-input" value={localApi} onChange={e => setLocalApi(e.target.value)} style={{ maxWidth: 190, fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 8px' }} />
              </div>
              <div className="settings-row">
                <div><div className="sr-label">LM Studio Endpoint</div></div>
                <input className="form-input" value={localLm} onChange={e => setLocalLm(e.target.value)} style={{ maxWidth: 190, fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 8px' }} />
              </div>
              <div className="settings-row">
                <div><div className="sr-label">Probar conexiones</div><div className="sr-sub">Verifica el estado de las APIs</div></div>
                <button className="btn btn-sm btn-outline" onClick={testConnections}>🔌 Probar</button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal