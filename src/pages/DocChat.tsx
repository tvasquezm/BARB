import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import ChatBubble, { Thinking } from '../components/ChatBubble'
import { Message, SourceHit } from '../types'
import MACHINES from '../data/machines'
import { getTranslations, normalizeLang } from '../utils/i18n'
import { tokenize } from '../utils/rag'

// ── Types ──────────────────────────────────────────────────────
interface ChatApiResponse { reply: string; sources?: SourceHit[] }

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

// ── Constants ──────────────────────────────────────────────────
const DISCIPLINES = [
  { id: 'electrical', icon: '⚡', color: 'amber' },
  { id: 'mechanical', icon: '⚙️', color: 'blue' },
  { id: 'hydraulic',  icon: '💧', color: 'cyan' },
  { id: 'pneumatic',  icon: '💨', color: 'purple' },
  { id: 'automation', icon: '🤖', color: 'green' },
] as const

const PLANTS = [
  { id: 'plant1', label: { es: 'Planta principal de producción', en: 'Main Production Plant' } },
  { id: 'plant2', label: { es: 'Línea de ensamblaje 2',         en: 'Assembly Line 2' } },
  { id: 'plant3', label: { es: 'Bodega / almacén',              en: 'Warehouse Facility' } },
] as const

const MACHINE_GROUPS = [
  { id: 'all', label: { es: 'Todas las máquinas', en: 'All machines' }, status: 'ok' as const },
  ...Object.entries(MACHINES).map(([id, m]) => ({
    id,
    label: { es: m.name, en: m.name },
    model: m.model,
    status: m.status === 'warning' ? 'warn' : m.status === 'maintenance' ? 'maintain' : 'ok' as 'ok' | 'warn' | 'maintain',
    cat: m.cat, // Pneumatic/Hydraulic/Mechanical/Electrical/Automation
  })),
]

const DISCIPLINE_TO_CATS: Partial<Record<(typeof DISCIPLINES)[number]['id'], string[]>> = {
  electrical: ['Electrical'],
  mechanical: ['Mechanical'],
  hydraulic: ['Hydraulic'],
  pneumatic: ['Pneumatic'],
  automation: ['Automation'],
}


const DEMO_MANUAL: ManualDoc = {
  id: 'demo-atlas',
  name: 'Manual Atlas Copco GA55-GA75.pdf',
  size: '4.2 MB',
  pages: 98,
  isDemo: true,
  uploadedBy: 'sistema',
  uploadedAt: new Date(),
  chunks: [
    { text: 'ARRANQUE SEGURO: 1) Verificar nivel aceite MIN-MAX. 2) Abrir válvula suministro. 3) Verificar guardas. 4) Presionar START. 5) Esperar 30s vacío. 6) Cargar gradualmente a 7.5 bar. ⚠️ No superar 10 bar.', page: 14, doc: 'Manual Atlas Copco GA55-GA75.pdf' },
    { text: 'CÓDIGO E-041 — Sobrecalentamiento motor. CAUSAS: Filtro obstruido, aceite bajo, ventilación bloqueada, temperatura >45°C. SOLUCIÓN: 1) Parar equipo. 2) Limpiar filtro FA-001. 3) Verificar aceite SAE 40. 4) Despejar ventilación 50cm.', page: 37, doc: 'Manual Atlas Copco GA55-GA75.pdf' },
    { text: 'LUBRICACIÓN: Aceite Roto-Inject Plus 4000H, ISO 6743-3A. 4.5 litros. Cambio: 4000h o 12 meses. Rodamientos B1/B2: grasa PTFE cada 2000h.', page: 52, doc: 'Manual Atlas Copco GA55-GA75.pdf' },
    { text: 'TORQUES: Tapa culata M10→45Nm. Brida M8→25Nm. Tuerca base M12→65Nm. Pernos válvula M6→12Nm. ⚠️ Torquímetro calibrado obligatorio.', page: 61, doc: 'Manual Atlas Copco GA55-GA75.pdf' },
    { text: 'PREVENTIVO: 500h limpiar prefiltro. 2000h cambiar filtro aceite+separador. 4000h cambio aceite, revisar válvulas, calibrar termostato. 8000h overhaul general.', page: 78, doc: 'Manual Atlas Copco GA55-GA75.pdf' },
    { text: 'CAÍDA DE PRESIÓN — B3 Schuler: 1) Válvula proporcional desgastada. 2) Filtro hidráulico colapsado. 3) Nivel aceite bajo. 4) Fuga interna cilindro. Diagnóstico: medir presión en punto P1.', page: 44, doc: 'Manual Atlas Copco GA55-GA75.pdf' },
    { text: 'POST-PARADA EMERGENCIA: 1) Identificar causa en HMI. 2) Resolver causa raíz. 3) Resetear relé SR-001. 4) Restablecer presión gradualmente. 5) Ciclo vacío antes de producción.', page: 19, doc: 'Manual Atlas Copco GA55-GA75.pdf' },
  ],
}

// ── Helpers ────────────────────────────────────────────────────
function fmtSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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

// ── Component ──────────────────────────────────────────────────
const DocChat: React.FC = () => {
  const {
    apiBase, lmBase,
    discipline, docMachine, plant,
    docMessages, pushDocMessage,
    loading, setLoading,
    setDiscipline, setPlant, setDocMachine,
    selectedMachine, setSelectedMachine,
    user, lang,
  } = useAppContext()

  const [machinesCatalog, setMachinesCatalog] = useState<Array<{ id: number; name: string }>>([])
  const [machinesCatalogLoading, setMachinesCatalogLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const [input, setInput]           = useState('')
  const [manuals, setManuals]       = useState<ManualDoc[]>([DEMO_MANUAL])
  const [activeManualId, setActiveManualId] = useState<string>(DEMO_MANUAL.id)
  const [uploading, setUploading]   = useState(false)
  const [uploadPct, setUploadPct]   = useState(0)
  const [dragOver, setDragOver]     = useState(false)

  const areaRef    = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const t          = useMemo(() => getTranslations(lang), [lang])
  const isEs       = normalizeLang(lang) === 'es'

  // sync machine from navigation state
  useEffect(() => {
    if (selectedMachine && docMachine !== selectedMachine) setDocMachine(selectedMachine)
  }, [docMachine, selectedMachine, setDocMachine])

  useEffect(() => {
    if (location.state && typeof location.state === 'object') {
      const s = location.state as { machineId?: string; discipline?: string; plant?: string }
      if (s.machineId) { setSelectedMachine(s.machineId); setDocMachine(s.machineId) }
      if (s.discipline) setDiscipline(s.discipline)
      if (s.plant) setPlant(s.plant)
    }
  }, [location.state, setDocMachine, setDiscipline, setPlant, setSelectedMachine])

  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight
  }, [docMessages.length])

  // ── Active manual ──────────────────────────────────────────
  const activeManual = useMemo(() => manuals.find(m => m.id === activeManualId) ?? null, [manuals, activeManualId])

  // ── File processing ────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    setUploading(true)
    setUploadPct(10)

    // Try backend upload first
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'document')
      fd.append('context', 'document_library')
      const r = await fetch(`${apiBase.replace(/\/$/, '')}/upload`, {
        method: 'POST', body: fd,
        signal: AbortSignal.timeout(30_000),
      })
      if (r.ok) {
        const data = await r.json() as { fileId?: string; url?: string }
        setUploadPct(95)
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
    } catch (_) { /* fallback to local */ }

    // Local extraction
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
        text = strings.map(s => s.slice(1, -1)).join(' ')
          .replace(/[^\x20-\x7E\u00C0-\u024F\n ]/g, ' ')
          .replace(/\s+/g, ' ').trim()
        const pageMatches = raw.match(/\/Page\b/g)
        pageCount = pageMatches ? pageMatches.length : Math.max(1, Math.round(file.size / 4096))
      } else {
        text = await file.text().catch(() => '')
        pageCount = Math.max(1, Math.round(text.length / 3000))
      }
    } catch (_) { text = '' }

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
  }, [apiBase, user])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return
    for (const f of Array.from(files)) await processFile(f)
  }, [processFile])

  const removeManual = (id: string) => {
    setManuals(prev => prev.filter(m => m.id !== id))
    if (activeManualId === id) {
      setActiveManualId(manuals.find(m => m.id !== id)?.id ?? '')
    }
  }

  // ── Send message ───────────────────────────────────────────
  const send = async () => {
    const query = input.trim()
    if (!query || loading || !discipline) return
    setLoading(true)
    setInput('')

    // Mapear la máquina seleccionada del UI (ej: "motor-d1") al ID numérico real del backend
    let contextMachine: number | null = null
    if (docMachine !== 'all') {
      const selectedUi = MACHINES[docMachine]
      const selectedName = selectedUi?.name
      if (selectedName) {
        if (machinesCatalog.length === 0 && !machinesCatalogLoading) {
          setMachinesCatalogLoading(true)
          try {
            const r = await fetch(`${apiBase.replace(/\/$/, '')}/machines`, {
              method: 'GET',
              signal: AbortSignal.timeout(30_000),
            })
            if (r.ok) {
              const data = await r.json() as Array<{ id: number; name: string }>
              setMachinesCatalog(data)
            }
          } catch (_) { /* ignore mapping errors */ }
          finally { setMachinesCatalogLoading(false) }
        }
        const match = (machinesCatalog.length ? machinesCatalog : await (async () => {
          // fallback quick: si aún no cargó, intentar una segunda lectura
          try {
            const r = await fetch(`${apiBase.replace(/\/$/, '')}/machines`, { method: 'GET', signal: AbortSignal.timeout(30_000) })
            if (r.ok) return (await r.json()) as Array<{ id: number; name: string }>
          } catch (_) { /* ignore */ }
          return []
        })()) as Array<{ id: number; name: string }>
        const found = match.find(m => m.name === selectedName)
        if (found?.id != null) contextMachine = found.id
      }
    }
    const el = document.getElementById('doc-input')
    if (el) (el as HTMLTextAreaElement).style.height = 'auto'

    pushDocMessage({ role: 'user', content: query, timestamp: Date.now() })

    // 1) Try FastAPI backend /chat (real)
    try {
      const r = await fetch(`${apiBase.replace(/\/$/, '')}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context_machine: contextMachine,
          language: normalizeLang(lang),
        }),
        signal: AbortSignal.timeout(30_000),
      })

      if (r.ok) {
        const data = await r.json() as ChatApiResponse
        pushDocMessage({ role: 'assistant', content: data.reply, timestamp: Date.now() })
        setLoading(false)
        return
      }

      // HTTP error (ex: 503 LM Studio apagado)
      if (r.status === 503) {
        const friendly = isEs
          ? 'El asistente está desconectado temporalmente (LM Studio no está disponible). Intenta nuevamente en unos segundos.'
          : 'The assistant is temporarily disconnected (LM Studio is not available). Please try again in a few seconds.'
        pushDocMessage({ role: 'assistant', content: friendly, timestamp: Date.now() })
        setLoading(false)
        return
      }
    } catch (_) { /* fallback */ }

    // 2) LM Studio direct
    const chunks = retrieveFromManual(query, activeManual?.chunks ?? [])
    const ctx = chunks.length
      ? chunks.map((c, i) => `[FRAGMENTO ${i + 1} — ${c.doc} p.${c.page}]\n${c.text}`).join('\n\n')
      : '[Sin manual cargado — responde con conocimiento general de mantenimiento industrial]'
    const machineName = docMachine !== 'all' && MACHINES[docMachine] ? MACHINES[docMachine].name : null
    const manualNote  = activeManual ? `Manual activo: ${activeManual.name}.` : ''
    const system = `Eres BARB, asistente experto en mantenimiento industrial. Disciplina: ${discipline}. ${machineName ? 'Equipo: ' + machineName + '.' : ''} ${manualNote}\nResponde en ${isEs ? 'español' : 'inglés'}, paso a paso, citando página del manual cuando disponible. Usa ⚠️ para advertencias de seguridad.\n\nCONTEXTO MANUAL:\n${ctx}`

    try {
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
            ...docMessages.slice(-4).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: query },
          ],
        }),
        signal: AbortSignal.timeout(90_000),
      })
      if (r.ok) {
        const data = await r.json() as { choices?: Array<{ message: { content: string } }> }
        const answer = data.choices?.[0]?.message?.content ?? ''
        pushDocMessage({ role: 'assistant', content: answer, timestamp: Date.now() })
        setLoading(false)
        return
      }
    } catch (_) { /* demo fallback */ }

    // 3) Demo fallback
    const demoAns = chunks.length
      ? `**[DEMO — sin backend activo]**\n\nBasado en el manual:\n\n${chunks[0].text}\n\n*Inicia LM Studio (${lmBase}) o el backend FastAPI (${apiBase}) para respuestas inteligentes.*`
      : `**[DEMO]** No hay contexto disponible. Carga un manual PDF o inicia el backend.`
    pushDocMessage({ role: 'assistant', content: demoAns, timestamp: Date.now() })
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
  }

  const currentPlant = PLANTS.find(p => p.id === plant) ?? PLANTS[0]
  const langKey = normalizeLang(lang) as 'es' | 'en'

  const filteredMachineGroups = useMemo(() => {
    if (!discipline) return MACHINE_GROUPS
    const cats = DISCIPLINE_TO_CATS[discipline] ?? []
    if (!cats.length) return MACHINE_GROUPS
    return MACHINE_GROUPS.filter(m => m.id === 'all' || cats.includes((m as any).cat))
  }, [discipline])

  useEffect(() => {
    if (!discipline) return
    if (!docMachine) return

    if (docMachine === 'all') return

    const allowed = filteredMachineGroups.some(m => m.id === docMachine)
    if (!allowed) {
      setDocMachine('all')
      setSelectedMachine(null)
    }
  }, [discipline, docMachine, filteredMachineGroups, setDocMachine, setSelectedMachine])

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="two-panel w-full h-full">

      {/* ── LEFT PANEL ── */}
      <div className="panel-left">

        {/* 1. Manual Library */}
        <div className="panel-section">
          <span className="panel-label">
            📚 {isEs ? 'Biblioteca de manuales' : 'Manual Library'}
            <span className="ml-count">{manuals.length}</span>
          </span>

          {/* Upload zone */}
          <div
            className={`upload-zone${dragOver ? ' dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); void handleFiles(e.dataTransfer.files) }}
            role="button"
            aria-label={isEs ? 'Cargar manual' : 'Upload manual'}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>📄</div>
            <strong>{isEs ? 'Cargar manual' : 'Upload manual'}</strong>
            <p>PDF · TXT · MD{isEs ? ' · Arrastra aquí' : ' · Drag & drop'}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx,.md"
            multiple
            aria-label={isEs ? 'Cargar manual' : 'Upload manual'}
            title={isEs ? 'Cargar manual PDF/TXT/MD' : 'Upload PDF/TXT/MD manual'}
            style={{ display: 'none' }}
            onChange={e => { void handleFiles(e.target.files); e.target.value = '' }}
          />

          {/* Upload progress */}
          {uploading && (
            <div className="upload-progress">
              <div className="upload-progress-fill" style={{ width: `${uploadPct}%` }} />
            </div>
          )}

          {/* Manual list */}
          <div className="manual-list-scroll">
            {manuals.map(m => {
              const active = m.id === activeManualId
              const meta   = [m.pages ? m.pages + 'p' : '', m.size, m.chunks.length ? m.chunks.length + 'f' : ''].filter(Boolean).join(' · ')
              return (
                <button
                  key={m.id}
                  className={`manual-item${active ? ' active' : ''}`}
                  onClick={() => setActiveManualId(m.id)}
                  title={m.name}
                >
                  <div className="mi-icon">{guessIcon(m.name)}</div>
                  <div className="mi-body">
                    <div className="mi-name">{m.name}</div>
                    <div className="mi-meta">{meta || (isEs ? 'indexando…' : 'indexing…')}</div>
                  </div>
                  <span className={`mi-badge${m.isDemo ? ' demo' : ''}`}>
                    {m.isDemo ? 'DEMO' : m.uploadedBy}
                  </span>
                  {!m.isDemo && (
                    <button
                      className="mi-remove"
                      onClick={e => { e.stopPropagation(); removeManual(m.id) }}
                      aria-label={isEs ? 'Eliminar manual' : 'Remove manual'}
                    >✕</button>
                  )}
                </button>
              )
            })}
            {manuals.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--ink3)', textAlign: 'center', padding: '8px 0' }}>
                {isEs ? 'Sin manuales — carga uno arriba' : 'No manuals — upload one above'}
              </div>
            )}
          </div>
        </div>

        <div className="lib-sep" />

        {/* 2. Plant */}
        <div className="panel-section">
          <span className="panel-label">{isEs ? 'Planta / Ubicación' : 'Plant / Location'}</span>
          <select
            aria-label={isEs ? 'Seleccionar planta' : 'Select plant'}
            className="form-select"
            value={plant}
            onChange={e => setPlant(e.target.value)}
            disabled={loading}
          >
            {PLANTS.map(p => <option key={p.id} value={p.id}>{p.label[langKey]}</option>)}
          </select>
        </div>

        {/* 3. Discipline */}
        <div className="panel-section">
          <span className="panel-label">{isEs ? 'Disciplina' : 'Discipline'}</span>
          <div className="disc-list">
            {DISCIPLINES.map(d => (
              <button
                key={d.id}
                className={`disc-pill${discipline === d.id ? ' active' : ''}`}
                data-d={d.id}
                onClick={() => setDiscipline(discipline === d.id ? null : d.id)}
                disabled={loading}
              >
                <span className="disc-dot" />
                {d.icon} {d.id.charAt(0).toUpperCase() + d.id.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Machine */}
        <div className="panel-section">
          <span className="panel-label">{isEs ? 'Máquina (opcional)' : 'Machine (optional)'}</span>
          <div className="machine-sel-list">
            {MACHINE_GROUPS.map(m => (
              <button
                key={m.id}
                className={`machine-sel-item${docMachine === m.id ? ' active' : ''}`}
                onClick={() => {
                  setDocMachine(m.id)
                  if (m.id !== 'all') setSelectedMachine(m.id)
                }}
                disabled={loading}
              >
                <span className={`msi-dot ${m.status}`} />
                <div>
                  <div className="msi-name">{m.label[langKey]}</div>
                  {'model' in m && m.model ? <div className="msi-model">{m.model}</div> : null}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="panel-right">

        {/* Active manual bar */}
        {activeManual && (
          <div className="manual-active-bar">
            <span style={{ fontSize: 14 }}>📖</span>
            <span className="mab-name">{activeManual.name}</span>
            <span className="mab-meta">
              {[activeManual.pages ? activeManual.pages + 'p' : '', activeManual.chunks.length ? activeManual.chunks.length + ' fragmentos' : ''].filter(Boolean).join(' · ')}
            </span>
            <span className="mab-clear" onClick={() => setActiveManualId('')} title={isEs ? 'Deseleccionar' : 'Clear'}>✕</span>
          </div>
        )}

        {/* Context tags */}
        <div className="context-tags" style={{ flexShrink: 0 }}>
          {!discipline ? (
            <span className="ctx-empty">
              {isEs ? 'Selecciona una disciplina para empezar a chatear con la documentación' : 'Select a discipline to start chatting with documentation'}
            </span>
          ) : (
            <>
              <span className="ctx-tag plant">📍 {currentPlant.label[langKey]}</span>
              {activeManual && (
                <span className="ctx-tag" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                  📖 {activeManual.name.length > 26 ? activeManual.name.slice(0, 24) + '…' : activeManual.name}
                </span>
              )}
              <span className={`ctx-tag ${
                discipline === 'electrical' ? 'disc-el' :
                discipline === 'mechanical' ? 'disc-me' :
                discipline === 'hydraulic'  ? 'disc-hy' :
                discipline === 'pneumatic'  ? 'disc-pn' : 'disc-au'
              }`}>
                ◉ {DISCIPLINES.find(d => d.id === discipline)?.icon} {discipline}
              </span>
              {docMachine !== 'all' && MACHINES[docMachine] && (
                <span className="ctx-tag machine">⚙ {MACHINES[docMachine].name}</span>
              )}
            </>
          )}
        </div>

        {/* Messages */}
        <div className="chat-messages" ref={areaRef}>
          {docMessages.length === 0 ? (
            <div className="chat-empty">
              <div style={{ fontSize: 44, marginBottom: 12, opacity: 0.4 }}>💬</div>
              <h3 style={{ fontSize: 16, color: 'var(--ink2)', marginBottom: 8, fontWeight: 500 }}>
                {!activeManualId
                  ? (isEs ? 'Selecciona un manual de la biblioteca' : 'Select a manual from the library')
                  : !discipline
                    ? (isEs ? 'Selecciona una disciplina para empezar' : 'Select a discipline to start')
                    : (isEs ? 'Haz tu primera pregunta' : 'Ask your first question')
                }
              </h3>
              <p style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.6 }}>
                {isEs
                  ? 'Puedes cambiar planta, disciplina y máquina desde el panel lateral. Carga un manual PDF para activar el RAG.'
                  : 'Change plant, discipline and machine from the side panel. Upload a PDF manual to activate RAG.'}
              </p>
              <button
                className="btn btn-outline btn-sm"
                style={{ marginTop: 16, width: 200 }}
                onClick={() => fileInputRef.current?.click()}
              >
                📄 {isEs ? 'Cargar manual ahora' : 'Upload manual now'}
              </button>
            </div>
          ) : (
            docMessages.map((m, i) => (
              <ChatBubble key={i} msg={m} side={m.role === 'user' ? 'user' : 'bot'} />
            ))
          )}
          {loading && <div className="mt-md"><Thinking /></div>}
        </div>

        {/* Input */}
        <div className="input-zone" style={{ flexShrink: 0 }}>
          <div className="input-wrap">
            <label htmlFor="doc-input" className="sr-only">
              {isEs ? 'Escribe tu pregunta' : 'Type your question'}
            </label>
            <textarea
              id="doc-input"
              value={input}
              title={isEs ? 'Escribe tu pregunta' : 'Type your question'}
              aria-label={isEs ? 'Escribe tu pregunta para el asistente' : 'Type your question for the assistant'}
              onChange={e => { setInput(e.target.value); e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 100) + 'px' }}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={isEs ? 'Pregunta por procedimientos, especificaciones, mantenimiento…' : 'Ask about procedures, specifications, maintenance…'}
              disabled={!discipline || loading}
              className="flex-1 resize-none overflow-hidden bg-transparent border-none outline-none text-[13px] text-[var(--ink)] placeholder-[var(--ink3)]"
            />
            <button
              title={isEs ? 'Enviar mensaje' : 'Send message'}
              aria-label={isEs ? 'Enviar' : 'Send'}
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
            {isEs ? 'Enter para enviar · Shift+Enter nueva línea · ' : 'Enter to send · Shift+Enter new line · '}
            {activeManual ? `📖 ${activeManual.name.slice(0, 30)}` : 'Powered by FastAPI + LM Studio'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocChat
