import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getTranslations } from '../utils/i18n';
import MACHINES from '../data/machines';
const NODES = [
    { id: 'motor-d1', name: 'Motor Drive D1', x: 140, y: 100, w: 120, h: 80, icon: '⚡', cat: 'Electrical', status: 'maintenance', stroke: '#a06a00' },
    { id: 'cnc-c2', name: 'CNC Mill C2', x: 338, y: 58, w: 120, h: 80, icon: '⚙️', cat: 'Mechanical', status: 'operational', stroke: '#1a5fa8' },
    { id: 'comp-a1', name: 'Compressor A1', x: 558, y: 90, w: 124, h: 80, icon: '💨', cat: 'Pneumatic', status: 'operational', stroke: '#5e3db3' },
    { id: 'plc', name: 'PLC Controller', x: 320, y: 265, w: 120, h: 80, icon: '🤖', cat: 'Automation', status: 'operational', stroke: '#1a7a50' },
    { id: 'press-b3', name: 'Hydraulic Press B3', x: 618, y: 270, w: 132, h: 80, icon: '💧', cat: 'Hydraulic', status: 'warning', stroke: '#0e7490' },
];
const INITIAL_VB = { x: 0, y: 0, w: 900, h: 480 };
const statusColor = (status) => {
    if (status === 'operational')
        return '#3ecf8e';
    if (status === 'warning')
        return '#d97706';
    if (status === 'maintenance')
        return '#3b82f6';
    return '#6b7280';
};
const PlantTopology = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const { lang, selectedMachine, setSelectedMachine, setDocMachine } = useAppContext();
    const t = useMemo(() => getTranslations(lang), [lang]);
    const [viewBox, setViewBox] = useState(INITIAL_VB);
    // Panel de detalle (reemplaza el popover absolute)
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailNodeId, setDetailNodeId] = useState(null);
    const selectedNode = useMemo(() => NODES.find(node => node.id === selectedMachine) ?? null, [selectedMachine]);
    const getNode = (node) => {
        const machine = MACHINES[node.id];
        if (!machine)
            return node;
        return {
            ...node,
            name: machine.name,
            icon: machine.icon,
            cat: machine.cat,
            status: machine.status,
        };
    };
    const activeDetailNode = useMemo(() => {
        if (!detailNodeId)
            return null;
        const base = NODES.find(n => n.id === detailNodeId) ?? null;
        if (!base)
            return null;
        return getNode(base);
    }, [detailNodeId]);
    const closeDetail = () => {
        setDetailOpen(false);
        setDetailNodeId(null);
    };
    const handleNodeClick = (node) => {
        setSelectedMachine(node.id);
        setDetailNodeId(node.id);
        setDetailOpen(true);
    };
    const goToDebug = (nodeId) => {
        const machineId = nodeId ?? detailNodeId ?? selectedMachine;
        if (machineId)
            setSelectedMachine(machineId);
        navigate('/debug');
        closeDetail();
    };
    const goToDocs = (nodeId) => {
        const machineId = nodeId ?? detailNodeId ?? selectedMachine;
        if (machineId) {
            setSelectedMachine(machineId);
            setDocMachine(machineId);
        }
        navigate('/docchat');
        closeDetail();
    };
    const zoom = (factor) => {
        const cx = viewBox.x + viewBox.w / 2;
        const cy = viewBox.y + viewBox.h / 2;
        const nw = viewBox.w / factor;
        const nh = viewBox.h / factor;
        setViewBox({ x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh });
    };
    const reset = () => setViewBox(INITIAL_VB);
    return (_jsxs("div", { className: "topology-body h-full", ref: containerRef, children: [_jsxs("div", { className: "topology-toolbar", children: [_jsxs("div", { children: [_jsx("div", { className: "topo-title", children: t.topology.title }), _jsx("div", { style: { marginTop: 4, fontSize: 12, color: 'var(--ink3)' }, children: selectedNode ? `${t.topology.selectedMachine}: ${selectedNode.name}` : t.topology.noMachineSelected })] }), _jsxs("div", { className: "topo-btns", children: [_jsxs("button", { className: "btn btn-outline btn-sm", onClick: () => zoom(1.2), "aria-label": t.topology.zoomIn, children: ["\uFF0B ", t.topology.zoomIn] }), _jsxs("button", { className: "btn btn-outline btn-sm", onClick: () => zoom(0.8), "aria-label": t.topology.zoomOut, children: ["\uFF0D ", t.topology.zoomOut] }), _jsx("button", { className: "btn btn-outline btn-sm", onClick: reset, "aria-label": t.topology.resetView, children: t.topology.resetView })] })] }), _jsxs("div", { className: "topo-canvas shadow-soft", style: { flex: 1, minHeight: 0, position: 'relative' }, children: [_jsxs("svg", { id: "topo-svg", viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`, preserveAspectRatio: "xMidYMid meet", style: { width: '100%', height: '100%' }, children: [_jsxs("g", { id: "topo-lines", stroke: "#cfcfcf", strokeWidth: 2, fill: "none", children: [_jsx("line", { x1: "200", y1: "160", x2: "400", y2: "120", strokeDasharray: "6,3", opacity: "0.7" }), _jsx("line", { x1: "400", y1: "120", x2: "620", y2: "150", opacity: "0.7" }), _jsx("line", { x1: "400", y1: "120", x2: "390", y2: "320", opacity: "0.7" }), _jsx("line", { x1: "200", y1: "160", x2: "390", y2: "320", strokeDasharray: "6,3", opacity: "0.5" }), _jsx("line", { x1: "620", y1: "150", x2: "680", y2: "330", opacity: "0.5" })] }), NODES.map(baseNode => {
                                const node = getNode(baseNode);
                                const isSelected = selectedMachine === node.id;
                                return (_jsxs("g", { transform: `translate(${node.x},${node.y})`, style: { cursor: 'pointer' }, onClick: () => handleNodeClick(baseNode), children: [_jsx("rect", { x: 0, y: 0, width: node.w, height: node.h, rx: 12, fill: "var(--surface)", stroke: isSelected ? 'var(--accent)' : node.stroke, strokeWidth: isSelected ? 4 : 2 }), _jsx("text", { x: node.w / 2, y: 28, textAnchor: "middle", fontSize: 22, children: node.icon }), _jsx("text", { x: node.w / 2, y: 50, textAnchor: "middle", fontSize: 11, fill: "var(--ink)", fontWeight: 600, children: node.name }), _jsx("text", { x: node.w / 2, y: 65, textAnchor: "middle", fontSize: 10, fill: "var(--ink3)", children: node.cat }), _jsx("circle", { cx: node.w - 14, cy: 14, r: 7, fill: statusColor(node.status) })] }, node.id));
                            })] }), detailOpen && activeDetailNode && (_jsxs("div", { className: "topology-detail-overlay", style: {
                            position: 'fixed',
                            inset: 0,
                            zIndex: 80,
                            background: 'rgba(0,0,0,0.35)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'stretch',
                        }, onClick: closeDetail, role: "presentation", children: [_jsxs("div", { className: "topology-detail-panel", style: {
                                    width: '20rem' /* ~w-80 */,
                                    background: 'var(--surface)',
                                    height: '100%',
                                    boxShadow: 'var(--shadow-lg)',
                                    borderLeft: '1px solid var(--border)',
                                    padding: 14,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                    transform: 'translateX(0)',
                                }, onClick: e => e.stopPropagation(), role: "dialog", "aria-modal": "true", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 10 }, children: [_jsx("div", { style: { fontSize: 22 }, children: activeDetailNode.icon }), _jsxs("div", { style: { minWidth: 0 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 16, color: 'var(--ink)', wordBreak: 'break-word' }, children: activeDetailNode.name }), _jsxs("div", { style: { marginTop: 2, fontSize: 12, color: 'var(--ink3)' }, children: [activeDetailNode.cat, " \u00B7 ", activeDetailNode.status] })] }), _jsx("div", { style: { marginLeft: 'auto' }, children: _jsx("button", { className: "btn btn-outline btn-sm", style: { padding: 8 }, onClick: closeDetail, "aria-label": t.topology.close, children: "\u2715" }) })] }), _jsxs("div", { style: { overflowY: 'auto', minHeight: 0, paddingRight: 6 }, children: [_jsxs("div", { className: "diagnostic-block", style: { marginTop: 0 }, children: [_jsx("div", { className: "diag-title", children: lang === 'es' ? 'Detalle' : 'Details' }), _jsxs("div", { style: { marginTop: 10, display: 'grid', gap: 8 }, children: [_jsxs("div", { className: "diag-item", style: { padding: 0 }, children: [_jsx("span", { style: { color: 'var(--amber)' }, children: "\u25CF" }), _jsxs("span", { children: ["Equipo: ", _jsx("span", { style: { fontFamily: 'var(--mono)', color: 'var(--ink)' }, children: activeDetailNode.id })] })] }), _jsxs("div", { className: "diag-item", style: { padding: 0 }, children: [_jsx("span", { style: { color: 'var(--blue)' }, children: "\u25CF" }), _jsxs("span", { children: ["Estado: ", _jsx("span", { style: { fontFamily: 'var(--mono)', color: 'var(--ink)' }, children: activeDetailNode.status })] })] }), _jsxs("div", { className: "diag-item", style: { padding: 0 }, children: [_jsx("span", { style: { color: 'var(--green)' }, children: "\u25CF" }), _jsxs("span", { children: ["Categor\u00EDa: ", _jsx("span", { style: { fontFamily: 'var(--mono)', color: 'var(--ink)' }, children: activeDetailNode.cat })] })] })] })] }), _jsxs("div", { className: "action-block", children: [_jsx("div", { className: "action-title", children: lang === 'es' ? 'Acciones' : 'Actions' }), _jsxs("div", { style: { marginTop: 10, display: 'grid', gap: 8 }, children: [_jsx("button", { className: "btn btn-sm btn-primary", onClick: () => goToDebug(activeDetailNode.id), children: t.topology.goToDebug }), _jsx("button", { className: "btn btn-sm btn-outline", onClick: () => goToDocs(activeDetailNode.id), children: t.topology.openDocs })] })] })] }), _jsx("div", { style: { flexShrink: 0 }, children: _jsx("div", { style: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink3)' }, children: isNaN(activeDetailNode.x) ? '' : '' }) })] }), _jsx("div", { className: "topology-detail-sheet", style: {
                                    display: 'none',
                                } })] })), _jsx("style", { children: `
            @media (max-width: 767px) {
              .topology-detail-overlay { justify-content: center; align-items: flex-end; }
              .topology-detail-panel { width: 100% !important; max-height: 68vh; border-left: none !important; border-radius: 16px 16px 0 0; padding: 14px; }
            }
          ` })] })] }));
};
export default PlantTopology;
