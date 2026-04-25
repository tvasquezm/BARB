import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams } from 'react-router-dom';
import { getMachineHistory } from '../services/workOrders';
const MachineMemory = () => {
    const { machineId } = useParams();
    const mid = machineId || '';
    const events = getMachineHistory(mid);
    return (_jsx("div", { className: "dashboard-body", children: _jsx("div", { className: "space-y-6 max-w-3xl", children: events.length === 0 ? (_jsxs("div", { className: "chat-empty", children: [_jsx("h3", { children: "No history available" }), _jsx("p", { children: "There are no past work orders or reports for this machine." })] })) : (_jsx("div", { style: { borderLeft: '2px solid var(--border)', paddingLeft: '24px', marginLeft: '12px' }, children: events.map(ev => (_jsxs("div", { className: "mb-8 relative", children: [_jsx("div", { className: "absolute top-0 w-3.5 h-3.5 rounded-full", style: { left: '-31px', background: 'var(--blue)', border: '2px solid var(--surface)' } }), _jsx("div", { style: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink3)' }, children: new Date(ev.date).toLocaleString() }), _jsx("div", { style: { fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }, children: ev.title }), _jsx("div", { style: { fontSize: '13px', color: 'var(--ink2)', marginTop: '4px', lineHeight: 1.6 }, children: ev.summary }), _jsxs("div", { style: { fontSize: '11px', color: 'var(--ink3)', marginTop: '8px' }, children: ["Operador: ", _jsx("span", { style: { fontWeight: 500, color: 'var(--ink)' }, children: ev.actor || '—' })] })] }, ev.id))) })) }) }));
};
export default MachineMemory;
