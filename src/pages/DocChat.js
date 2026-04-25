import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import createApiService from '../services/api';
import ChatBubble, { Thinking } from '../components/ChatBubble';
import { retrieveContext } from '../utils/rag';
import { callLMStudio } from '../services/lm';
import MACHINES from '../data/machines';
const DocChat = () => {
    const { apiBase, lmBase, discipline, docMachine, plant, docMessages, pushDocMessage, loading, setLoading, setDiscipline, setPlant } = useAppContext();
    const [input, setInput] = useState('');
    const areaRef = useRef(null);
    const api = createApiService(apiBase, lmBase);
    const disciplines = [
        { id: 'electrical', label: '⚡ Electrical' },
        { id: 'mechanical', label: '⚙️ Mechanical' },
        { id: 'hydraulic', label: '💧 Hydraulic' },
        { id: 'pneumatic', label: '💨 Pneumatic' },
        { id: 'automation', label: '🤖 Automation' }
    ];
    // Auto-ajustar altura del textarea
    const handleInput = (e) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
    };
    useEffect(() => { if (areaRef.current)
        areaRef.current.scrollTop = areaRef.current.scrollHeight; }, [docMessages.length]);
    const send = async () => {
        const query = input.trim();
        if (!query || loading || !discipline)
            return;
        setLoading(true);
        setInput('');
        const userMsg = { role: 'user', content: query, timestamp: Date.now() };
        pushDocMessage(userMsg);
        // Reset height of textarea
        const el = document.getElementById('doc-input');
        if (el)
            el.style.height = 'auto';
        // Try FastAPI /chat/documents
        try {
            const resp = await api.chat.documents({ disciplineId: discipline, plantId: plant, machineId: docMachine !== 'all' ? docMachine : null, message: query, conversationId: null, context: {} });
            if (resp && resp.response) {
                pushDocMessage({ role: 'assistant', content: resp.response, timestamp: Date.now() });
                setLoading(false);
                return;
            }
        }
        catch (_) { }
        // LM Studio fallback (centralized helper)
        try {
            const chunks = retrieveContext(query);
            const ctx = chunks.length ? chunks.map((c, i) => `[FRAGMENTO ${i + 1} — p.${c.page}]\n${c.text}`).join('\n\n') : '[Sin manual cargado]';
            const system = `Eres BARB, asistente experto en mantenimiento industrial. Disciplina: ${discipline}.\nResponde en español, paso a paso, citando página del manual cuando disponible. Usa ⚠️ para advertencias.\n\nCONTEXTO MANUAL:\n${ctx}`;
            const resp = await callLMStudio([{ role: 'system', content: system }, ...docMessages.slice(-4).map(m => ({ role: m.role, content: m.content })), { role: 'user', content: query }], lmBase, 'local-model');
            if (resp && resp.ok) {
                const data = await resp.json();
                const answer = data.choices?.[0]?.message?.content || data.result || '';
                pushDocMessage({ role: 'assistant', content: answer, timestamp: Date.now() });
                setLoading(false);
                return;
            }
        }
        catch (_) { }
        // Demo fallback
        const chunks = retrieveContext(query);
        const demoAns = chunks.length ? `**[DEMO]** Basado en el manual:\n\n${chunks[0].text}\n\n*Inicia LM Studio o el backend FastAPI para respuestas inteligentes.*` : `**[DEMO]** No encontré información específica. Inicia LM Studio en ${lmBase} o la API en ${apiBase}.`;
        pushDocMessage({ role: 'assistant', content: demoAns, timestamp: Date.now() });
        setLoading(false);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };
    return (_jsxs("div", { className: "two-panel w-full h-full", children: [_jsxs("div", { className: "panel-left", children: [_jsxs("div", { className: "panel-section", children: [_jsx("span", { className: "panel-label", children: "Plant / Location" }), _jsxs("select", { className: "form-select", value: plant, onChange: (e) => setPlant(e.target.value), children: [_jsx("option", { value: "plant1", children: "Main Production Plant" }), _jsx("option", { value: "plant2", children: "Assembly Line 2" }), _jsx("option", { value: "plant3", children: "Warehouse Facility" })] })] }), _jsxs("div", { className: "panel-section", children: [_jsx("span", { className: "panel-label", children: "Discipline" }), _jsx("div", { className: "disc-list", children: disciplines.map(d => (_jsxs("button", { className: `disc-pill ${discipline === d.id ? 'active' : ''}`, "data-d": d.id, onClick: () => setDiscipline(discipline === d.id ? null : d.id), children: [_jsx("span", { className: "disc-dot" }), d.label] }, d.id))) })] }), _jsxs("div", { className: "panel-section", children: [_jsx("span", { className: "panel-label", children: "Machine (Optional)" }), _jsxs("div", { className: "machine-sel-list", children: [_jsxs("button", { className: `machine-sel-item ${docMachine === 'all' ? 'active' : ''}`, onClick: () => useAppContext().setDocMachine('all'), children: [_jsx("span", { className: "msi-dot ok" }), _jsx("div", { children: _jsx("div", { className: "msi-name", children: "All Machines" }) })] }), Object.entries(MACHINES).map(([id, m]) => (_jsxs("button", { className: `machine-sel-item ${docMachine === id ? 'active' : ''}`, onClick: () => useAppContext().setDocMachine(id), children: [_jsx("span", { className: `msi-dot ${m.status === 'warning' ? 'warn' : m.status === 'maintenance' ? 'maintain' : 'ok'}` }), _jsxs("div", { children: [_jsx("div", { className: "msi-name", children: m.name }), _jsx("div", { className: "msi-model", children: m.model })] })] }, id)))] })] })] }), _jsxs("div", { className: "panel-right", children: [_jsx("div", { className: "context-tags", style: { flexShrink: 0 }, children: !discipline ? (_jsx("span", { className: "ctx-empty", children: "Select a discipline to start chatting with documentation" })) : (_jsxs(_Fragment, { children: [_jsxs("span", { className: "ctx-tag plant", children: ["\uD83D\uDCCD ", plant] }), _jsxs("span", { className: `ctx-tag ${discipline === 'electrical' ? 'disc-el' : discipline === 'mechanical' ? 'disc-me' : discipline === 'hydraulic' ? 'disc-hy' : discipline === 'pneumatic' ? 'disc-pn' : 'disc-au'}`, children: ["\u25C9 ", disciplines.find(d => d.id === discipline)?.label] }), docMachine !== 'all' && MACHINES[docMachine] && _jsxs("span", { className: "ctx-tag machine", children: ["\u2699 ", MACHINES[docMachine].name] })] })) }), _jsxs("div", { className: "chat-messages", ref: areaRef, children: [docMessages.length === 0 ? (_jsx("div", { className: "chat-empty", children: _jsx("h3", { children: "Select a discipline to start" }) })) : (docMessages.map((m, i) => (_jsx(ChatBubble, { msg: m, side: m.role === 'user' ? 'user' : 'bot' }, i)))), loading && _jsx("div", { className: "mt-md", children: _jsx(Thinking, {}) })] }), _jsxs("div", { className: "input-zone", style: { flexShrink: 0 }, children: [_jsxs("div", { className: "input-wrap", children: [_jsx("textarea", { id: "doc-input", value: input, onChange: handleInput, onKeyDown: handleKeyDown, rows: 1, placeholder: "Ask about procedures, specifications, maintenance...", disabled: !discipline || loading, className: "flex-1 resize-none overflow-hidden bg-transparent border-none outline-none text-[13px] text-[var(--ink)] placeholder-[var(--ink3)]" }), _jsx("button", { className: "send-btn", onClick: send, disabled: !discipline || loading, children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: [_jsx("line", { x1: "22", y1: "2", x2: "11", y2: "13" }), _jsx("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })] }) })] }), _jsx("div", { className: "input-hint", children: "Enter to send \u00B7 Shift+Enter new line \u00B7 Powered by RAG + LM Studio" })] })] })] }));
};
export default DocChat;
