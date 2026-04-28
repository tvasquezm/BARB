import React, { useEffect, useState } from 'react'
import { showToast } from './Toast'

export type WorkOrderCreatePayload = {
  title: string
  machine: string
  priority: 'Low' | 'Medium' | 'High'
  status: 'Open' | 'In Progress' | 'Done' | 'Closed'
  description: string
}

interface WorkOrderCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (payload: WorkOrderCreatePayload) => Promise<void> | void
}

const MACHINE_OPTIONS = [
  { id: 'comp-a1', label: 'Compressor A1' },
  { id: 'press-b3', label: 'Hydraulic Press B3' },
  { id: 'motor-d1', label: 'Motor Drive D1' },
  { id: 'cnc-c2', label: 'CNC Mill C2' },
  { id: 'pump-e4', label: 'Pump E4' },
]

const INITIAL_FORM: WorkOrderCreatePayload = {
  title: '',
  machine: 'comp-a1',
  priority: 'Medium',
  status: 'Open',
  description: '',
}

const WorkOrderCreateModal: React.FC<WorkOrderCreateModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [form, setForm] = useState<WorkOrderCreatePayload>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) setForm(INITIAL_FORM)
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const title = form.title.trim()
    const description = form.description.trim()

    if (!title) {
      showToast('⚠️ Agrega un título para la OT')
      return
    }

    setSubmitting(true)
    try {
      await onCreate({
        ...form,
        title,
        description,
      })
      onClose()
    } catch (error) {
      console.error('Error creating work order', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay open" onClick={handleOverlayClick}>
      <div className="modal-box" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <div>
            <h2>Crear OT</h2>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink3)' }}>
              Registra una nueva orden de trabajo en el backend mockeado.
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="ot-detail-grid">
              <div className="ot-detail-field">
                <div className="ot-detail-label">Título</div>
                <input
                  className="form-input"
                  value={form.title}
                  onChange={(event) => setForm(prev => ({ ...prev, title: event.target.value }))}
                  placeholder="Ej. Inspección de vibración motor D1"
                />
              </div>

              <div className="ot-detail-field">
                <div className="ot-detail-label">Máquina</div>
                <select
                  className="form-select"
                  aria-label="Seleccionar máquina"
                  title="Seleccionar máquina"
                  value={form.machine}
                  onChange={(event) => setForm(prev => ({ ...prev, machine: event.target.value }))}
                >
                  {MACHINE_OPTIONS.map(machine => (
                    <option key={machine.id} value={machine.id}>
                      {machine.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ot-detail-field">
                <div className="ot-detail-label">Prioridad</div>
                <select
                  className="form-select"
                  aria-label="Seleccionar prioridad"
                  title="Seleccionar prioridad"
                  value={form.priority}
                  onChange={(event) => setForm(prev => ({ ...prev, priority: event.target.value as WorkOrderCreatePayload['priority'] }))}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="ot-detail-field">
                <div className="ot-detail-label">Estado inicial</div>
                <select
                  className="form-select"
                  aria-label="Seleccionar estado inicial"
                  title="Seleccionar estado inicial"
                  value={form.status}
                  onChange={(event) => setForm(prev => ({ ...prev, status: event.target.value as WorkOrderCreatePayload['status'] }))}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div>
              <div className="ot-detail-label" style={{ marginBottom: 6 }}>Descripción</div>
              <textarea
                className="report-textarea"
                rows={5}
                value={form.description}
                onChange={(event) => setForm(prev => ({ ...prev, description: event.target.value }))}
                placeholder="Describe la falla, hallazgo o trabajo preventivo..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear OT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WorkOrderCreateModal
