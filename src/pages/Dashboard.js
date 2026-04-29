import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, Cell, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import * as XLSX from 'xlsx';
import { computeMTTR, filterTickets, WO_STATUSES } from '../services/workOrders';
import TicketTable from '../components/TicketTable';
import TicketDetailModal from '../components/TicketDetailModal';
import WorkOrderCreateModal from '../components/WorkOrderCreateModal';
import { showToast } from '../components/Toast';
import { useAppContext } from '../context/AppContext';
import { getTranslations } from '../utils/i18n';
const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:9000/api').replace(/\/$/, '');
const STATUS_TO_INTERNAL = {
    Open: 'open',
    'In Progress': 'in_progress',
    Done: 'done',
    Closed: 'closed',
};
const INTERNAL_TO_STATUS = {
    open: 'Open',
    in_progress: 'In Progress',
    done: 'Done',
    closed: 'Closed',
};
const STATUS_LABELS = {
    open: 'Open',
    in_progress: 'In Progress',
    done: 'Done',
    closed: 'Closed',
};
const MACHINE_LABELS = {
    'comp-a1': 'Compressor A1',
    'press-b3': 'Hydraulic Press B3',
    'cnc-c2': 'CNC Mill C2',
    'motor-d1': 'Motor Drive D1',
    'pump-e4': 'Pump E4',
};
const PRIORITY_LABELS = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
};
const STATUS_COLORS = {
    open: '#f59e0b',
    in_progress: '#3b82f6',
    done: '#10b981',
    closed: '#64748b',
};
const normalizePriority = (priority) => {
    const normalized = (priority || 'medium').toLowerCase();
    if (normalized === 'low' || normalized === 'medium' || normalized === 'high')
        return normalized;
    return 'medium';
};
const minutesAgoIso = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();
const mapApiWorkOrder = (order) => {
    const createdAt = order.created_at ?? minutesAgoIso(order.age_minutes);
    const closedAt = order.closed_at ??
        (order.status === 'Done' || order.status === 'Closed' ? new Date().toISOString() : undefined);
    return {
        id: order.id,
        title: order.title,
        description: order.description ?? order.title,
        machineId: order.machine,
        status: STATUS_TO_INTERNAL[order.status],
        priority: normalizePriority(order.priority),
        createdAt,
        closedAt,
        createdBy: 'api',
    };
};
const Dashboard = () => {
    const { lang } = useAppContext();
    const t = useMemo(() => getTranslations(lang), [lang]);
    const [tickets, setTickets] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [machineFilter, setMachineFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString('es-CL'));
    const loadWorkOrders = async (showToastOnSuccess = false) => {
        setIsRefreshing(true);
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/work-orders`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                throw new Error(await response.text().catch(() => response.statusText));
            }
            const data = (await response.json());
            const normalized = data.map(mapApiWorkOrder);
            setTickets(normalized);
            setLastRefresh(new Date().toLocaleTimeString('es-CL'));
            if (showToastOnSuccess) {
                showToast('✅ OTs actualizadas correctamente');
            }
        }
        catch (error) {
            console.error('Error loading work orders', error);
            showToast('❌ No se pudo conectar con el backend de OTs');
            setTickets([]);
        }
        finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };
    useEffect(() => {
        void loadWorkOrders();
    }, []);
    const total = tickets.length;
    const activeCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const closedCount = tickets.filter(t => t.status === 'done' || t.status === 'closed').length;
    const mttr = computeMTTR(tickets);
    const filtered = useMemo(() => filterTickets(tickets, { status: statusFilter, machineId: machineFilter, search }), [tickets, statusFilter, machineFilter, search]);
    const statusData = useMemo(() => WO_STATUSES.map(status => ({
        name: STATUS_LABELS[status],
        value: tickets.filter(ticket => ticket.status === status).length,
        fill: STATUS_COLORS[status],
    })), [tickets]);
    const machineData = useMemo(() => {
        const counts = {};
        tickets.forEach(ticket => {
            const key = ticket.machineId || ticket.title || 'Desconocida';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value]) => ({
            name: MACHINE_LABELS[name] || name,
            value,
        }));
    }, [tickets]);
    const resolutionData = useMemo(() => {
        return tickets
            .filter(ticket => ticket.closedAt)
            .slice(0, 8)
            .map(ticket => ({
            id: ticket.id,
            minutes: Math.max(1, Math.round((new Date(ticket.closedAt).getTime() - new Date(ticket.createdAt).getTime()) / 60000)),
        }));
    }, [tickets]);
    const timelineTickets = useMemo(() => {
        return tickets
            .map(t => {
            const duration = t.closedAt
                ? Math.round((new Date(t.closedAt).getTime() - new Date(t.createdAt).getTime()) / 60000)
                : null;
            return { ...t, computedDuration: duration };
        })
            .filter(t => t.computedDuration != null)
            .slice(0, 8);
    }, [tickets]);
    const maxDuration = Math.max(...timelineTickets.map(t => t.computedDuration || 0), 60);
    const topMachines = useMemo(() => {
        const counts = {};
        tickets.forEach(t => {
            const name = t.machineId || t.title || 'Desconocida';
            counts[name] = (counts[name] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [tickets]);
    const maxMachineCount = topMachines[0]?.[1] || 1;
    const formatDur = (min) => {
        if (min == null)
            return '—';
        if (min < 60)
            return `${min}m`;
        return `${Math.floor(min / 60)}h ${min % 60}m`;
    };
    const handleSelect = async (id) => {
        const current = tickets.find(x => x.id === id) || null;
        setSelectedTicket(current);
        try {
            const response = await fetch(`${API_URL}/work-orders/${id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                throw new Error(await response.text().catch(() => response.statusText));
            }
            const detail = (await response.json());
            setSelectedTicket(mapApiWorkOrder(detail));
        }
        catch (error) {
            console.error('Error loading work order detail', error);
            if (!current) {
                showToast('❌ No se pudo cargar el detalle de la OT');
            }
        }
    };
    const handleUpdateStatus = async (id, status) => {
        try {
            const response = await fetch(`${API_URL}/work-orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: INTERNAL_TO_STATUS[status] }),
            });
            if (!response.ok) {
                throw new Error(await response.text().catch(() => response.statusText));
            }
            const updated = mapApiWorkOrder((await response.json()));
            setTickets(prev => prev.map(t => (t.id === id ? updated : t)));
            setSelectedTicket(prev => (prev && prev.id === id ? updated : prev));
            showToast('✅ Estado actualizado correctamente');
        }
        catch (error) {
            console.error('Error updating work order', error);
            showToast('❌ No se pudo actualizar la OT');
        }
    };
    const handleCreateWorkOrder = async (payload) => {
        try {
            const response = await fetch(`${API_URL}/work-orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: payload.title,
                    machine: payload.machine,
                    priority: payload.priority,
                    status: payload.status,
                    description: payload.description,
                }),
            });
            if (!response.ok) {
                throw new Error(await response.text().catch(() => response.statusText));
            }
            const created = mapApiWorkOrder((await response.json()));
            setTickets(prev => [created, ...prev]);
            setSelectedTicket(created);
            setLastRefresh(new Date().toLocaleTimeString('es-CL'));
            showToast(`✅ OT ${created.id} creada correctamente`);
        }
        catch (error) {
            console.error('Error creating work order', error);
            showToast('❌ No se pudo crear la OT');
            throw error;
        }
    };
    const handleDeleteWorkOrder = async (id) => {
        try {
            const response = await fetch(`${API_URL}/work-orders/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                throw new Error(await response.text().catch(() => response.statusText));
            }
            setTickets(prev => prev.filter(t => t.id !== id));
            setSelectedTicket(prev => (prev && prev.id === id ? null : prev));
            setLastRefresh(new Date().toLocaleTimeString('es-CL'));
            showToast('🗑️ OT eliminada correctamente');
        }
        catch (error) {
            console.error('Error deleting work order', error);
            showToast('❌ No se pudo eliminar la OT');
            throw error;
        }
    };
    const handleRefresh = () => {
        void loadWorkOrders(true);
    };
    const handleExportCsv = () => {
        const header = ['id', 'title', 'machine', 'status', 'priority', 'createdAt', 'closedAt'];
        const rows = filtered.map(ticket => [
            ticket.id,
            ticket.title,
            ticket.machineId,
            ticket.status,
            ticket.priority,
            ticket.createdAt,
            ticket.closedAt || '',
        ]);
        const csv = [header, ...rows]
            .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = 'barb-work-orders.csv';
        link.click();
        URL.revokeObjectURL(url);
        showToast('📄 CSV exportado correctamente');
    };
    const handleExportXlsx = () => {
        const rows = filtered.map(ticket => ({
            ID: ticket.id,
            Título: ticket.title,
            Máquina: MACHINE_LABELS[ticket.machineId] || ticket.machineId,
            Estado: STATUS_LABELS[ticket.status],
            Prioridad: PRIORITY_LABELS[ticket.priority],
            Creada: ticket.createdAt,
            Cerrada: ticket.closedAt || '',
        }));
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Work Orders');
        XLSX.writeFile(workbook, 'barb-work-orders.xlsx');
        showToast('📊 XLSX exportado correctamente');
    };
    return (_jsxs("div", { className: "dashboard-body", children: [_jsxs("div", { className: "dash-kpi-grid", children: [_jsxs("div", { className: "kpi-card", children: [_jsxs("div", { className: "kpi-card-top", children: [_jsx("div", { className: "kpi-icon", style: { background: 'var(--blue-bg)' }, children: "\uD83D\uDCCB" }), _jsx("svg", { width: "40", height: "24", children: _jsx("polyline", { points: "0,20 10,10 20,15 30,5 40,8", fill: "none", stroke: "var(--ink2)", strokeWidth: "2" }) })] }), _jsx("div", { className: "kpi-num", children: total }), _jsx("div", { className: "kpi-label", children: t.dashboard.totalWorkOrders }), _jsxs("div", { className: "kpi-delta up", children: ["\u2191 ", total, " en el per\u00EDodo"] })] }), _jsxs("div", { className: "kpi-card", children: [_jsx("div", { className: "kpi-card-top", children: _jsx("div", { className: "kpi-icon", style: { background: 'var(--amber-bg)' }, children: "\uD83D\uDD04" }) }), _jsx("div", { className: "kpi-num", style: { color: 'var(--amber)' }, children: activeCount }), _jsx("div", { className: "kpi-label", children: t.dashboard.activeWorkOrders }), _jsx("div", { className: "kpi-delta", children: "\u2014 en progreso" })] }), _jsxs("div", { className: "kpi-card", children: [_jsx("div", { className: "kpi-card-top", children: _jsx("div", { className: "kpi-icon", style: { background: 'var(--green-bg)' }, children: "\u2705" }) }), _jsx("div", { className: "kpi-num", style: { color: 'var(--green)' }, children: closedCount }), _jsx("div", { className: "kpi-label", children: t.dashboard.completedWorkOrders }), _jsx("div", { className: "kpi-delta up", children: "\u2014 resueltas" })] }), _jsxs("div", { className: "kpi-card", children: [_jsx("div", { className: "kpi-card-top", children: _jsx("div", { className: "kpi-icon", style: { background: 'var(--accent-bg)' }, children: "\u23F1" }) }), _jsx("div", { className: "kpi-num", style: { color: 'var(--accent)' }, children: mttr }), _jsx("div", { className: "kpi-label", children: t.dashboard.mttr }), _jsx("div", { className: "kpi-delta", children: "\u2014 vs objetivo 35 min" })] })] }), _jsxs("div", { className: "dash-filters", children: [_jsxs("select", { "aria-label": t.common.status, value: statusFilter, onChange: e => setStatusFilter(e.target.value), className: "filter-select", children: [_jsx("option", { value: "all", children: t.dashboard.allStatuses }), WO_STATUSES.map(s => _jsx("option", { value: s, children: STATUS_LABELS[s] }, s))] }), _jsxs("select", { "aria-label": t.common.machine, value: machineFilter, onChange: e => setMachineFilter(e.target.value), className: "filter-select", children: [_jsx("option", { value: "all", children: t.dashboard.allMachines }), _jsx("option", { value: "comp-a1", children: "Compressor A1" }), _jsx("option", { value: "press-b3", children: "Hydraulic Press B3" }), _jsx("option", { value: "cnc-c2", children: "CNC Mill C2" }), _jsx("option", { value: "motor-d1", children: "Motor Drive D1" }), _jsx("option", { value: "pump-e4", children: "Pump E4" })] }), _jsx("input", { "aria-label": t.common.search, value: search, onChange: e => setSearch(e.target.value), placeholder: lang === 'es' ? 'Buscar OTs, técnicos…' : 'Search work orders, technicians…', className: "filter-search" }), _jsx("button", { className: "btn btn-primary btn-sm", style: { width: 'auto' }, onClick: () => setIsCreateOpen(true), children: t.dashboard.createWorkOrder }), _jsxs("button", { className: "dash-refresh-btn", onClick: handleRefresh, children: [_jsxs("svg", { className: isRefreshing ? 'spinning' : '', width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("polyline", { points: "23 4 23 10 17 10" }), _jsx("path", { d: "M20.49 15a9 9 0 1 1-2.12-9.36L23 10" })] }), t.common.refresh] }), _jsxs("button", { className: "dash-refresh-btn", onClick: handleExportCsv, children: [t.common.export, " ", t.common.csv] }), _jsxs("button", { className: "dash-refresh-btn", onClick: handleExportXlsx, children: [t.common.export, " ", t.common.xlsx] }), _jsx("div", { style: { marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--ink3)' }, children: t.dashboard.updatedAt(lastRefresh) })] }), _jsxs("div", { className: "dash-section-title", children: [t.dashboard.title, ' ', _jsxs("span", { style: { fontSize: '12px', fontWeight: 400, color: 'var(--ink3)' }, children: [filtered.length, " registros"] })] }), isLoading && tickets.length === 0 ? (_jsx("div", { style: { padding: 16, color: 'var(--ink3)', fontSize: 12 }, children: t.common.loading })) : (_jsx(TicketTable, { tickets: filtered, onSelect: handleSelect })), _jsxs("div", { className: "dash-bottom", children: [_jsxs("div", { className: "timeline-card", children: [_jsxs("div", { className: "dash-section-title", children: [t.dashboard.chartResolution, " ", _jsx("span", { children: "duraci\u00F3n real" })] }), _jsx("div", { style: { height: 260 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: resolutionData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(127,127,127,0.18)" }), _jsx(XAxis, { dataKey: "id", tick: { fontSize: 11 } }), _jsx(YAxis, { tick: { fontSize: 11 } }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "minutes", fill: "var(--accent)", radius: [6, 6, 0, 0] })] }) }) })] }), _jsxs("div", { className: "top-machines-card", children: [_jsxs("div", { className: "dash-section-title", children: [t.dashboard.chartMachines, " ", _jsx("span", { children: "per\u00EDodo" })] }), _jsx("div", { style: { height: 260 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: machineData, dataKey: "value", nameKey: "name", innerRadius: 52, outerRadius: 90, paddingAngle: 3, children: machineData.map((entry, index) => (_jsx(Cell, { fill: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'][index % 6] }, `cell-${entry.name}`))) }), _jsx(Tooltip, {}), _jsx(Legend, {})] }) }) })] })] }), _jsxs("div", { className: "dash-bottom", style: { marginTop: 16 }, children: [_jsxs("div", { className: "timeline-card", children: [_jsxs("div", { className: "dash-section-title", children: [t.dashboard.chartStatus, " ", _jsx("span", { children: "OTs actuales" })] }), _jsx("div", { style: { height: 260 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: statusData, layout: "vertical", margin: { left: 24 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(127,127,127,0.18)" }), _jsx(XAxis, { type: "number", tick: { fontSize: 11 } }), _jsx(YAxis, { dataKey: "name", type: "category", tick: { fontSize: 11 } }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "value", radius: [0, 8, 8, 0], children: statusData.map(entry => (_jsx(Cell, { fill: entry.fill }, entry.name))) })] }) }) })] }), _jsxs("div", { className: "top-machines-card", children: [_jsxs("div", { className: "dash-section-title", children: ["Top m\u00E1quinas con fallas ", _jsx("span", { children: "per\u00EDodo" })] }), _jsx("div", { children: topMachines.length === 0 ? (_jsx("div", { style: { color: 'var(--ink3)', fontSize: '12px', textAlign: 'center', padding: '16px' }, children: t.dashboard.noData })) : (topMachines.map(([name, count], i) => (_jsxs("div", { className: "tm-row", children: [_jsx("div", { className: "tm-rank", children: i + 1 }), _jsxs("div", { className: "tm-info", children: [_jsx("div", { className: "tm-name", children: MACHINE_LABELS[name] || name }), _jsxs("div", { className: "tm-count", children: [count, " OT", count !== 1 ? 's' : ''] })] }), _jsx("div", { className: "tm-bar-mini", children: _jsx("div", { className: "tm-bar-fill", style: { width: `${Math.round((count / maxMachineCount) * 100)}%` } }) })] }, name)))) })] })] }), _jsx(WorkOrderCreateModal, { isOpen: isCreateOpen, onClose: () => setIsCreateOpen(false), onCreate: handleCreateWorkOrder }), _jsx(TicketDetailModal, { ticket: selectedTicket, onClose: () => setSelectedTicket(null), onUpdateStatus: handleUpdateStatus, onDelete: handleDeleteWorkOrder })] }));
};
export default Dashboard;
