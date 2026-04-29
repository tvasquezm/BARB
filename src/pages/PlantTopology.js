import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import MACHINES from '../data/machines';
import { useNavigate } from 'react-router-dom';
import { seedDemoTickets } from '../services/workOrders';
const NODES = [
    { id: 'motor-d1', name: 'Motor Drive D1', x: 140, y: 100, w: 120, h: 80, icon: '⚡', cat: 'Electrical', status: 'maintenance', stroke: '#a06a00' },
    { id: 'cnc-c2', name: 'CNC Mill C2', x: 338, y: 58, w: 120, h: 80, icon: '⚙️', cat: 'Mechanical', status: 'operational', stroke: '#1a5fa8' },
    { id: 'comp-a1', name: 'Compressor A1', x: 558, y: 90, w: 124, h: 80, icon: '💨', cat: 'Pneumatic', status: 'operational', stroke: '#5e3db3' },
    { id: 'plc', name: 'PLC Controller', x: 320, y: 265, w: 120, h: 80, icon: '🤖', cat: 'Automation', status: 'operational', stroke: '#1a7a50' },
    { id: 'press-b3', name: 'Hydraulic Press B3', x: 618, y: 270, w: 132, h: 80, icon: '💧', cat: 'Hydraulic', status: 'warning', stroke: '#0e7490' },
];
const INITIAL_VB = { x: 0, y: 0, w: 900, h: 480 };
const PlantTopology = () => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const { setSelectedMachine } = useAppContext();
    const navigate = useNavigate();
    const [viewBox, setViewBox] = useState(INITIAL_VB);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
    const handleNodeClick = (node, e) => {
        // position tooltip relative to container
        const rect = containerRef.current?.getBoundingClientRect();
        const cx = e.clientX - (rect?.left || 0);
        const cy = e.clientY - (rect?.top || 0);
        setTooltip({ visible: true, x: cx, y: cy, node });
    };
    const goToDebug = (nodeId) => {
        if (nodeId)
            setSelectedMachine(nodeId);
        navigate('/debug');
    };
    const zoom = (factor) => {
        const cx = viewBox.x + viewBox.w / 2;
        const cy = viewBox.y + viewBox.h / 2;
        const nw = viewBox.w / factor;
        const nh = viewBox.h / factor;
        setViewBox({ x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh });
    };
    const reset = () => setViewBox(INITIAL_VB);
    // Simula lectura de OTs para sincronizar el estado visual de la máquina
    const tickets = seedDemoTickets();
    const getMachineStatus = (machineId, defaultStatus) => {
        const active = tickets.filter(t => t.machineId === machineId && ['open', 'in_progress'].includes(t.status));
        if (active.length === 0)
            return 'operational';
        if (active.some(t => t.priority === 'high'))
            return 'error';
        if (active.some(t => t.status === 'in_progress'))
            return 'maintenance';
        return 'warning';
    };
    const statusColors = { operational: '#10B981', warning: '#F59E0B', maintenance: '#3B82F6', error: '#ef4444' };
    return (_jsxs("div", { className: "w-full", ref: containerRef, children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { className: "text-lg font-semibold", children: "Plant Topology" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn btn-outline btn-sm", onClick: () => zoom(1.2), children: "\uFF0B Zoom In" }), _jsx("button", { className: "btn btn-outline btn-sm", onClick: () => zoom(0.8), children: "\uFF0D Zoom Out" }), _jsx("button", { className: "btn btn-outline btn-sm", onClick: reset, children: "Reset View" })] })] }), _jsxs("div", { style: { height: '60vh', borderRadius: 12, overflow: 'hidden' }, className: "topo-canvas bg-neutral dark:bg-primary border border-secondary shadow-soft", children: [_jsxs("svg", { ref: svgRef, id: "topo-svg", viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`, preserveAspectRatio: "xMidYMid meet", style: { width: '100%', height: '100%' }, children: [_jsxs("g", { id: "topo-lines", stroke: "currentColor", className: "text-secondary opacity-30", strokeWidth: 2, fill: "none", children: [_jsx("line", { x1: "200", y1: "160", x2: "400", y2: "120", strokeDasharray: "6,3", opacity: "0.7" }), _jsx("line", { x1: "400", y1: "120", x2: "620", y2: "150", opacity: "0.7" }), _jsx("line", { x1: "400", y1: "120", x2: "390", y2: "320", opacity: "0.7" }), _jsx("line", { x1: "200", y1: "160", x2: "390", y2: "320", strokeDasharray: "6,3", opacity: "0.5" }), _jsx("line", { x1: "620", y1: "150", x2: "680", y2: "330", opacity: "0.5" })] }), NODES.map(n => {
                                const m = MACHINES[n.id];
                                const dynamicStatus = getMachineStatus(n.id, n.status);
                                const nodeColor = statusColors[dynamicStatus] || '#64748B';
                                const node = m ? { ...n, name: m.name, icon: m.icon, cat: m.cat, status: dynamicStatus } : { ...n, status: dynamicStatus };
                                return (_jsxs("g", { transform: `translate(${n.x},${n.y})`, className: "topo-node", style: { cursor: 'pointer' }, onClick: (e) => handleNodeClick(n, e), children: [_jsx("rect", { x: 0, y: 0, width: n.w, height: n.h, rx: 12, className: "fill-neutral dark:fill-primary", stroke: nodeColor, strokeWidth: 2 }), _jsx("text", { x: n.w / 2, y: 28, textAnchor: "middle", fontSize: 22, children: node.icon }), _jsx("text", { x: n.w / 2, y: 50, textAnchor: "middle", fontSize: 11, className: "fill-primary dark:fill-neutral", fontWeight: 600, children: node.name }), _jsx("text", { x: n.w / 2, y: 65, textAnchor: "middle", fontSize: 10, className: "fill-secondary", children: node.cat }), _jsx("circle", { cx: n.w - 14, cy: 14, r: 7, fill: nodeColor })] }, n.id));
                            })] }), tooltip.visible && tooltip.node && (_jsxs("div", { style: { position: 'absolute', left: tooltip.x + 12, top: tooltip.y + 12, zIndex: 60 }, className: "bg-white dark:bg-gray-800 p-3 rounded shadow", children: [_jsx("div", { className: "font-semibold", children: tooltip.node.name }), _jsxs("div", { className: "text-sm text-gray-500", children: [tooltip.node.cat, " \u00B7 ", tooltip.node.status] }), _jsxs("div", { className: "mt-2 flex gap-2", children: [_jsx("button", { className: "px-2 py-1 bg-blue-600 text-white rounded text-sm", onClick: () => goToDebug(tooltip.node?.id), children: "Go to Debug" }), _jsx("button", { className: "px-2 py-1 bg-gray-100 rounded text-sm", onClick: () => navigate(`/memory/${tooltip.node?.id}`), children: "History" }), _jsx("button", { className: "px-2 py-1 bg-transparent text-sm", onClick: () => setTooltip({ visible: false, x: 0, y: 0 }), children: "Close" })] })] }))] })] }));
};
export default PlantTopology;
