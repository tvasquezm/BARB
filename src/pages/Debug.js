import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import createApiService from '../services/api';
import ChatBubble, { Thinking } from '../components/ChatBubble';
import { retrieveContext } from '../utils/rag';
import { callLMStudio } from '../services/lm';
import { useNavigate } from 'react-router-dom';
import MACHINES from '../data/machines';
import { showToast } from '../components/Toast';
const Debug = () => {
    const { apiBase, lmBase, selectedMachine, docMessages, debugMessages, pushDebugMessage, setLoading, loading } = useAppContext();
    const [input, setInput] = useState('');
    const areaRef = useRef(null);
    const api = createApiService(apiBase, lmBase);
    const navigate = useNavigate();
    // Auto-ajustar altura del textarea
    const handleInput = (e) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
    };
    useEffect(() => { if (areaRef.current)
        areaRef.current.scrollTop = areaRef.current.scrollHeight; }, [debugMessages.length]);
    const send = async () => {
        const query = input.trim();
        if (!query || loading)
            return;
        setLoading(true);
        setInput('');
        const userMsg = { role: 'user', content: query, timestamp: Date.now() };
        pushDebugMessage(userMsg);
        // Reset height of textarea
        const el = document.getElementById('debug-input');
        if (el)
            el.style.height = 'auto';
        // Try FastAPI debug endpoint
        try {
            const resp = await api.chat.debug({ sessionId: null, machineId: selectedMachine, message: query, attachments: [], sensorData: null });
            if (resp && resp.response) {
                pushDebugMessage({ role: 'assistant', content: resp.response, timestamp: Date.now() });
                setLoading(false);
                return;
            }
        }
        catch (_) { }
        // LM Studio fallback (centralized helper)
        try {
            const chunks = retrieveContext(query);
            const ctx = chunks.length ? chunks.map((c, i) => `[FRAGMENTO ${i + 1} — p.${c.page}]\n${c.text}`).join('\n\n') : '[Sin manual disponible]';
            const system = `Eres BARB, experto en diagnóstico de maquinaria industrial. Máquina: ${selectedMachine || 'desconocida'}.\nResponde en español con: diagnóstico preciso, causas posibles, acciones paso a paso. Usa ⚠️ para advertencias de seguridad.\n\nCONTEXTO:\n${ctx}`;
            const resp = await callLMStudio([{ role: 'system', content: system }, ...debugMessages.slice(-4).map(m => ({ role: m.role, content: m.content })), { role: 'user', content: query }], lmBase, 'local-model');
            if (resp && resp.ok) {
                const data = await resp.json();
                const answer = data.choices?.[0]?.message?.content || data.result || '';
                pushDebugMessage({ role: 'assistant', content: answer, timestamp: Date.now() });
                setLoading(false);
                return;
            }
        }
        catch (_) { }
        // Demo fallback
        const chunks = retrieveContext(query);
        const demoAns = chunks.length ? `**[DEMO — Machine Debug]**\n\n${chunks[0].text}` : `**[DEMO]** Inicia LM Studio o el backend FastAPI.`;
        pushDebugMessage({ role: 'assistant', content: demoAns, timestamp: Date.now() });
        setLoading(false);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };
    const machine = selectedMachine ? MACHINES[selectedMachine] : null;
    return (_jsxs("div", { className: "two-panel", children: [_jsxs("div", { className: "debug-panel-left", children: [_jsx("h3", { style: { fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px' }, children: "Machine Information" }), _jsxs("div", { className: "debug-machine-img", children: [_jsx("div", { className: "big-icon", children: machine?.icon || '⚙️' }), _jsx("div", { className: "dm-name", children: machine?.name || '—' }), _jsx("div", { className: "dm-model", children: machine?.model || '—' })] }), _jsxs("div", { className: "debug-specs", children: [_jsx("h4", { children: "Specifications" }), _jsxs("div", { className: "spec-row", children: [_jsx("span", { className: "spec-label", children: "Status" }), _jsx("span", { className: "spec-val", style: { textTransform: 'capitalize' }, children: machine?.status || '—' })] }), _jsxs("div", { className: "spec-row", children: [_jsx("span", { className: "spec-label", children: "Category" }), _jsx("span", { className: "spec-val", children: machine?.cat || '—' })] }), _jsxs("div", { className: "spec-row", children: [_jsx("span", { className: "spec-label", children: "Session ID" }), _jsxs("span", { className: "spec-val font-mono text-secondary", children: ["ACT-", (Date.now() % 100000)] })] })] })] }), _jsxs("div", { className: "debug-panel-right", children: [_jsxs("div", { className: "debug-chat", ref: areaRef, children: [debugMessages.length === 0 ? (_jsx("div", { className: "chat-empty", children: _jsx("h3", { children: "Start debugging session" }) })) : (debugMessages.map((m, i) => (_jsx(ChatBubble, { msg: m, side: m.role === 'user' ? 'user' : 'bot' }, i)))), loading && _jsx("div", { className: "mt-md", children: _jsx(Thinking, {}) })] }), _jsxs("div", { className: "debug-input-zone", style: { flexShrink: 0 }, children: [_jsxs("div", { className: "debug-input-row", children: [_jsxs("div", { className: "input-wrap", style: { flex: 1 }, children: [_jsx("textarea", { id: "debug-input", value: input, onChange: handleInput, onKeyDown: handleKeyDown, rows: 1, placeholder: "Describe the issue or ask questions...", disabled: loading, className: "flex-1 resize-none overflow-hidden bg-transparent border-none outline-none text-[13px] text-[var(--ink)] placeholder-[var(--ink3)]" }), _jsx("button", { className: "send-btn", onClick: send, disabled: loading, children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: [_jsx("line", { x1: "22", y1: "2", x2: "11", y2: "13" }), _jsx("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })] }) })] }), _jsx("button", { className: "camera-btn", title: "Attach photo", onClick: () => showToast('📷 Camera: attach feature — POST /api/debug/attachments'), children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" }), _jsx("circle", { cx: "12", cy: "13", r: "4" })] }) })] }), _jsxs("button", { className: "report-btn", onClick: () => navigate('/report'), children: [_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), _jsx("polyline", { points: "7 10 12 15 17 10" }), _jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })] }), "Generate & Send Report"] })] })] })] }));
};
export default Debug;
