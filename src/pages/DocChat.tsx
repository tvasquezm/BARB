import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import ChatBubble, { Thinking } from '../components/ChatBubble'
import { Message } from '../types'
import MACHINES from '../data/machines'
import { getTranslations, normalizeLang } from '../utils/i18n'

interface ChatApiResponse {
  reply: string
  sources?: unknown[]
}

const DISCIPLINES = [
  { id: 'electrical', icon: '⚡' },
  { id: 'mechanical', icon: '⚙️' },
  { id: 'hydraulic', icon: '💧' },
  { id: 'pneumatic', icon: '💨' },
  { id: 'automation', icon: '🤖' },
] as const

const PLANTS = [
  { id: 'plant1', label: { es: 'Planta principal de producción', en: 'Main Production Plant' } },
  { id: 'plant2', label: { es: 'Línea de ensamblaje 2', en: 'Assembly Line 2' } },
  { id: 'plant3', label: { es: 'Bodega / almacén', en: 'Warehouse Facility' } },
] as const

const MACHINE_GROUPS = [
  { id: 'all', label: { es: 'Todas las máquinas', en: 'All machines' }, status: 'ok' as const },
  ...Object.entries(MACHINES).map(([id, machine]) => ({
    id,
    label: { es: machine.name, en: machine.name },
    model: machine.model,
    status: machine.status === 'warning' ? 'warning' : machine.status === 'maintenance' ? 'maintenance' : 'ok' as const,
  })),
]

const DocChat: React.FC = () => {
  const {
    apiBase,
    discipline,
    docMachine,
    plant,
    docMessages,
    pushDocMessage,
    loading,
    setLoading,
    setDiscipline,
    setPlant,
    setDocMachine,
    selectedMachine,
    setSelectedMachine,
    lang,
  } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()

  const [input, setInput] = useState('')
  const areaRef = useRef<HTMLDivElement | null>(null)
  const t = useMemo(() => getTranslations(lang), [lang])
  const isEs = normalizeLang(lang) === 'es'

  useEffect(() => {
    if (selectedMachine && docMachine !== selectedMachine) {
      setDocMachine(selectedMachine)
    }
  }, [docMachine, selectedMachine, setDocMachine])

  useEffect(() => {
    if (location.state && typeof location.state === 'object') {
      const state = location.state as { machineId?: string; discipline?: string; plant?: string }
      if (state.machineId) setSelectedMachine(state.machineId)
      if (state.machineId && docMachine !== state.machineId) setDocMachine(state.machineId)
      if (state.discipline) setDiscipline(state.discipline)
      if (state.plant) setPlant(state.plant)
    }
  }, [location.state, docMachine, setDocMachine, setDiscipline, setPlant, setSelectedMachine])

  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight
  }, [docMessages.length])

  const currentPlant = PLANTS.find(item => item.id === plant) ?? PLANTS[0]
  const currentMachine = MACHINE_GROUPS.find(item => item.id === docMachine) ?? MACHINE_GROUPS[0]
  const currentDiscipline = DISCIPLINES.find(item => item.id === discipline) ?? null

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
  }

  const handleSelectMachine = (id: string) => {
    setDocMachine(id)
    if (id !== 'all') setSelectedMachine(id)
  }

  const send = async () => {
    const query = input.trim()
    if (!query || loading || !discipline) return

    setLoading(true)
    setInput('')

    const userMsg: Message = { role: 'user', content: query, timestamp: Date.now() }
    pushDocMessage(userMsg)

    const el = document.getElementById('doc-input')
    if (el) el.style.height = 'auto'

    try {
      const response = await fetch(`${apiBase.replace(/\/$/, '')}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          lang: normalizeLang(lang),
          discipline,
          plant,
          machine_id: docMachine,
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text().catch(() => response.statusText))
      }

      const data = (await response.json()) as ChatApiResponse
      pushDocMessage({
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error('Error calling chat API', error)
      pushDocMessage({
        role: 'assistant',
        content: isEs
          ? 'No se pudo conectar con el backend de Plant Memory en este momento.'
          : 'Could not connect to the Plant Memory backend right now.',
        timestamp: Date.now(),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  const activeDisciplineLabel = currentDiscipline ? `${currentDiscipline.icon} ${isEs ? currentDiscipline.id : currentDiscipline.id}` : ''

  return (
    <div className="two-panel w-full h-full">
      <div className="panel-left">
        <div className="panel-section">
          <span className="panel-label">{isEs ? 'Planta / Ubicación' : 'Plant / Location'}</span>
          <select
            aria-label={isEs ? 'Seleccionar planta' : 'Select plant'}
            className="form-select"
            value={plant}
            onChange={e => setPlant(e.target.value)}
          >
            {PLANTS.map(option => (
              <option key={option.id} value={option.id}>
                {option.label[normalizeLang(lang)]}
              </option>
            ))}
          </select>
        </div>

        <div className="panel-section">
          <span className="panel-label">{isEs ? 'Disciplina' : 'Discipline'}</span>
          <div className="disc-list">
            {DISCIPLINES.map(disciplineOption => (
              <button
                key={disciplineOption.id}
                className={`disc-pill ${discipline === disciplineOption.id ? 'active' : ''}`}
                data-d={disciplineOption.id}
                onClick={() => setDiscipline(discipline === disciplineOption.id ? null : disciplineOption.id)}
              >
                <span className="disc-dot" />
                {disciplineOption.icon} {isEs ? disciplineOption.id.charAt(0).toUpperCase() + disciplineOption.id.slice(1) : disciplineOption.id.charAt(0).toUpperCase() + disciplineOption.id.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <span className="panel-label">{isEs ? 'Máquina (opcional)' : 'Machine (optional)'}</span>
          <div className="machine-sel-list">
            {MACHINE_GROUPS.map(machine => (
              <button
                key={machine.id}
                className={`machine-sel-item ${docMachine === machine.id ? 'active' : ''}`}
                onClick={() => handleSelectMachine(machine.id)}
              >
                <span className={`msi-dot ${machine.status === 'warning' ? 'warn' : machine.status === 'maintenance' ? 'maintain' : 'ok'}`} />
                <div>
                  <div className="msi-name">{machine.label[normalizeLang(lang)]}</div>
                  {'model' in machine && machine.model ? <div className="msi-model">{machine.model}</div> : null}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-right">
        <div className="context-tags" style={{ flexShrink: 0 }}>
          {!discipline ? (
            <span className="ctx-empty">
              {isEs ? 'Selecciona una disciplina para empezar a chatear con documentación' : 'Select a discipline to start chatting with documentation'}
            </span>
          ) : (
            <>
              <span className="ctx-tag plant">📍 {currentPlant.label[normalizeLang(lang)]}</span>
              <span className={`ctx-tag ${discipline === 'electrical' ? 'disc-el' : discipline === 'mechanical' ? 'disc-me' : discipline === 'hydraulic' ? 'disc-hy' : discipline === 'pneumatic' ? 'disc-pn' : 'disc-au'}`}>
                ◉ {activeDisciplineLabel}
              </span>
              {docMachine !== 'all' && MACHINES[docMachine] && <span className="ctx-tag machine">⚙ {MACHINES[docMachine].name}</span>}
            </>
          )}
        </div>

        <div className="chat-messages" ref={areaRef}>
          {docMessages.length === 0 ? (
            <div className="chat-empty">
              <h3>{isEs ? 'Selecciona una disciplina para empezar' : 'Select a discipline to start'}</h3>
              <p>{isEs ? 'Puedes cambiar planta, disciplina y máquina desde el panel lateral.' : 'You can change plant, discipline and machine from the side panel.'}</p>
            </div>
          ) : (
            docMessages.map((m, i) => (
              <ChatBubble key={i} msg={m} side={m.role === 'user' ? 'user' : 'bot'} />
            ))
          )}
          {loading && <div className="mt-md"><Thinking /></div>}
        </div>

        <div className="input-zone" style={{ flexShrink: 0 }}>
          <div className="input-wrap">
            <textarea
              id="doc-input"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={isEs ? 'Pregunta por procedimientos, especificaciones, mantenimiento…' : 'Ask about procedures, specifications, maintenance…'}
              disabled={!discipline || loading}
              className="flex-1 resize-none overflow-hidden bg-transparent border-none outline-none text-[13px] text-[var(--ink)] placeholder-[var(--ink3)]"
            />
            <button
              aria-label={isEs ? 'Enviar mensaje al chat' : 'Send chat message'}
              className="send-btn"
              onClick={() => { void send() }}
              disabled={!discipline || loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <div className="input-hint">
            {isEs ? 'Enter para enviar · Shift+Enter nueva línea · Powered by FastAPI' : 'Enter to send · Shift+Enter new line · Powered by FastAPI'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocChat
