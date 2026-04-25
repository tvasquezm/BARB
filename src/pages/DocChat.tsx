import React, { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import createApiService from '../services/api'
import ChatBubble, { Thinking } from '../components/ChatBubble'
import { retrieveContext, sourcesFromChunks } from '../utils/rag'
import { callLMStudio } from '../services/lm'
import { Message, DocApiResponse } from '../types'
import MACHINES from '../data/machines'

const DocChat: React.FC = () => {
  const { apiBase, lmBase, discipline, docMachine, plant, docMessages, pushDocMessage, loading, setLoading, setDiscipline, setPlant } = useAppContext()
  const [input, setInput] = useState('')
  const areaRef = useRef<HTMLDivElement | null>(null)
  const api = createApiService(apiBase, lmBase)

  const disciplines = [
    { id: 'electrical', label: '⚡ Electrical' },
    { id: 'mechanical', label: '⚙️ Mechanical' },
    { id: 'hydraulic', label: '💧 Hydraulic' },
    { id: 'pneumatic', label: '💨 Pneumatic' },
    { id: 'automation', label: '🤖 Automation' }
  ]

  // Auto-ajustar altura del textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
  }

  useEffect(() => { if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight }, [docMessages.length])

  const send = async () => {
    const query = input.trim()
    if (!query || loading || !discipline) return
    setLoading(true)
    setInput('')
    const userMsg: Message = { role: 'user', content: query, timestamp: Date.now() }
    pushDocMessage(userMsg)
    
    // Reset height of textarea
    const el = document.getElementById('doc-input'); if (el) el.style.height = 'auto';

    // Try FastAPI /chat/documents
    try {
      const resp = await api.chat.documents({ disciplineId: discipline, plantId: plant, machineId: docMachine !== 'all' ? docMachine : null, message: query, conversationId: null, context: {} }) as DocApiResponse
      if (resp && resp.response) {
        pushDocMessage({ role: 'assistant', content: resp.response, timestamp: Date.now() })
        setLoading(false)
        return
      }
    } catch (_) {}

    // LM Studio fallback (centralized helper)
    try {
      const chunks = retrieveContext(query)
      const ctx = chunks.length ? chunks.map((c,i)=>`[FRAGMENTO ${i+1} — p.${c.page}]\n${c.text}`).join('\n\n') : '[Sin manual cargado]'
      
      const system = `Eres BARB, asistente experto en mantenimiento industrial. Disciplina: ${discipline}.\nResponde en español, paso a paso, citando página del manual cuando disponible. Usa ⚠️ para advertencias.\n\nCONTEXTO MANUAL:\n${ctx}`
      const resp = await callLMStudio([{ role: 'system', content: system }, ...docMessages.slice(-4).map(m=>({role:m.role,content:m.content})), { role: 'user', content: query }], lmBase, 'local-model')
      if (resp && resp.ok) {
        const data = await resp.json()
        const answer = data.choices?.[0]?.message?.content || data.result || ''
        pushDocMessage({ role: 'assistant', content: answer, timestamp: Date.now() })
        setLoading(false)
        return
      }
    } catch (_) {}

    // Demo fallback
    const chunks = retrieveContext(query)
    const demoAns = chunks.length ? `**[DEMO]** Basado en el manual:\n\n${chunks[0].text}\n\n*Inicia LM Studio o el backend FastAPI para respuestas inteligentes.*` : `**[DEMO]** No encontré información específica. Inicia LM Studio en ${lmBase} o la API en ${apiBase}.`
    pushDocMessage({ role: 'assistant', content: demoAns, timestamp: Date.now() })
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="two-panel w-full h-full">
      <div className="panel-left">
        <div className="panel-section">
          <span className="panel-label">Plant / Location</span>
          <select className="form-select" value={plant} onChange={(e) => setPlant(e.target.value)}>
            <option value="plant1">Main Production Plant</option>
            <option value="plant2">Assembly Line 2</option>
            <option value="plant3">Warehouse Facility</option>
          </select>
        </div>
        <div className="panel-section">
          <span className="panel-label">Discipline</span>
          <div className="disc-list">
            {disciplines.map(d => (
              <button 
                key={d.id} 
                className={`disc-pill ${discipline === d.id ? 'active' : ''}`} 
                data-d={d.id} 
                onClick={() => setDiscipline(discipline === d.id ? null : d.id)}
              >
                <span className="disc-dot" />{d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-section">
          <span className="panel-label">Machine (Optional)</span>
          <div className="machine-sel-list">
            <button className={`machine-sel-item ${docMachine === 'all' ? 'active' : ''}`} onClick={() => useAppContext().setDocMachine('all')}>
              <span className="msi-dot ok" />
              <div><div className="msi-name">All Machines</div></div>
            </button>
            {Object.entries(MACHINES).map(([id, m]) => (
              <button key={id} className={`machine-sel-item ${docMachine === id ? 'active' : ''}`} onClick={() => useAppContext().setDocMachine(id)}>
                <span className={`msi-dot ${m.status === 'warning' ? 'warn' : m.status === 'maintenance' ? 'maintain' : 'ok'}`} />
                <div><div className="msi-name">{m.name}</div><div className="msi-model">{m.model}</div></div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="panel-right">
        <div className="context-tags" style={{ flexShrink: 0 }}>
          {!discipline ? (
            <span className="ctx-empty">Select a discipline to start chatting with documentation</span>
          ) : (
            <>
              <span className="ctx-tag plant">📍 {plant}</span>
              <span className={`ctx-tag ${discipline === 'electrical' ? 'disc-el' : discipline === 'mechanical' ? 'disc-me' : discipline === 'hydraulic' ? 'disc-hy' : discipline === 'pneumatic' ? 'disc-pn' : 'disc-au'}`}>
                ◉ {disciplines.find(d => d.id === discipline)?.label}
              </span>
              {docMachine !== 'all' && MACHINES[docMachine] && <span className="ctx-tag machine">⚙ {MACHINES[docMachine].name}</span>}
            </>
          )}
        </div>
        <div className="chat-messages" ref={areaRef}>
          {docMessages.length === 0 ? (
            <div className="chat-empty"><h3>Select a discipline to start</h3></div>
          ) : (
            docMessages.map((m, i) => (
              <ChatBubble key={i} msg={m} side={m.role === 'user' ? 'user' : 'bot'} />
            ))
          )}
          {loading && <div className="mt-md"><Thinking /></div>}
        </div>
        <div className="input-zone" style={{ flexShrink: 0 }}>
          <div className="input-wrap">
            <textarea id="doc-input" value={input} onChange={handleInput} onKeyDown={handleKeyDown} rows={1} placeholder="Ask about procedures, specifications, maintenance..." disabled={!discipline || loading} className="flex-1 resize-none overflow-hidden bg-transparent border-none outline-none text-[13px] text-[var(--ink)] placeholder-[var(--ink3)]" />
            <button className="send-btn" onClick={send} disabled={!discipline || loading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div className="input-hint">Enter to send · Shift+Enter new line · Powered by RAG + LM Studio</div>
        </div>
      </div>
    </div>
  )
}

export default DocChat
