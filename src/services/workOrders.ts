import { WorkOrder } from '../types'

export const WO_STATUSES = ['open', 'in_progress', 'done', 'closed'] as const
export type WOStatus = typeof WO_STATUSES[number]

export const WO_STATUS_LABEL: Record<WOStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  done: 'Done',
  closed: 'Closed'
}

function isoMinutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60000).toISOString()
}

export function seedDemoTickets(): WorkOrder[] {
  return [
    { id: 'WO-1001', title: 'Replace filter FA-001', description: 'Filter clogged', machineId: 'comp-a1', status: 'open', priority: 'high', createdAt: isoMinutesAgo(240), createdBy: 'carlos.tech' },
    { id: 'WO-1002', title: 'Inspect hydraulic line', description: 'Pressure drop observed', machineId: 'press-b3', status: 'in_progress', priority: 'medium', createdAt: isoMinutesAgo(480), createdBy: 'ana.eng' },
    { id: 'WO-1003', title: 'Motor overheating analysis', description: 'Code E-041', machineId: 'motor-d1', status: 'done', priority: 'high', createdAt: isoMinutesAgo(1440), closedAt: isoMinutesAgo(1200), createdBy: 'luis.tech' },
    { id: 'WO-1004', title: 'Preventive lubrication', description: 'Routine 2000h', machineId: 'cnc-c2', status: 'closed', priority: 'low', createdAt: isoMinutesAgo(10000), closedAt: isoMinutesAgo(9000), createdBy: 'maintenance' },
  ]
}

export function computeMTTR(tickets: WorkOrder[]): number {
  const durations: number[] = tickets
    .filter(t => t.closedAt && t.createdAt)
    .map(t => (new Date(t.closedAt!).getTime() - new Date(t.createdAt).getTime()) / 60000)
    .filter(d => d > 0)

  if (durations.length === 0) return 0
  const sum = durations.reduce((a, b) => a + b, 0)
  return Math.round((sum / durations.length) * 10) / 10 // minutes, one decimal
}

export function filterTickets(tickets: WorkOrder[], q: { status?: string; machineId?: string; search?: string }) {
  return tickets.filter(t => {
    if (q.status && q.status !== 'all' && t.status !== q.status) return false
    if (q.machineId && q.machineId !== 'all' && t.machineId !== q.machineId) return false
    if (q.search) {
      const s = q.search.toLowerCase()
      if (!((t.title || '').toLowerCase().includes(s) || (t.description || '').toLowerCase().includes(s) || (t.id || '').toLowerCase().includes(s))) return false
    }
    return true
  })
}

export function getMachineHistory(machineId: string) {
  const tickets = seedDemoTickets().filter(t => t.machineId === machineId && (t.closedAt || t.status === 'done' || t.status === 'closed'))
  const reports = [
    { reportId: 'R-2026-01', machineId, title: 'Oil Change', summary: 'Changed oil and filters', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), createdBy: 'carlos.tech' },
    { reportId: 'R-2026-02', machineId, title: 'Emergency Stop Report', summary: 'Emergency stop due to overheat', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), createdBy: 'ana.eng' },
  ]
  const sessions = [
    { sessionId: 'SES-111', machineId, startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), endedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 30).toISOString(), technician: 'luis.tech', notes: 'Checked sensors' },
  ]

  const events: Array<import('../types').HistoryEvent> = []
  tickets.forEach(t => events.push({ id: t.id, type: 'workorder', date: t.closedAt || t.createdAt, title: t.title, actor: t.createdBy, summary: t.description }))
  reports.forEach(r => events.push({ id: r.reportId, type: 'report', date: r.createdAt, title: r.title, actor: r.createdBy, summary: r.summary }))
  sessions.forEach(s => events.push({ id: s.sessionId, type: 'debug', date: s.startedAt, title: 'Debug session', actor: s.technician, summary: s.notes }))

  // sort desc
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return events
}

export default { WO_STATUSES, WO_STATUS_LABEL, seedDemoTickets, computeMTTR, filterTickets }
