import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ChatBubble, { Thinking } from '../components/ChatBubble';
import MACHINES from '../data/machines';
import { getTranslations, normalizeLang } from '../utils/i18n';
const DISCIPLINES = [
    { id: 'electrical', icon: '⚡' },
    { id: 'mechanical', icon: '⚙️' },
    { id: 'hydraulic', icon: '💧' },
    { id: 'pneumatic', icon: '💨' },
    { id: 'automation', icon: '🤖' },
];
const PLANTS = [
    { id: 'plant1', label: { es: 'Planta principal de producción', en: 'Main Production Plant' } },
    { id: 'plant2', label: { es: 'Línea de ensamblaje 2', en: 'Assembly Line 2' } },
    { id: 'plant3', label: { es: 'Bodega / almacén', en: 'Warehouse Facility' } },
];
const MACHINE_GROUPS = [
    { id: 'all', label: { es: 'Todas las máquinas', en: 'All machines' }, status: 'ok' },
    ...Object.entries(MACHINES).map(([id, machine]) => ({
        id,
        label: { es: machine.name, en: machine.name },
        model: machine.model,
        status: machine.status === 'warning' ? 'warning' : machine.status === 'maintenance' ? 'maintenance' : 'ok',
    })),
];
const DocChat = () => {
    const { apiBase, discipline, docMachine, plant, docMessages, pushDocMessage, loading, setLoading, setDiscipline, setPlant, setDocMachine, selectedMachine, setSelectedMachine, lang, } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [input, setInput] = useState('');
    const areaRef = useRef(null);
    const t = useMemo(() => getTranslations(lang), [lang]);
    const isEs = normalizeLang(lang) === 'es';
    useEffect(() => {
        if (selectedMachine && docMachine !== selectedMachine) {
            setDocMachine(selectedMachine);
        }
    }, [docMachine, selectedMachine, setDocMachine]);
    useEffect(() => {
        if (location.state && typeof location.state === 'object') {
            const state = location.state;
            if (state.machineId)
                setSelectedMachine(state.machineId);
            if (state.machineId && docMachine !== state.machineId)
                setDocMachine(state.machineId);
            if (state.discipline)
                setDiscipline(state.discipline);
            if (state.plant)
                setPlant(state.plant);
        }
    }, [location.state, docMachine, setDocMachine, setDiscipline, setPlant, setSelectedMachine]);
    useEffect(() => {
        if (areaRef.current)
            areaRef.current.scrollTop = areaRef.current.scrollHeight;
    }, [docMessages.length]);
    const currentPlant = PLANTS.find(item => item.id === plant) ?? PLANTS[0];
    const currentMachine = MACHINE_GROUPS.find(item => item.id === docMachine) ?? MACHINE_GROUPS[0];
    const currentDiscipline = DISCIPLINES.find(item => item.id === discipline) ?? null;
    const handleInput = (e) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
    };
    const handleSelectMachine = (id) => {
        setDocMachine(id);
        if (id !== 'all')
            setSelectedMachine(id);
    };
    const send = async () => {
        const query = input.trim();
        if (!query || loading || !discipline)
            return;
        setLoading(true);
        setInput('');
        const userMsg = { role: 'user', content: query, timestamp: Date.now() };
        pushDocMessage(userMsg);
        const el = document.getElementById('doc-input');
        if (el)
            el.style.height = 'auto';
        try {
            const response = await fetch(`${apiBase.replace(/\/$/, '')}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: query,
                    lang: normalizeLang(lang),
                    discipline,
                    plant,
                    machine_id: docMachine,
                }),
            });
            if (!response.ok) {
                throw new Error(await response.text().catch(() => response.statusText));
            }
            const data = (await response.json());
            pushDocMessage({
                role: 'assistant',
                content: data.reply,
                timestamp: Date.now(),
            });
        }
        catch (error) {
            console.error('Error calling chat API', error);
            pushDocMessage({
                role: 'assistant',
                content: isEs
                    ? 'No se pudo conectar con el backend de Plant Memory en este momento.'
                    : 'Could not connect to the Plant Memory backend right now.',
                timestamp: Date.now(),
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void send();
        }
    };
    const activeDisciplineLabel = currentDiscipline ? `${currentDiscipline.icon} ${isEs ? currentDiscipline.id : currentDiscipline.id}` : '';
    return (_jsxs("div", { className: "two-panel w-full h-full", children: [_jsxs("div", { className: "panel-left", children: [_jsxs("div", { className: "panel-section", children: [_jsx("span", { className: "panel-label", children: isEs ? 'Planta / Ubicación' : 'Plant / Location' }), _jsx("select", { "aria-label": isEs ? 'Seleccionar planta' : 'Select plant', className: "form-select", value: plant, onChange: e => setPlant(e.target.value), children: PLANTS.map(option => (_jsx("option", { value: option.id, children: option.label[normalizeLang(lang)] }, option.id))) })] }), _jsxs("div", { className: "panel-section", children: [_jsx("span", { className: "panel-label", children: isEs ? 'Disciplina' : 'Discipline' }), _jsx("div", { className: "disc-list", children: DISCIPLINES.map(disciplineOption => (_jsxs("button", { className: `disc-pill ${discipline === disciplineOption.id ? 'active' : ''}`, "data-d": disciplineOption.id, onClick: () => setDiscipline(discipline === disciplineOption.id ? null : disciplineOption.id), children: [_jsx("span", { className: "disc-dot" }), disciplineOption.icon, " ", isEs ? disciplineOption.id.charAt(0).toUpperCase() + disciplineOption.id.slice(1) : disciplineOption.id.charAt(0).toUpperCase() + disciplineOption.id.slice(1)] }, disciplineOption.id))) })] }), _jsxs("div", { className: "panel-section", children: [_jsx("span", { className: "panel-label", children: isEs ? 'Máquina (opcional)' : 'Machine (optional)' }), _jsx("div", { className: "machine-sel-list", children: MACHINE_GROUPS.map(machine => (_jsxs("button", { className: `machine-sel-item ${docMachine === machine.id ? 'active' : ''}`, onClick: () => handleSelectMachine(machine.id), children: [_jsx("span", { className: `msi-dot ${machine.status === 'warning' ? 'warn' : machine.status === 'maintenance' ? 'maintain' : 'ok'}` }), _jsxs("div", { children: [_jsx("div", { className: "msi-name", children: machine.label[normalizeLang(lang)] }), 'model' in machine && machine.model ? _jsx("div", { className: "msi-model", children: machine.model }) : null] })] }, machine.id))) })] })] }), _jsxs("div", { className: "panel-right", children: [_jsx("div", { className: "context-tags", style: { flexShrink: 0 }, children: !discipline ? (_jsx("span", { className: "ctx-empty", children: isEs ? 'Selecciona una disciplina para empezar a chatear con documentación' : 'Select a discipline to start chatting with documentation' })) : (_jsxs(_Fragment, { children: [_jsxs("span", { className: "ctx-tag plant", children: ["\uD83D\uDCCD ", currentPlant.label[normalizeLang(lang)]] }), _jsxs("span", { className: `ctx-tag ${discipline === 'electrical' ? 'disc-el' : discipline === 'mechanical' ? 'disc-me' : discipline === 'hydraulic' ? 'disc-hy' : discipline === 'pneumatic' ? 'disc-pn' : 'disc-au'}`, children: ["\u25C9 ", activeDisciplineLabel] }), docMachine !== 'all' && MACHINES[docMachine] && _jsxs("span", { className: "ctx-tag machine", children: ["\u2699 ", MACHINES[docMachine].name] })] })) }), _jsxs("div", { className: "chat-messages", ref: areaRef, children: [docMessages.length === 0 ? (_jsxs("div", { className: "chat-empty", children: [_jsx("h3", { children: isEs ? 'Selecciona una disciplina para empezar' : 'Select a discipline to start' }), _jsx("p", { children: isEs ? 'Puedes cambiar planta, disciplina y máquina desde el panel lateral.' : 'You can change plant, discipline and machine from the side panel.' })] })) : (docMessages.map((m, i) => (_jsx(ChatBubble, { msg: m, side: m.role === 'user' ? 'user' : 'bot' }, i)))), loading && _jsx("div", { className: "mt-md", children: _jsx(Thinking, {}) })] }), _jsxs("div", { className: "input-zone", style: { flexShrink: 0 }, children: [_jsxs("div", { className: "input-wrap", children: [_jsx("textarea", { id: "doc-input", value: input, onChange: handleInput, onKeyDown: handleKeyDown, rows: 1, placeholder: isEs ? 'Pregunta por procedimientos, especificaciones, mantenimiento…' : 'Ask about procedures, specifications, maintenance…', disabled: !discipline || loading, className: "flex-1 resize-none overflow-hidden bg-transparent border-none outline-none text-[13px] text-[var(--ink)] placeholder-[var(--ink3)]" }), _jsx("button", { "aria-label": isEs ? 'Enviar mensaje al chat' : 'Send chat message', className: "send-btn", onClick: () => { void send(); }, disabled: !discipline || loading, children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: [_jsx("line", { x1: "22", y1: "2", x2: "11", y2: "13" }), _jsx("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })] }) })] }), _jsx("div", { className: "input-hint", children: isEs ? 'Enter para enviar · Shift+Enter nueva línea · Powered by FastAPI' : 'Enter to send · Shift+Enter new line · Powered by FastAPI' })] })] })] }));
};
export default DocChat;
