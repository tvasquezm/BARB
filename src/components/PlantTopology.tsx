import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { getTranslations } from '../utils/i18n'

// Definición de tipos adaptada a la base de datos real
type BackendNode = {
  nodo_id: number
  nombre: string
  tipo: string
  estado: 'operational' | 'warning' | 'error' | 'offline'
  position_x: number
  position_y: number
  maquina_id: number
  planta_id: number
  w?: number
  h?: number
  icon?: string
}

type BackendConnection = {
  conexion_id: number
  nodo_origen_id: number
  nodo_destino_id: number
  tipo: string
}

const INITIAL_VB = { x: 0, y: 0, w: 900, h: 480 }

const statusColor = (estado: BackendNode['estado']) => {
  if (estado === 'operational') return '#3ecf8e'
  if (estado === 'warning') return '#d97706'
  if (estado === 'error') return '#ef4444'
  return '#6b7280'
}

const getNodeIcon = (tipo: string) => {
  if (tipo === 'hub') return '💻'
  if (tipo === 'controller') return '🤖'
  if (tipo === 'machine') return '⚙️'
  if (tipo === 'sensor') return '🔌'
  return '📦'
}

const PlantTopology: React.FC = () => {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement | null>(null)
  // Referencia añadida específicamente para controlar el scroll del contenedor oscuro
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  
  const { lang, selectedMachine, setSelectedMachine } = useAppContext()
  const t = useMemo(() => getTranslations(lang), [lang])

  const [nodos, setNodos] = useState<BackendNode[]>([])
  const [conexiones, setConexiones] = useState<BackendConnection[]>([])
  const [cargando, setCargando] = useState(true)

  const [viewBox, setViewBox] = useState(INITIAL_VB)
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; node?: BackendNode }>({
    visible: false,
    x: 0,
    y: 0,
  })

  // Estados para controlar el arrastre del mouse (Pan & Drag)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)

  useEffect(() => {
    fetch('http://localhost:9000/api/topologia')
      .then(response => response.json())
      .then(data => {
        const nodosProcesados = (data.nodos || []).map((n: any) => ({
          ...n,
          w: n.w || 140,
          h: n.h || 80,
          icon: getNodeIcon(n.tipo)
        }))
        setNodos(nodosProcesados)
        setConexiones(data.conexiones || [])
        setCargando(false)
      })
      .catch(error => {
        console.error("Error cargando la topología real:", error)
        setCargando(false)
      })
  }, [])

  const selectedNode = useMemo(
    () => nodos.find(node => String(node.nodo_id) === String(selectedMachine)) ?? null,
    [selectedMachine, nodos],
  )

  const handleNodeClick = (node: BackendNode, e: React.MouseEvent) => {
    // Si el usuario estaba arrastrando, evitamos abrir el tooltip por accidente
    if (isDragging) return

    const rect = containerRef.current?.getBoundingClientRect()
    const cx = e.clientX - (rect?.left || 0)
    const cy = e.clientY - (rect?.top || 0)

    setSelectedMachine(String(node.nodo_id))
    setTooltip({ visible: true, x: cx, y: cy, node })
  }

  const goToDebug = (nodeId?: number) => {
    const machineId = nodeId ? String(nodeId) : selectedMachine
    if (machineId) setSelectedMachine(machineId)
    navigate('/debug')
  }

  const zoom = (factor: number) => {
    const cx = viewBox.x + viewBox.w / 2
    const cy = viewBox.y + viewBox.h / 2
    const nw = viewBox.w / factor
    const nh = viewBox.h / factor
    setViewBox({ x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh })
  }

  const reset = () => setViewBox(INITIAL_VB)
  const closeTooltip = () => setTooltip({ visible: false, x: 0, y: 0 })

  // 🚀 LÓGICA DE ARRASTRE: Guarda la posición inicial del clic
  const handleMouseDown = (e: React.MouseEvent) => {
    const targetElement = e.target as HTMLElement
    // Solo arrastramos si hace clic en el fondo, en las líneas de conexión o en la caja contenedora
    if (
      targetElement.tagName === 'svg' || 
      targetElement.id === 'topo-lines' || 
      targetElement.tagName === 'line' ||
      targetElement.getAttribute('data-canvas') === 'true'
    ) {
      setIsDragging(true)
      setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0))
      setStartY(e.pageY - (scrollContainerRef.current?.offsetTop || 0))
      setScrollLeft(scrollContainerRef.current?.scrollLeft || 0)
      setScrollTop(scrollContainerRef.current?.scrollTop || 0)
    }
  }

  // 🚀 LÓGICA DE ARRASTRE: Calcula la distancia movida y desplaza el contenedor
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const y = e.pageY - scrollContainerRef.current.offsetTop
    const walkX = (x - startX) * 1.5 // Multiplicador de velocidad de arrastre X
    const walkY = (y - startY) * 1.5 // Multiplicador de velocidad de arrastre Y
    
    scrollContainerRef.current.scrollLeft = scrollLeft - walkX
    scrollContainerRef.current.scrollTop = scrollTop - walkY
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  if (cargando) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        Cargando topología de la máquina...
      </div>
    )
  }

  return (
    <div className="topology-body h-full flex flex-col" ref={containerRef}>
      <div className="topology-toolbar flex justify-between items-center p-4">
        <div>
          <div className="topo-title font-bold text-xl">{t.topology.title}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink3)' }}>
            {selectedNode ? `${t.topology.selectedMachine}: ${selectedNode.nombre}` : t.topology.noMachineSelected}
          </div>
        </div>
        <div className="topo-btns flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={() => zoom(1.2)}>
            ＋ {t.topology.zoomIn}
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => zoom(0.8)}>
            － {t.topology.zoomOut}
          </button>
          <button className="btn btn-outline btn-sm" onClick={reset}>
            {t.topology.resetView}
          </button>
        </div>
      </div>

      {/* CONTENEDOR 1: Ahora maneja el evento de arrastre del mouse (Mousedown, Mousemove, Mouseup) */}
      <div 
        ref={scrollContainerRef}
        className="topo-canvas shadow-soft flex-1 relative m-4 rounded-xl bg-slate-900" 
        style={{ 
          minHeight: 0, 
          overflow: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab' 
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* CONTENEDOR 2: Mantiene el tamaño físico amplio para dar espacio al mapa */}
        <div data-canvas="true" style={{ width: '1600px', height: '1200px', position: 'relative' }}>
          <svg
            id="topo-svg"
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full select-none"
          >
            {/* Renderizado de líneas dinámicas */}
            <g id="topo-lines" stroke="#475569" strokeWidth={2} fill="none">
              {conexiones.map(conn => {
                const origen = nodos.find(n => n.nodo_id === conn.nodo_origen_id)
                const destino = nodos.find(n => n.nodo_id === conn.nodo_destino_id)
                
                if (!origen || !destino) return null

                const x1 = origen.position_x + (origen.w || 140) / 2
                const y1 = origen.position_y + (origen.h || 80) / 2
                const x2 = destino.position_x + (destino.w || 140) / 2
                const y2 = destino.position_y + (destino.h || 80) / 2

                return (
                  <line 
                    key={conn.conexion_id} 
                    x1={x1} 
                    y1={y1} 
                    x2={x2} 
                    y2={y2} 
                    strokeDasharray={conn.tipo === 'data' ? '6,3' : undefined}
                    opacity={0.8} 
                  />
                )
              })}
            </g>

            {/* Renderizado de nodos dinámicos */}
            {nodos.map(node => {
              const isSelected = selectedMachine === String(node.nodo_id)
              const width = node.w || 140
              const height = node.h || 80

              return (
                <g
                  key={node.nodo_id}
                  transform={`translate(${node.position_x},${node.position_y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={e => handleNodeClick(node, e)}
                >
                  <rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    rx={12}
                    fill="#1e293b"
                    stroke={isSelected ? '#3b82f6' : '#334155'}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                  <text x={width / 2} y={26} textAnchor="middle" fontSize={20}>
                    {node.icon}
                  </text>
                  <text x={width / 2} y={48} textAnchor="middle" fontSize={11} fill="#f8fafc" fontWeight={600}>
                    {node.nombre}
                  </text>
                  <text x={width / 2} y={64} textAnchor="middle" fontSize={9} fill="#94a3b8">
                    {node.tipo.toUpperCase()}
                  </text>
                  <circle cx={width - 14} cy={14} r={6} fill={statusColor(node.estado)} />
                </g>
              )
            })}
          </svg>

          {/* Tooltip interactivo flotante */}
          {tooltip.visible && tooltip.node && (
            <div
              className="absolute p-4 rounded-xl border bg-slate-800 text-white shadow-xl"
              style={{
                left: tooltip.x + 12,
                top: tooltip.y + 12,
                zIndex: 60,
                minWidth: 240,
                borderColor: '#334155',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xl">{tooltip.node.icon}</div>
                <div className="font-bold text-sm">{tooltip.node.nombre}</div>
              </div>
              <div className="text-xs text-slate-400 mb-4">
                Categoría: {tooltip.node.tipo.toUpperCase()} · Estado: {tooltip.node.estado}
              </div>
              <div className="grid gap-2 grid-cols-1">
                <button className="btn btn-sm btn-primary bg-blue-600 hover:bg-blue-700 text-white py-1 rounded" onClick={() => goToDebug(tooltip.node?.nodo_id)}>
                  {t.topology.goToDebug}
                </button>
                <button className="btn btn-sm btn-outline border border-slate-600 hover:bg-slate-700 py-1 rounded" onClick={closeTooltip}>
                  {t.topology.close}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlantTopology;