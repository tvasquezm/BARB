import React, { useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import MACHINES from '../data/machines'
import { useNavigate } from 'react-router-dom'

type MachineNode = {
  id: string
  name: string
  x: number
  y: number
  w: number
  h: number
  icon: string
  cat: string
  status: 'operational' | 'warning' | 'maintenance' | 'offline'
  stroke: string
}

const NODES: MachineNode[] = [
  { id: 'motor-d1', name: 'Motor Drive D1', x: 140, y: 100, w: 120, h: 80, icon: '⚡', cat: 'Electrical', status: 'maintenance', stroke: '#a06a00' },
  { id: 'cnc-c2', name: 'CNC Mill C2',    x: 338, y: 58,  w: 120, h: 80, icon: '⚙️', cat: 'Mechanical', status: 'operational', stroke: '#1a5fa8' },
  { id: 'comp-a1', name: 'Compressor A1',  x: 558, y: 90,  w: 124, h: 80, icon: '💨', cat: 'Pneumatic', status: 'operational', stroke: '#5e3db3' },
  { id: 'plc',     name: 'PLC Controller', x: 320, y: 265, w: 120, h: 80, icon: '🤖', cat: 'Automation', status: 'operational', stroke: '#1a7a50' },
  { id: 'press-b3',name: 'Hydraulic Press B3', x: 618, y: 270, w: 132, h: 80, icon: '💧', cat: 'Hydraulic', status: 'warning', stroke: '#0e7490' },
]

const INITIAL_VB = { x: 0, y: 0, w: 900, h: 480 }

const PlantTopology: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { setSelectedMachine } = useAppContext()
  const navigate = useNavigate()
  const [viewBox, setViewBox] = useState(INITIAL_VB)
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; node?: MachineNode }>({ visible: false, x: 0, y: 0 })

  const handleNodeClick = (node: MachineNode, e: React.MouseEvent) => {
    // position tooltip relative to container
    const rect = containerRef.current?.getBoundingClientRect()
    const cx = e.clientX - (rect?.left || 0)
    const cy = e.clientY - (rect?.top || 0)
    setTooltip({ visible: true, x: cx, y: cy, node })
  }

  const goToDebug = (nodeId?: string) => {
    if (nodeId) setSelectedMachine(nodeId)
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

  return (
    <div className="topology-body h-full" ref={containerRef}>
      <div className="topology-toolbar">
        <div className="topo-title">Plant Topology</div>
        <div className="topo-btns">
          <button className="btn btn-outline btn-sm" onClick={() => zoom(1.2)}>＋ Zoom In</button>
          <button className="btn btn-outline btn-sm" onClick={() => zoom(0.8)}>－ Zoom Out</button>
          <button className="btn btn-outline btn-sm" onClick={reset}>Reset View</button>
        </div>
      </div>

      <div className="topo-canvas shadow-soft" style={{ flex: 1, minHeight: 0 }}>
        <svg ref={svgRef} id="topo-svg" viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
          {/* connection lines (kept static as in original) */}
          <g id="topo-lines" stroke="#cfcfcf" strokeWidth={2} fill="none">
            <line x1="200" y1="160" x2="400" y2="120" strokeDasharray="6,3" opacity="0.7" />
            <line x1="400" y1="120" x2="620" y2="150" opacity="0.7" />
            <line x1="400" y1="120" x2="390" y2="320" opacity="0.7" />
            <line x1="200" y1="160" x2="390" y2="320" strokeDasharray="6,3" opacity="0.5" />
            <line x1="620" y1="150" x2="680" y2="330" opacity="0.5" />
          </g>

          {NODES.map(n => {
            const m = MACHINES[n.id]
            const node = m ? { ...n, name: m.name, icon: m.icon, cat: m.cat, status: (m.status as any) || n.status } : n
            return (
            <g key={n.id} transform={`translate(${n.x},${n.y})`} style={{ cursor: 'pointer' }} onClick={(e) => handleNodeClick(n, e)}>
              <rect x={0} y={0} width={n.w} height={n.h} rx={12} fill="var(--surface)" stroke={n.stroke} strokeWidth={2} />
              <text x={n.w / 2} y={28} textAnchor="middle" fontSize={22}>{node.icon}</text>
              <text x={n.w / 2} y={50} textAnchor="middle" fontSize={11} fill="var(--ink)" fontWeight={600}>{node.name}</text>
              <text x={n.w / 2} y={65} textAnchor="middle" fontSize={10} fill="var(--ink3)">{node.cat}</text>
              <circle cx={n.w - 14} cy={14} r={7} fill={node.status === 'operational' ? '#3ecf8e' : node.status === 'warning' ? '#a06a00' : node.status === 'maintenance' ? '#1a5fa8' : '#6b7280'} />
            </g>
          )})}
        </svg>
        {tooltip.visible && tooltip.node && (
          <div style={{ position: 'absolute', left: tooltip.x + 12, top: tooltip.y + 12, zIndex: 60 }} className="bg-white dark:bg-gray-800 p-3 rounded shadow">
            <div className="font-semibold">{tooltip.node.name}</div>
            <div className="text-sm text-gray-500">{tooltip.node.cat} · {tooltip.node.status}</div>
            <div className="mt-2 flex gap-2">
              <button className="px-2 py-1 bg-blue-600 text-white rounded text-sm" onClick={() => goToDebug(tooltip.node?.id)}>Go to Debug</button>
              <button className="px-2 py-1 bg-gray-100 rounded text-sm" onClick={() => navigate(`/memory/${tooltip.node?.id}`)}>History</button>
              <button className="px-2 py-1 bg-transparent text-sm" onClick={() => setTooltip({ visible: false, x: 0, y: 0 })}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlantTopology
