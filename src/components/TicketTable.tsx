import React from 'react'
import { WorkOrder } from '../types'
import { WO_STATUS_LABEL } from '../services/workOrders'

const durClass = (min?: number | null) => {
  if (min == null) return '';
  if (min <= 35) return 'fast';
  if (min <= 60) return 'medium';
  return 'slow';
}

const formatDuration = (createdAt?: string, closedAt?: string) => {
  if (!createdAt) return '—'
  const end = closedAt ? new Date(closedAt).getTime() : Date.now()
  const mins = Math.round((end - new Date(createdAt).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

const TicketTable: React.FC<{ tickets: WorkOrder[]; onSelect?: (id: string) => void }> = ({ tickets, onSelect }) => {
  return (
    <div className="ot-table-wrap">
      <table className="ot-table">
        <thead>
          <tr>
            <th>N° OT</th>
            <th>Máquina</th>
            <th>Problema</th>
            <th>Técnico</th>
            <th>Inicio</th>
            <th>Cierre</th>
            <th>Duración</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(t => (
            <tr key={t.id} onClick={() => onSelect && onSelect(t.id)} style={{ cursor: 'pointer' }}>
              <td><span className="ot-num">{t.id}</span></td>
              <td><span className="ot-machine">{t.title}</span><br/><span style={{ fontSize: '10px', color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>{t.machineId || '—'}</span></td>
              <td>{t.description?.slice(0, 30) || '—'}</td>
              <td><span className="ot-tech">{t.createdBy || 'operator'}</span></td>
              <td><span className="ot-ts">{t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</span></td>
              <td><span className="ot-ts">{t.closedAt ? new Date(t.closedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</span></td>
              <td><span className={`ot-dur ${durClass(t.duration)}`}>{formatDuration(t.createdAt, t.closedAt)}</span></td>
              <td><span className={`ot-badge ${t.status}`}>{t.status === 'in_progress' && <span className="ot-live-dot" />}{WO_STATUS_LABEL[t.status as any]}</span></td>
              <td>
                <button onClick={(e) => { e.stopPropagation(); onSelect && onSelect(t.id); }} className="btn btn-sm btn-outline" style={{ fontSize: '10px', padding: '4px 8px' }}>Ver</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TicketTable
