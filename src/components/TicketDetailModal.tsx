import React from 'react'
import { WorkOrder } from '../types'
import { WO_STATUSES, WO_STATUS_LABEL } from '../services/workOrders'
import { showToast } from './Toast'

interface Props {
  ticket: WorkOrder | null
  onClose: () => void
  onUpdateStatus: (id: string, status: WorkOrder['status']) => void
}

const TicketDetailModal: React.FC<Props> = ({ ticket, onClose, onUpdateStatus }) => {
  if (!ticket) return null

  const statusOrder = WO_STATUSES

  const currentIndex = statusOrder.indexOf(ticket.status as any)

  const advance = () => {
    const next = Math.min(statusOrder.length - 1, currentIndex + 1)
    const nextStatus = statusOrder[next]
    onUpdateStatus(ticket.id, nextStatus as WorkOrder['status'])
  }

  const exportPdf = () => {
    // simple print fallback — open new window with ticket details
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<pre>${JSON.stringify(ticket, null, 2)}</pre>`)
    w.document.close()
    w.print()
  }

  const closeTicket = () => onUpdateStatus(ticket.id, 'closed')

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div>
            <div className="ot-detail-num">{ticket.id}</div>
            <h2 style={{ fontSize: 17 }}>{ticket.title}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: 20 }}>
          <div className="ot-timeline-strip">
            {statusOrder.filter(s => s !== 'on_hold').map((s, i) => {
              const done = i < currentIndex
              const active = s === ticket.status
              const isLast = i === 3 // Ya que quitamos 'on_hold', quedan 4
              return (
                <div key={s} className="ots-step">
                  {!isLast && <div className={`ots-line ${done || active ? 'done' : ''}`} />}
                  <div className={`ots-dot ${done ? 'done' : active ? 'active' : ''}`} />
                  <div className="ots-label">{WO_STATUS_LABEL[s as any]}</div>
                </div>
              )
            })}
          </div>

          <div className="ot-detail-grid">
            <div className="ot-detail-field"><div className="ot-detail-label">Máquina</div><div className="ot-detail-val">{ticket.machineId}</div></div>
            <div className="ot-detail-field"><div className="ot-detail-label">Técnico</div><div className="ot-detail-val">{ticket.createdBy || 'operator'}</div></div>
            <div className="ot-detail-field"><div className="ot-detail-label">Estado</div><div className="ot-detail-val"><span className={`ot-badge ${ticket.status}`}>{WO_STATUS_LABEL[ticket.status as any]}</span></div></div>
            <div className="ot-detail-field"><div className="ot-detail-label">Prioridad</div><div className="ot-detail-val" style={{ fontWeight: 600, color: ticket.priority === 'high' ? '#c0281e' : 'var(--amber)' }}>{ticket.priority === 'high' ? 'Alta' : 'Media'}</div></div>
          </div>

          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6 }}>
            <strong>Descripción:</strong> {ticket.description}
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={onClose}>Cerrar</button>
            <button className="btn btn-sm" style={{ background: 'var(--accent)', color: '#fff' }} onClick={exportPdf}>📄 Exportar PDF</button>
            <button className="btn btn-sm btn-outline" disabled={currentIndex === statusOrder.length - 1} onClick={() => { advance(); showToast(`OT Avanzada →`); }}>Avanzar estado →</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketDetailModal
