import React from 'react'
import { useParams } from 'react-router-dom'
import { getMachineHistory } from '../services/workOrders'

const MachineMemory: React.FC = () => {
  const { machineId } = useParams()
  const mid = machineId || ''
  const events = getMachineHistory(mid)

  return (
    <div className="dashboard-body">
      <div className="space-y-6 max-w-3xl">
        {events.length === 0 ? (
          <div className="chat-empty">
            <h3>No history available</h3>
            <p>There are no past work orders or reports for this machine.</p>
          </div>
        ) : (
          <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '24px', marginLeft: '12px' }}>
            {events.map(ev => (
              <div key={ev.id} className="mb-8 relative">
                <div className="absolute top-0 w-3.5 h-3.5 rounded-full" style={{ left: '-31px', background: 'var(--blue)', border: '2px solid var(--surface)' }} />
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink3)' }}>{new Date(ev.date).toLocaleString()}</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>{ev.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--ink2)', marginTop: '4px', lineHeight: 1.6 }}>{ev.summary}</div>
                <div style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '8px' }}>Operador: <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{ev.actor || '—'}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MachineMemory
