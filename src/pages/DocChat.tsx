import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import ChatBubble, { Thinking } from '../components/ChatBubble'
import MACHINES from '../data/machines'
import { getTranslations, normalizeLang } from '../utils/i18n'
import { tokenize } from '../utils/rag'
import { Message, SourceHit } from '../types'

// ── Types ──────────────────────────────────────────────────────
interface ChatApiResponse {
  reply: string
  sources?: SourceHit[]
}

// ── Manual local model (solo para fallback + demo) ───────────
interface ManualDoc {
  id: string
  name: string
  size: string
  pages: number | null
  isDemo: boolean
  uploadedBy: string
  uploadedAt: Date
  chunks: Array<{ text: string; page: number; doc: string }>
}

// ── Constants ─────────────────────────────────────────────────────
const DISCIPLINES = [
  { id: 'electrical', icon: '⚡', color: 'amber' },
  { id: 'mechanical', icon: '⚙️', color: 'blue' },
  { id: 'hydraulic', icon: '💧', color: 'cyan' },
  { id: 'pneumatic', icon: '💨', color: 'purple' },
  { id: 'automation', icon: '🤖', color: 'green' },
] as const

const PLANTS = [
  { id: 'plant1', label: { es: 'Planta principal de producción', en: 'Main Production Plant' } },
  { id: 'plant2', label: { es: 'Línea de ensamblaje 2', en: 'Assembly Line 2' } },
  { id: 'plant3', label: { es: 'Bodega / almacén', en: 'Warehouse Facility' } },
] as const

const MACHINE_GROUPS: Array<{
  id: string
  label: { es: string; en: string }
}> = [
  { id: 'all', label: { es: 'Todas las máquinas', en: 'All machines' } },
  ...Object.entries(MACHINES).map(([id, m]) => ({
    id,
    label: { es: m.name, en: m.name },
  })),
]

const DEMO_MANUAL: ManualDoc = {
  id: 'demo-atlas',
  name: 'Manual Atlas Copco GA55-GA75.pdf',
  size: '4.2 MB',
  pages: 98,
  isDemo: true,
  uploadedBy: 'sistema',
  uploadedAt: new Date(),
  chunks: [
    {
      text: 'ARRANQUE SEGURO: 1) Verificar nivel aceite MIN-MAX. 2) Abrir válvula suministro. 3) Verificar guardas. 4) Presionar START. 5) Esperar 30s vacío. 6) Cargar gradualmente a 7.5 bar. ⚠️ No superar 10 bar.',
      page: 14,
      doc: 'Manual Atlas Copco GA55-GA75.pdf',
    },
    {
      text: 'CÓDIGO E-041 — Sobrecalentamiento motor. CAUSAS: Filtro obstruido, aceite bajo, ventilación bloqueada, temperatura >45°C. SOLUCIÓN: 1) Parar equipo. 2) Limpiar filtro FA-001. 3) Verificar aceite SAE 40. 4) Despejar ventilación 50cm.',
      page: 37,
      doc: 'Manual Atlas Copco GA55-GA75.pdf',
    },
  ],
}

// ── Helpers ──────────────────────────────────────────────────────
function fmtSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function chunkText(text: string, filename: string, chunkSize = 500, overlap = 60): ManualDoc['chunks'] {
  const words = text.trim().split(/\s+/)
  const chunks: ManualDoc['chunks'] = []
  const pageCount = Math.max(1, Math.round(text.length / 3000))
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const slice = words.slice(i, i + chunkSize).join(' ')
    if (slice.trim().length < 40) continue
    const estimatedPage = Math.max(1, Math.round((i / words.length) * Math.max(pageCount * 2, 10)))
    chunks.push({ text: slice, page: estimatedPage, doc: filename })
  }
  return chunks
}

function retrieveFromManual(query: string, chunks: ManualDoc['chunks'], k = 4) {
  if (!chunks.length) return []
  const qTok = new Set(tokenize(query))
  return chunks
    .map(c => {
      const cTok = tokenize(c.text)
      let score = 0
      qTok.forEach(q => {
        const f = cTok.filter(t => t.includes(q) || q.includes(t)).length
        if (f > 0) score += 1 + Math.log(f)
      })
      return { ...c, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .filter(c => c.score > 0)
}

// ── Component ─────────────────────────────────────────────────────
const DocChat: React.FC = () => {
  const {
    apiBase,
    lmBase,
    discipline,
    docMachine,
    plant,
    pushDocMessage,
    loading: ctxLoading,
    setDiscipline,
    setPlant,
    setDocMachine,
    selectedMachine,
    setSelectedMachine,
    user,
    lang,
    setLoading,
    docMessages,
  } = useAppContext()

  const navigate = useNavigate()
  const location = useLocation()

  const t = useMemo(() => getTranslations(lang), [lang])
  const isEs = normalizeLang(lang) === 'es'
  const langKey = normalizeLang(lang) as 'es' | 'en'

  // ── Estados solicitados (locales para el motor de chat) ─────────
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false) // ESTADO DEL DRAWER

  // ── Manuales locales (fallback demo/local extraction) ────────
  const [manuals, setManuals] = useState<ManualDoc[]>([DEMO_MANUAL])
  const [activeManualId, setActiveManualId] = useState<string>(DEMO_MANUAL.id)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)

  const areaRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // sync machine from navigation state
  useEffect(() => {
    if (selectedMachine && docMachine !== selectedMachine) setDocMachine(selectedMachine)
  }, [docMachine, selectedMachine, setDocMachine])

  useEffect(() => {
    if (location.state && typeof location.state === 'object') {
      const s = location.state as { machineId?: string; discipline?: string; plant?: string }
      if (s.machineId) {
        setSelectedMachine(s.machineId)
        setDocMachine(s.machineId)
      }
      if (s.discipline) setDiscipline(s.discipline)
      if (s.plant) setPlant(s.plant)
    }
  }, [location.state, setDocMachine, setDiscipline, setPlant, setSelectedMachine])

  // Keep local messages mirrored with context
  useEffect(() => {
    setMessages(docMessages)
  }, [docMessages])

  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight
  }, [messages.length])

  const activeManual = useMemo(
    () => manuals.find(m => m.id === activeManualId) ?? null,
    [manuals, activeManualId],
  )

  const currentPlant = PLANTS.find(p => p.id === plant) ?? PLANTS[0]

  const processFile = useCallback(
    async (file: File) => {
      setUploading(true)
      setUploadPct(10)

      // Try backend upload first
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('type', 'document')
        fd.append('context', 'document_library')

        const r = await fetch(`${apiBase.replace(/\/$/, '')}/upload`, {
          method: 'POST',
          body: fd,
          signal: AbortSignal.timeout(30_000),
        })

        if (r.ok) {
          setUploadPct(95)
          const data = (await r.json().catch(() => ({}))) as { fileId?: string }
          const doc: ManualDoc = {
            id: data.fileId ?? `srv-${Date.now()}`,
            name: file.name,
            size: fmtSize(file.size),
            pages: null,
            isDemo: false,
            uploadedBy: user?.name ?? 'operador',
            uploadedAt: new Date(),
            chunks: [],
          }
          setManuals(prev => [...prev, doc])
          setActiveManualId(doc.id)
          setUploading(false)
          setUploadPct(0)
          return
        }
      } catch {
        // fallback to local extraction
      }

      // Local extraction fallback
      setUploadPct(40)
      let text = ''
      let pageCount = 1
      try {
        if (/\.(txt|md)$/i.test(file.name)) {
          text = await file.text()
          pageCount = Math.max(1, Math.round(text.length / 3000))
        } else if (/\.pdf$/i.test(file.name)) {
          const ab = await file.arrayBuffer()
          const raw = new TextDecoder('latin1').decode(ab)
          const strings = raw.match(/\(([^)]{8,300})\)/g) ?? []
          text = strings
            .map(s => s.slice(1, -1))
            .join(' ')
            .replace(/[^\x20-\x7E\u00C0-\u024F\n ]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
          const pageMatches = raw.match(/\/Page\b/g)
          pageCount = pageMatches ? pageMatches.length : Math.max(1, Math.round(file.size / 4096))
        } else {
          text = await file.text().catch(() => '')
          pageCount = Math.max(1, Math.round(text.length / 3000))
        }
      } catch {
        text = ''
      }

      setUploadPct(75)
      const chunks = text.length > 100 ? chunkText(text, file.name) : []
      const doc: ManualDoc = {
        id: `local-${Date.now()}`,
        name: file.name,
        size: fmtSize(file.size),
        pages: pageCount,
        isDemo: false,
        uploadedBy: user?.name ?? 'operador',
        uploadedAt: new Date(),
        chunks,
      }
      setManuals(prev => [...prev, doc])
      setActiveManualId(doc.id)
      setUploading(false)
      setUploadPct(0)
    },
    [apiBase, user],
  )

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return
      for (const f of Array.from(files)) await processFile(f)
    },
    [processFile],
  )

  // ── Send message (handleSend) ────────────────────────────────
  const handleSend = useCallback(async () => {
    const query = input.trim()
    if (!query || isLoading) return
    if (!discipline) return

    setIsLoading(true)
    setLoading?.(true)
    setInput('')

    pushDocMessage({ role: 'user', content: query, timestamp: Date.now() })

    // 1) FastAPI backend /chat
    try {
      const r = await fetch(`${apiBase.replace(/\/$/, '')}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          lang: normalizeLang(lang),
          discipline,
          plant,
          machine_id: docMachine !== 'all' ? docMachine : null,
        }),
        signal: AbortSignal.timeout(30_000),
      })

      if (r.ok) {
        const data = (await r.json()) as ChatApiResponse
        pushDocMessage({ role: 'assistant', content: data.reply, timestamp: Date.now() })
        setIsLoading(false)
        setLoading?.(false)
        return
      }
    } catch {
      // fallback below
    }

    // 2) LM Studio direct fallback
    try {
      const chunks = retrieveFromManual(query, activeManual?.chunks ?? [])
      const ctx = chunks.length
        ? chunks
            .map((c, i) => `[FRAGMENTO ${i + 1} — ${c.doc} p.${c.page}]\n${c.text}`)
            .join('\n\n')
        : '[Sin manual cargado — responde con conocimiento general de mantenimiento industrial]'

      const machineName = docMachine !== 'all' && MACHINES[docMachine] ? MACHINES[docMachine].name : null
      const manualNote = activeManual ? `Manual activo: ${activeManual.name}.` : ''

      const system = `Eres BARB, asistente experto en mantenimiento industrial. Disciplina: ${discipline}. ${
        machineName ? 'Equipo: ' + machineName + '.' : ''
      } ${manualNote}\nResponde en ${isEs ? 'español' : 'inglés'}, paso a paso, citando página del manual cuando disponible. Usa ⚠️ para advertencias de seguridad.\n\nCONTEXTO MANUAL:\n${ctx}`

      const history = messages.slice(-4).map(m => ({ role: m.role, content: m.content }))
      const r = await fetch(`${lmBase.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'local-model',
          temperature: 0.1,
          max_tokens: 1500,
          stream: false,
          messages: [
            { role: 'system', content: system },
            ...history,
            { role: 'user', content: query },
          ],
        }),
        signal: AbortSignal.timeout(90_000),
      })

      if (r.ok) {
        const data = (await r.json()) as { choices?: Array<{ message: { content: string } }> }
        const answer = data.choices?.[0]?.message?.content ?? ''
        pushDocMessage({ role: 'assistant', content: answer, timestamp: Date.now() })
        setIsLoading(false)
        setLoading?.(false)
        return
      }
    } catch {
      // fallback to demo
    }

    // 3) Demo fallback
    const chunks = retrieveFromManual(query, activeManual?.chunks ?? [])
    const demoAns = chunks.length
      ? `**[DEMO — sin backend activo]**\n\nBasado en el manual:\n\n${chunks[0].text}\n\n*Inicia LM Studio (${lmBase}) o el backend FastAPI (${apiBase}) para respuestas inteligentes.*`
      : `**[DEMO]** No hay contexto disponible. Carga un manual PDF para activar el RAG.`

    pushDocMessage({ role: 'assistant', content: demoAns, timestamp: Date.now() })
    setIsLoading(false)
    setLoading?.(false)
  }, [
    activeManual?.chunks,
    apiBase,
    discipline,
    docMachine,
    input,
    isEs,
    isLoading,
    lang,
    lmBase,
    messages,
    plant,
    pushDocMessage,
    setLoading,
  ])

  useEffect(() => {
    if (ctxLoading !== isLoading) setLoading?.(isLoading)
  }, [ctxLoading, isLoading, setLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
      <div className="w-full min-w-0 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-[#131314] relative">
      
      {/* --- 1. HEADER MINIMALISTA (Gemini) --- */}
      <div className="shrink-0 flex-none h-14 border-b border-gray-100 flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors flex items-center justify-center"
            aria-label={isEs ? 'Abrir panel' : 'Open panel'}
            title={isEs ? 'Abrir panel' : 'Open panel'}
            type="button"
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span>
          </button>

          <div className="min-w-0">
            <div className="font-extrabold text-[16px] text-gray-900 leading-tight">BARB</div>
            <div className="text-xs text-gray-500 truncate">
              {docMachine && docMachine !== 'all' && MACHINES[docMachine] ? MACHINES[docMachine].name : (isEs ? 'Sin máquina' : 'No machine')}
            </div>
          </div>
        </div>

        <div className="hidden sm:block">
          {docMachine && docMachine !== 'all' && MACHINES[docMachine] ? (
            <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700 shadow-sm">
              {MACHINES[docMachine].name}
            </span>
          ) : (
            <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-500 shadow-sm">
              {isEs ? 'Selecciona máquina' : 'Select machine'}
            </span>
          )}
        </div>
      </div>

      {/* --- 2. RESUMEN CHIPS (Debajo del header) --- */}
      <div className="shrink-0 flex-none w-full px-4 py-3 border-b bg-gray-50/30" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
        <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-2">
          {discipline ? (
            <>
              <span className="px-2 py-1 bg-white border rounded-md text-xs text-gray-600 shadow-sm truncate">
                📍 {currentPlant.label[langKey]}
              </span>
              <span className="px-2 py-1 bg-white border rounded-md text-xs text-gray-600 shadow-sm truncate">
                ◉ {DISCIPLINES.find(d => d.id === discipline)?.icon} {discipline}
              </span>
              {docMachine !== 'all' && MACHINES[docMachine] && (
                <span className="px-2 py-1 bg-white border rounded-md text-xs text-gray-600 shadow-sm truncate">
                  ⚙ {MACHINES[docMachine].name}
                </span>
              )}
              {activeManual && (
                <span className="px-2 py-1 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-700 shadow-sm truncate">
                  📖 {activeManual.name.length > 25 ? activeManual.name.slice(0, 22) + '…' : activeManual.name}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-400 italic">
              {isEs ? 'Abre los ajustes (⚙️) para configurar tu sesión.' : 'Open settings (⚙️) to configure your session.'}
            </span>
          )}
        </div>
      </div>

      {/* --- 3. LIENZO DEL CHAT --- */}
      <div className="flex flex-col flex-1 overflow-hidden w-full bg-white">
        <div ref={areaRef} className="flex-1 overflow-y-auto w-full p-4 md:p-6">
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-5">
            {messages.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center mt-12 text-center">
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>💬</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                  {!discipline ? t.docchat.emptyTitle : (isEs ? 'Haz tu primera pregunta' : 'Ask your first question')}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm dark:text-gray-300">
                  {!discipline ? t.docchat.emptyDescription : t.docchat.selectDisciplineHint}
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <ChatBubble key={i} msg={m} side={m.role === 'user' ? 'user' : 'bot'} />
              ))
            )}

            {isLoading && (
              <div className="mt-2">
                <Thinking />
              </div>
            )}
          </div>
        </div>

        {/* --- 4. INPUT STICKY BOTTOM --- */}
        <div className="flex-none w-full p-4 md:p-6 flex flex-col items-center justify-center bg-gradient-to-t from-white via-white to-transparent dark:from-[#131314] dark:via-[#131314] border-t border-gray-100 dark:border-gray-800">
          <div className="w-full max-w-3xl flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <textarea
              id="doc-input"
              value={input}
              onChange={e => {
                setInput(e.target.value)
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={t.docchat.askPlaceholder}
              disabled={!discipline || isLoading}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 min-h-[44px] resize-none overflow-y-auto p-3"
            />
            <button
              onClick={() => void handleSend()}
              disabled={!discipline || isLoading || !input.trim()}
              title={isEs ? 'Enviar' : 'Send'}
              aria-label={isEs ? 'Enviar' : 'Send'}
              className={`flex-none w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                !discipline || isLoading || !input.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
              }`}
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <div className="w-full max-w-3xl text-center mt-3 text-xs text-gray-400">
            {isEs ? 'Enter para enviar · Shift+Enter para nueva línea' : 'Enter to send · Shift+Enter for new line'}
          </div>
        </div>
      </div>

      {/* --- 5. EL DRAWER FLOTANTE (ESTABA DESAPARECIDO) --- */}
      {isDrawerOpen && (
        <div className="absolute inset-0 z-50 flex justify-end">
          {/* Overlay oscuro */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Panel Lateral */}
          <div className="relative w-full max-w-md bg-white dark:bg-[#1e1f20] h-full shadow-2xl flex flex-col transform transition-transform">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-lg text-gray-800">
                {isEs ? 'Configuración de Sesión' : 'Session Setup'}
              </h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={isEs ? 'Cerrar panel' : 'Close panel'}
                aria-label={isEs ? 'Cerrar panel' : 'Close panel'}
                type="button"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              
              {/* Filtro Planta */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">📍 {isEs ? 'Planta' : 'Plant'}</label>
                <select
                  aria-label={isEs ? 'Seleccionar planta' : 'Select plant'}
                  value={plant || ''}
                  onChange={e => setPlant(e.target.value)}
                  className="p-3 border rounded-xl bg-gray-50 dark:bg-[#28292a] dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  {PLANTS.map(p => (
                    <option key={p.id} value={p.id}>{p.label[langKey]}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Disciplina */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">◉ {isEs ? 'Disciplina' : 'Discipline'}</label>
                <select
                  aria-label={isEs ? 'Seleccionar disciplina' : 'Select discipline'}
                  title={isEs ? 'Seleccionar disciplina' : 'Select discipline'}
                  value={discipline || ''}
                  onChange={e => setDiscipline(e.target.value as any)}
                  className="p-3 border rounded-xl bg-gray-50 dark:bg-[#28292a] dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value="" disabled>{isEs ? 'Selecciona una disciplina...' : 'Select discipline...'}</option>
                  {DISCIPLINES.map(d => (
                    <option key={d.id} value={d.id}>{d.icon} {d.id}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Máquina */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">⚙️ {isEs ? 'Máquina' : 'Machine'}</label>
                <select
                  aria-label={isEs ? 'Seleccionar máquina' : 'Select machine'}
                  title={isEs ? 'Seleccionar máquina' : 'Select machine'}
                  value={docMachine || ''}
                  onChange={e => setDocMachine(e.target.value)}
                  className="p-3 border rounded-xl bg-gray-50 dark:bg-[#28292a] dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  disabled={!discipline}
                >
                  {MACHINE_GROUPS.map(g => (
                    <option key={g.id} value={g.id}>{g.label[langKey]}</option>
                  ))}
                </select>
              </div>

              <hr className="border-gray-100" />

              {/* Sección de Manuales */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-gray-700">
                  📖 {isEs ? 'Biblioteca de Manuales' : 'Manuals Library'}
                </label>
                
                <div className="flex flex-col gap-2">
                  {manuals.map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => setActiveManualId(m.id)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                        activeManualId === m.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{guessIcon(m.name)}</span>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-sm font-medium text-gray-800 truncate">{m.name}</span>
                        <span className="text-xs text-gray-500">{m.size} • {m.pages ? `${m.pages} pág.` : ''}</span>
                      </div>
                      {m.isDemo && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded">DEMO</span>
                      )}
                    </div>
                  ))}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.txt,.md"
                  aria-label={isEs ? 'Subir manual PDF' : 'Upload manual PDF'}
                  title={isEs ? 'Subir manual PDF' : 'Upload manual PDF'}
                  onChange={e => handleFiles(e.target.files)}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-2 flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-sm"
                >
                  {uploading ? (
                    <span className="text-blue-600 font-bold">Cargando... {uploadPct}%</span>
                  ) : (
                    isEs ? '📄 Subir nuevo manual PDF' : '📄 Upload new PDF manual'
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function guessIcon(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('atlas') || n.includes('copco') || n.includes('compresor') || n.includes('compress')) return '💨'
  if (n.includes('schuler') || n.includes('hidraul') || n.includes('hydraulic')) return '💧'
  if (n.includes('cnc') || n.includes('mazak') || n.includes('haas') || n.includes('mecan')) return '⚙️'
  if (n.includes('electr') || n.includes('motor') || n.includes('abb')) return '⚡'
  if (n.includes('neumat') || n.includes('pneumat')) return '💨'
  if (n.includes('plc') || n.includes('autom') || n.includes('siemens')) return '🤖'
  return '📄'
}

export default DocChat
