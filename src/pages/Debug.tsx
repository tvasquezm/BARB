import React, { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import createApiService from '../services/api'
import ChatBubble, { Thinking } from '../components/ChatBubble'
import { retrieveContext } from '../utils/rag'
import { callLMStudio } from '../services/lm'
import { Message, DebugApiResponse } from '../types'
import { useNavigate } from 'react-router-dom'
import MACHINES from '../data/machines'
import { showToast } from '../components/Toast'

const Debug: React.FC = () => {
  const { apiBase, lmBase, selectedMachine, docMessages, debugMessages, pushDebugMessage, setLoading, loading } = useAppContext()
  const [input, setInput] = useState('')
  const areaRef = useRef<HTMLDivElement | null>(null)
  const api = createApiService(apiBase, lmBase)
  const navigate = useNavigate()

  // Auto-ajustar altura del textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
  }

  useEffect(() => { if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight }, [debugMessages.length])

  const send = async () => {
    const query = input.trim()
    if (!query || loading) return
    setLoading(true)
    setInput('')
    const userMsg: Message = { role: 'user', content: query, timestamp: Date.now() }
    pushDebugMessage(userMsg)
    
    // Reset height of textarea
    const el = document.getElementById('debug-input'); if (el) el.style.height = 'auto';

    // Try FastAPI debug endpoint
    try {
      const resp = await api.chat.debug({ sessionId: null, machineId: selectedMachine, message: query, attachments: [], sensorData: null }) as DebugApiResponse
      if (resp && resp.response) {
        pushDebugMessage({ role: 'assistant', content: resp.response, timestamp: Date.now() })
        setLoading(false)
        return
      }
    } catch (_) {}

    // LM Studio fallback (centralized helper)
    try {
      const chunks = retrieveContext(query)
      const ctx = chunks.length ? chunks.map((c,i)=>`[FRAGMENTO ${i+1} — p.${c.page}]\n${c.text}`).join('\n\n') : '[Sin manual disponible]'
      const system = `Eres BARB, experto en diagnóstico de maquinaria industrial. Máquina: ${selectedMachine || 'desconocida'}.\nResponde en español con: diagnóstico preciso, causas posibles, acciones paso a paso. Usa ⚠️ para advertencias de seguridad.\n\nCONTEXTO:\n${ctx}`
      const resp = await callLMStudio([{ role: 'system', content: system }, ...debugMessages.slice(-4).map(m=>({role:m.role,content:m.content})), { role: 'user', content: query }], lmBase, 'local-model')
      if (resp && resp.ok) {
        const data = await resp.json()
        const answer = data.choices?.[0]?.message?.content || data.result || ''
        pushDebugMessage({ role: 'assistant', content: answer, timestamp: Date.now() })
        setLoading(false)
        return
      }
    } catch (_) {}

    // Demo fallback
    const chunks = retrieveContext(query)
    const demoAns = chunks.length ? `**[DEMO — Machine Debug]**\n\n${chunks[0].text}` : `**[DEMO]** Inicia LM Studio o el backend FastAPI.`
    pushDebugMessage({ role: 'assistant', content: demoAns, timestamp: Date.now() })
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const machine = selectedMachine ? MACHINES[selectedMachine] : null
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <div className="w-full min-w-0 overflow-x-hidden flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Header minimalista */}
      <div
        className="shrink-0 flex-none h-14 border-b flex justify-between items-center px-4"
        style={{ borderColor: 'rgba(0,0,0,0.06)' }}
      >
        <div className="min-w-0 flex items-center gap-3">
          <div className="font-extrabold text-[14px] truncate" style={{ color: 'var(--ink)' }}>
            {`Debug`}
          </div>
          {machine && (
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="ctx-tag plant truncate">⚙️ {machine.name}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label={isDrawerOpen ? 'Cerrar panel' : 'Abrir panel'}
          onClick={() => setIsDrawerOpen(v => !v)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{'⚙️'}</span>
        </button>
      </div>

      {/* Drawer flotante para Machine Information */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsDrawerOpen(false)}
            role="button"
            aria-label="Cerrar panel"
            tabIndex={-1}
          />
          <div className="relative w-80 sm:w-96 bg-white h-full shadow-2xl overflow-y-auto p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-[14px]" style={{ color: 'var(--ink)' }}>
                Machine panel
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Cerrar"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <div className="min-w-0">
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>
                Machine Information
              </h3>

              <div className="debug-machine-img">
                <div className="big-icon">{machine?.icon || '⚙️'}</div>
                <div className="dm-name">{machine?.name || '—'}</div>
                <div className="dm-model">{machine?.model || '—'}</div>
              </div>

              <div className="debug-specs">
                <h4>Specifications</h4>
                <div className="spec-row">
                  <span className="spec-label">Status</span>
                  <span className="spec-val" style={{ textTransform: 'capitalize' }}>
                    {machine?.status || '—'}
                  </span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Category</span>
                  <span className="spec-val">{machine?.cat || '—'}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Session ID</span>
                  <span className="spec-val font-mono text-secondary">ACT-{(Date.now() % 100000)}</span>
                </div>
              </div>
            </div>

            <button
              className="report-btn mt-auto"
              title="Generate & Send Report"
              aria-label="Generate & Send Report"
              onClick={() => navigate('/report')}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Generate & Send Report
            </button>
          </div>
        </div>
      )}

      {/* Lienzo del chat */}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {/* Zona mensajes */}
        <div ref={areaRef} className="flex-1 overflow-y-auto w-full p-4 min-h-0">
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
            {debugMessages.length === 0 ? (
              <div className="w-full flex flex-col">
                <h3>Start debugging session</h3>
              </div>
            ) : (
              debugMessages.map((m, i) => (
                <ChatBubble key={i} msg={m} side={m.role === 'user' ? 'user' : 'bot'} />
              ))
            )}
            {loading && (
              <div className="mt-md">
                <Thinking />
              </div>
            )}
          </div>
        </div>

        {/* Input sticky bottom */}
        <div
          className="flex-none w-full p-4 flex justify-center bg-gradient-to-t from-white via-white to-transparent border-t"
          style={{ borderColor: 'rgba(0,0,0,0.06)' }}
        >
          <div className="w-full max-w-3xl flex flex-col gap-2">
            <div className="w-full flex items-end gap-2 bg-gray-50 border rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
              <textarea
                id="debug-input"
                value={input}
                title="Describe the issue or ask questions"
                aria-label="Describe the issue or ask questions"
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Describe the issue or ask questions..."
                disabled={loading}
                className="flex-1 resize-none overflow-hidden bg-transparent border-none outline-none text-[13px] text-[var(--ink)] placeholder-[var(--ink3)] p-2"
              />
              <button
                title="Send"
                aria-label="Send"
                className="send-btn"
                onClick={send}
                disabled={loading}
                style={{
                  minHeight: 44,
                  width: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                }}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            <div className="w-full flex items-center justify-between gap-2">
              <button
                className="camera-btn"
                title="Attach photo"
                aria-label="Attach photo"
                onClick={() =>
                  showToast('📷 Camera: attach feature — POST /api/debug/attachments')
                }
                type="button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>

              <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.4 }} className="text-right">
                {`Enter para enviar · Shift+Enter nueva línea`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Debug
