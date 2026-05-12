import React, { useEffect, useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { showToast } from './Toast'
import { getTranslations, normalizeLang } from '../utils/i18n'

const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const {
    user,
    dark,
    lang,
    setDark,
    setLang,
    apiBase,
    lmBase,
    setApiBase,
    setLmBase,
  } = useAppContext()

  const t = useMemo(() => getTranslations(lang), [lang])
  const [localApi, setLocalApi] = useState(apiBase)
  const [localLm, setLocalLm] = useState(lmBase)
  const [localLang, setLocalLang] = useState(normalizeLang(lang))

  useEffect(() => {
    if (!isOpen) return
    setLocalApi(apiBase)
    setLocalLm(lmBase)
    setLocalLang(normalizeLang(lang))
  }, [apiBase, lang, lmBase, isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    const nextApi = localApi.trim()
    const nextLm = localLm.trim()

    if (nextApi) setApiBase(nextApi)
    if (nextLm) setLmBase(nextLm)
    setLang(localLang)

    showToast(t.settings.savedLocally)
    onClose()
  }

  /**
   * Realiza un "handshake" liviano contra LM Studio verificando que el servidor responde
   * al endpoint equivalente a OpenAI-compatible `GET /models`.
   *
   * - Normaliza `localLm` (trim + remueve slash final)
   * - Asegura URL absoluta (si no trae protocolo, antepone `http://`)
   * - Si `localLm` termina en `/v1` -> prueba `${base}/models`
   *   Si no -> prueba `${base}/v1/models`
   * - Aplica AbortSignal.timeout(3000) para evitar requests colgadas/stalled
   * - Usa headers para asegurar respuesta fresca y parseable
   * - Maneja errores: TimeoutError y TypeError (para logs diferenciados en dev)
   */
  const testConnections = async () => {
    showToast(t.settings.testingConnections)

    const normalizedLm = (localLm || '')
      .trim()
      .replace(/\/+$/, '') // elimina slashes finales

    if (!normalizedLm) {
      showToast(t.settings.apiOkLmOffline)
      return
    }

    const baseUrl = /^https?:\/\//i.test(normalizedLm) ? normalizedLm : `http://${normalizedLm}`
    const handshakeUrl = baseUrl.includes('/v1')
      ? baseUrl.endsWith('/v1') ? `${baseUrl}/models` : baseUrl.replace(/\/v1\/+$/i, '') + '/v1/models'
      : `${baseUrl}/v1/models`

    const acceptHeaders = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
    } as const

    try {
      const res = await fetch(handshakeUrl, {
        method: 'GET',
        headers: acceptHeaders,
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      })

      if (res.ok) {
        showToast(t.settings.apiOkLmOk)
        return
      }

      // Servidor respondió con error 4xx/5xx
      showToast(t.settings.apiOkLmOffline)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        // Timeout explícito por AbortSignal.timeout
        if (import.meta.env.DEV) console.debug('[LMStudio handshake] TimeoutError', err)
      } else if (err instanceof TypeError) {
        // Red/CORS/Network failure típicamente aparece como TypeError
        if (import.meta.env.DEV) console.debug('[LMStudio handshake] TypeError', err)
      } else {
        if (import.meta.env.DEV) console.debug('[LMStudio handshake] Unknown error', err)
      }
      showToast(t.settings.apiOkLmOffline)
    }
  }

  return (
    <div className="modal-overlay open" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>{t.settings.title}</h2>
          <button className="modal-close" onClick={onClose} aria-label={t.common.close}>✕</button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h3>{t.settings.appearanceLanguage}</h3>
            <div className="settings-block">
              <div className="settings-row">
                <div>
                  <div className="sr-label">{t.settings.darkTheme}</div>
                </div>
                <label className="toggle" aria-label={t.settings.darkTheme}>
                  <input
                    type="checkbox"
                    checked={dark}
                    onChange={() => setDark(!dark)}
                    aria-label={t.settings.darkTheme}
                  />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </label>
              </div>

              <div className="settings-row">
                <div>
                  <div className="sr-label">{t.common.language}</div>
                </div>
                <select
                  className="form-select"
                  value={localLang}
                  title={t.common.language}
                  aria-label={t.common.language}
                  style={{ maxWidth: 150 }}
                  onChange={(event) => setLocalLang(normalizeLang(event.target.value))}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>{t.settings.account}</h3>
            <div className="settings-block">
              <div className="settings-row">
                <div>
                  <div className="sr-label">{t.common.username}</div>
                  <div className="sr-sub">{user?.name || t.settings.guest}</div>
                </div>
              </div>
              <div className="settings-row">
                <div>
                  <div className="sr-label">{t.common.role}</div>
                  <div className="sr-sub capitalize">{user?.role || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>{t.settings.systemConnections}</h3>
            <div className="settings-block">
              <div className="settings-row">
                <div className="sr-label">{t.settings.appVersion}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink2)' }}>2.1.0 (React)</div>
              </div>

              <div className="settings-row">
                <div>
                  <div className="sr-label">{t.settings.fastApiEndpoint}</div>
                </div>
                <input
                  className="form-input"
                  value={localApi}
                  onChange={(event) => setLocalApi(event.target.value)}
                  title={t.settings.fastApiEndpoint}
                  aria-label={t.settings.fastApiEndpoint}
                  placeholder="http://127.0.0.1:8000/api"
                  style={{ maxWidth: 190, fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 8px' }}
                />
              </div>

              <div className="settings-row">
                <div>
                  <div className="sr-label">{t.settings.lmStudioEndpoint}</div>
                </div>
                <input
                  className="form-input"
                  value={localLm}
                  onChange={(event) => setLocalLm(event.target.value)}
                  title={t.settings.lmStudioEndpoint}
                  aria-label={t.settings.lmStudioEndpoint}
                  placeholder="http://localhost:1234/v1"
                  style={{ maxWidth: 190, fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 8px' }}
                />
              </div>

              <div className="settings-row">
                <div>
                  <div className="sr-label">{t.settings.testConnections}</div>
                </div>
                <button className="btn btn-sm btn-outline" onClick={testConnections}>
                  {t.settings.testConnections}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleSave}>{t.settings.saveChanges}</button>
          <button className="btn btn-outline" onClick={onClose}>{t.common.cancel}</button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
