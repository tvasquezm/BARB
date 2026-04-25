import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { seedDemoTickets, computeMTTR, filterTickets, WO_STATUSES } from '../services/workOrders';
import TicketTable from '../components/TicketTable';
import TicketDetailModal from '../components/TicketDetailModal';
import { showToast } from '../components/Toast';
const Dashboard = () => {
    // Estado inicial cargado desde las semillas de demostración
    const [tickets, setTickets] = useState(() => seedDemoTickets());
    const [statusFilter, setStatusFilter] = useState('all');
    const [machineFilter, setMachineFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString('es-CL'));
    // Cálculos de KPIs basados en el estado actual de los tickets
    const total = tickets.length;
    const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const closedCount = tickets.filter(t => t.status === 'done' || t.status === 'closed').length;
    const mttr = computeMTTR(tickets);
    // Memorización de los tickets filtrados para optimizar el rendimiento
    const filtered = useMemo(() => filterTickets(tickets, { status: statusFilter, machineId: machineFilter, search }), [tickets, statusFilter, machineFilter, search]);
    // Cálculos para la sección inferior (Timeline y Top Machines)
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
        tickets.forEach(t => { const name = t.title?.split('—')?.[0]?.trim() || t.machineId || 'Desconocida'; counts[name] = (counts[name] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [tickets]);
    const maxMachineCount = topMachines[0]?.[1] || 1;
    const formatDur = (min) => { if (min == null)
        return '—'; if (min < 60)
        return min + 'm'; return Math.floor(min / 60) + 'h ' + (min % 60) + 'm'; };
    const handleSelect = (id) => {
        const t = tickets.find(x => x.id === id) || null;
        setSelectedTicket(t);
    };
    const handleUpdateStatus = (id, status) => {
        const now = new Date().toISOString();
        setTickets(prev => prev.map(t => t.id === id ? {
            ...t,
            status,
            closedAt: (status === 'done' || status === 'closed') ? (t.closedAt || now) : t.closedAt
        } : t));
        // Actualizar el ticket seleccionado si el modal está abierto
        setSelectedTicket(prev => prev && prev.id === id ? {
            ...prev,
            status,
            closedAt: (status === 'done' || status === 'closed') ? (prev.closedAt || now) : prev.closedAt
        } : prev);
    };
    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            setLastRefresh(new Date().toLocaleTimeString('es-CL'));
            showToast('✅ OTs Actualizadas correctamente');
        }, 600);
    };
    return (_jsxs("div", { className: "dashboard-body", children: [_jsxs("div", { className: "dash-kpi-grid", children: [_jsxs("div", { className: "kpi-card", children: [_jsxs("div", { className: "kpi-card-top", children: [_jsx("div", { className: "kpi-icon", style: { background: 'var(--blue-bg)' }, children: "\uD83D\uDCCB" }), _jsx("svg", { width: "40", height: "24", children: _jsx("polyline", { points: "0,20 10,10 20,15 30,5 40,8", fill: "none", stroke: "var(--ink2)", strokeWidth: "2" }) })] }), _jsx("div", { className: "kpi-num", children: total }), _jsx("div", { className: "kpi-label", children: "Total OTs" }), _jsxs("div", { className: "kpi-delta up", children: ["\u2191 ", total, " en el per\u00EDodo"] })] }), _jsxs("div", { className: "kpi-card", children: [_jsx("div", { className: "kpi-card-top", children: _jsx("div", { className: "kpi-icon", style: { background: 'var(--amber-bg)' }, children: "\uD83D\uDD04" }) }), _jsx("div", { className: "kpi-num", style: { color: 'var(--amber)' }, children: openCount }), _jsx("div", { className: "kpi-label", children: "Open / Active" }), _jsx("div", { className: "kpi-delta", children: "\u2014 en progreso" })] }), _jsxs("div", { className: "kpi-card", children: [_jsx("div", { className: "kpi-card-top", children: _jsx("div", { className: "kpi-icon", style: { background: 'var(--green-bg)' }, children: "\u2705" }) }), _jsx("div", { className: "kpi-num", style: { color: 'var(--green)' }, children: closedCount }), _jsx("div", { className: "kpi-label", children: "Completed" }), _jsx("div", { className: "kpi-delta up", children: "\u2014 resueltas" })] }), _jsxs("div", { className: "kpi-card", children: [_jsx("div", { className: "kpi-card-top", children: _jsx("div", { className: "kpi-icon", style: { background: 'var(--accent-bg)' }, children: "\u23F1" }) }), _jsx("div", { className: "kpi-num", style: { color: 'var(--accent)' }, children: mttr }), _jsx("div", { className: "kpi-label", children: "MTTR (min)" }), _jsx("div", { className: "kpi-delta", children: "\u2014 vs objetivo 35 min" })] })] }), _jsxs("div", { className: "dash-filters", children: [_jsxs("select", { value: statusFilter, onChange: e => setStatusFilter(e.target.value), className: "filter-select", children: [_jsx("option", { value: "all", children: "All Statuses" }), WO_STATUSES.map(s => _jsx("option", { value: s, children: s.replace('_', ' ') }, s))] }), _jsxs("select", { value: machineFilter, onChange: e => setMachineFilter(e.target.value), className: "filter-select", children: [_jsx("option", { value: "all", children: "All Machines" }), _jsx("option", { value: "comp-a1", children: "Compressor A1" }), _jsx("option", { value: "press-b3", children: "Hydraulic Press B3" }), _jsx("option", { value: "cnc-c2", children: "CNC Mill C2" }), _jsx("option", { value: "motor-d1", children: "Motor Drive D1" })] }), _jsx("input", { value: search, onChange: e => setSearch(e.target.value), placeholder: "Search OTs, technicians...", className: "filter-search" }), _jsxs("button", { className: "dash-refresh-btn", onClick: handleRefresh, children: [_jsxs("svg", { className: isRefreshing ? 'spinning' : '', width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("polyline", { points: "23 4 23 10 17 10" }), _jsx("path", { d: "M20.49 15a9 9 0 1 1-2.12-9.36L23 10" })] }), "Actualizar"] }), _jsxs("div", { style: { marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--ink3)' }, children: ["Actualizado: ", lastRefresh] })] }), _jsxs("div", { className: "dash-section-title", children: ["\u00D3rdenes de Trabajo ", _jsxs("span", { style: { fontSize: '12px', fontWeight: 400, color: 'var(--ink3)' }, children: [filtered.length, " registros"] })] }), _jsx(TicketTable, { tickets: filtered, onSelect: handleSelect }), _jsxs("div", { className: "dash-bottom", children: [_jsxs("div", { className: "timeline-card", children: [_jsxs("div", { className: "dash-section-title", children: ["Tiempo de resoluci\u00F3n por OT ", _jsx("span", { children: "duraci\u00F3n real" })] }), _jsx("div", { className: "timeline-bar-wrap", children: timelineTickets.length === 0 ? _jsx("div", { style: { color: 'var(--ink3)', fontSize: '12px', textAlign: 'center', padding: '16px' }, children: "Sin datos" }) : timelineTickets.map(t => (_jsxs("div", { className: "tl-row", children: [_jsx("div", { className: "tl-label", title: t.title, children: t.id }), _jsxs("div", { className: "tl-bar-bg", children: [_jsx("div", { className: "tl-bar", style: { width: `${Math.round(((t.computedDuration || 0) / maxDuration) * 100)}%`, background: (t.computedDuration || 0) <= 35 ? 'var(--green)' : (t.computedDuration || 0) <= 60 ? 'var(--amber)' : '#c0281e' } }), _jsx("span", { className: "tl-bar-label", children: formatDur(t.computedDuration) })] }), _jsx("div", { className: "tl-time", children: formatDur(t.computedDuration) })] }, t.id))) })] }), _jsxs("div", { className: "top-machines-card", children: [_jsxs("div", { className: "dash-section-title", children: ["Top m\u00E1quinas con fallas ", _jsx("span", { children: "per\u00EDodo" })] }), _jsx("div", { children: topMachines.map(([name, count], i) => (_jsxs("div", { className: "tm-row", children: [_jsx("div", { className: "tm-rank", children: i + 1 }), _jsxs("div", { className: "tm-info", children: [_jsx("div", { className: "tm-name", children: name }), _jsxs("div", { className: "tm-count", children: [count, " OT", count !== 1 ? 's' : ''] })] }), _jsx("div", { className: "tm-bar-mini", children: _jsx("div", { className: "tm-bar-fill", style: { width: `${Math.round((count / maxMachineCount) * 100)}%` } }) })] }, name))) })] })] }), _jsx(TicketDetailModal, { ticket: selectedTicket, onClose: () => setSelectedTicket(null), onUpdateStatus: handleUpdateStatus })] }));
};
export default Dashboard;
