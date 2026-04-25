import React, { useMemo, useState } from 'react'
import { seedDemoTickets, computeMTTR, filterTickets, WO_STATUSES } from '../services/workOrders'
import TicketTable from '../components/TicketTable'
import { WorkOrder } from '../types'
import TicketDetailModal from '../components/TicketDetailModal'
import { showToast } from '../components/Toast'

const Dashboard: React.FC = () => {
  // Estado inicial cargado desde las semillas de demostración
  const [tickets, setTickets] = useState<WorkOrder[]>(() => seedDemoTickets())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [machineFilter, setMachineFilter] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [selectedTicket, setSelectedTicket] = useState<WorkOrder | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString('es-CL'))

  // Cálculos de KPIs basados en el estado actual de los tickets
  const total = tickets.length
  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length
  const closedCount = tickets.filter(t => t.status === 'done' || t.status === 'closed').length
  const mttr = computeMTTR(tickets)

  // Memorización de los tickets filtrados para optimizar el rendimiento
  const filtered = useMemo(() => 
    filterTickets(tickets, { status: statusFilter, machineId: machineFilter, search }), 
    [tickets, statusFilter, machineFilter, search]
  )

  // Cálculos para la sección inferior (Timeline y Top Machines)
  const timelineTickets = useMemo(() => {
    return tickets
      .map(t => {
        const duration = t.closedAt
          ? Math.round((new Date(t.closedAt).getTime() - new Date(t.createdAt).getTime()) / 60000)
          : null
        return { ...t, computedDuration: duration }
      })
      .filter(t => t.computedDuration != null)
      .slice(0, 8)
  }, [tickets])
  const maxDuration = Math.max(...timelineTickets.map(t => t.computedDuration || 0), 60)

  const topMachines = useMemo(() => {
    const counts: Record<string, number> = {}
    tickets.forEach(t => { const name = t.title?.split('—')?.[0]?.trim() || t.machineId || 'Desconocida'; counts[name] = (counts[name] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [tickets])
  const maxMachineCount = topMachines[0]?.[1] || 1

  const formatDur = (min?: number | null) => { if (min == null) return '—'; if (min < 60) return min + 'm'; return Math.floor(min / 60) + 'h ' + (min % 60) + 'm'; }

  const handleSelect = (id: string) => {
    const t = tickets.find(x => x.id === id) || null
    setSelectedTicket(t)
  }

  const handleUpdateStatus = (id: string, status: WorkOrder['status']) => {
    const now = new Date().toISOString()
    
    setTickets(prev => prev.map(t => 
      t.id === id ? { 
        ...t, 
        status, 
        closedAt: (status === 'done' || status === 'closed') ? (t.closedAt || now) : t.closedAt 
      } : t
    ))

    // Actualizar el ticket seleccionado si el modal está abierto
    setSelectedTicket(prev => 
      prev && prev.id === id ? { 
        ...prev, 
        status, 
        closedAt: (status === 'done' || status === 'closed') ? (prev.closedAt || now) : prev.closedAt 
      } : prev
    )
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      setLastRefresh(new Date().toLocaleTimeString('es-CL'))
      showToast('✅ OTs Actualizadas correctamente')
    }, 600)
  }

  return (
    <div className="dashboard-body">
      {/* Grid de KPIs */}
      <div className="dash-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-top"><div className="kpi-icon" style={{ background: 'var(--blue-bg)' }}>📋</div><svg width="40" height="24"><polyline points="0,20 10,10 20,15 30,5 40,8" fill="none" stroke="var(--ink2)" strokeWidth="2"/></svg></div>
          <div className="kpi-num">{total}</div>
          <div className="kpi-label">Total OTs</div>
          <div className="kpi-delta up">↑ {total} en el período</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-top"><div className="kpi-icon" style={{ background: 'var(--amber-bg)' }}>🔄</div></div>
          <div className="kpi-num" style={{ color: 'var(--amber)' }}>{openCount}</div>
          <div className="kpi-label">Open / Active</div>
          <div className="kpi-delta">— en progreso</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-top"><div className="kpi-icon" style={{ background: 'var(--green-bg)' }}>✅</div></div>
          <div className="kpi-num" style={{ color: 'var(--green)' }}>{closedCount}</div>
          <div className="kpi-label">Completed</div>
          <div className="kpi-delta up">— resueltas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-top"><div className="kpi-icon" style={{ background: 'var(--accent-bg)' }}>⏱</div></div>
          <div className="kpi-num" style={{ color: 'var(--accent)' }}>{mttr}</div>
          <div className="kpi-label">MTTR (min)</div>
          <div className="kpi-delta">— vs objetivo 35 min</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="dash-filters">
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)} 
          className="filter-select"
        >
          <option value="all">All Statuses</option>
          {WO_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        
        <select 
          value={machineFilter} 
          onChange={e => setMachineFilter(e.target.value)} 
          className="filter-select"
        >
          <option value="all">All Machines</option>
          <option value="comp-a1">Compressor A1</option>
          <option value="press-b3">Hydraulic Press B3</option>
          <option value="cnc-c2">CNC Mill C2</option>
          <option value="motor-d1">Motor Drive D1</option>
        </select>

        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search OTs, technicians..." 
          className="filter-search"
        />
        <button className="dash-refresh-btn" onClick={handleRefresh}>
          <svg className={isRefreshing ? 'spinning' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Actualizar
        </button>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--ink3)' }}>
          Actualizado: {lastRefresh}
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="dash-section-title">Órdenes de Trabajo <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--ink3)' }}>{filtered.length} registros</span></div>
      <TicketTable tickets={filtered} onSelect={handleSelect} />

      {/* Bottom row: timeline + top machines */}
      <div className="dash-bottom">
        <div className="timeline-card">
          <div className="dash-section-title">Tiempo de resolución por OT <span>duración real</span></div>
          <div className="timeline-bar-wrap">
            {timelineTickets.length === 0 ? <div style={{color:'var(--ink3)',fontSize:'12px',textAlign:'center',padding:'16px'}}>Sin datos</div> : timelineTickets.map(t => (
              <div key={t.id} className="tl-row">
                <div className="tl-label" title={t.title}>{t.id}</div>
                <div className="tl-bar-bg">
                <div className="tl-bar" style={{ width: `${Math.round(((t.computedDuration || 0) / maxDuration) * 100)}%`, background: (t.computedDuration || 0) <= 35 ? 'var(--green)' : (t.computedDuration || 0) <= 60 ? 'var(--amber)' : '#c0281e' }} />
                <span className="tl-bar-label">{formatDur(t.computedDuration)}</span>
                </div>
              <div className="tl-time">{formatDur(t.computedDuration)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="top-machines-card">
          <div className="dash-section-title">Top máquinas con fallas <span>período</span></div>
          <div>
            {topMachines.map(([name, count], i) => (
              <div key={name} className="tm-row">
                <div className="tm-rank">{i + 1}</div>
                <div className="tm-info"><div className="tm-name">{name}</div><div className="tm-count">{count} OT{count !== 1 ? 's' : ''}</div></div>
                <div className="tm-bar-mini"><div className="tm-bar-fill" style={{ width: `${Math.round((count / maxMachineCount) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Detalle */}
      <TicketDetailModal 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        onUpdateStatus={handleUpdateStatus} 
      />
    </div>
  )
}

export default Dashboard
