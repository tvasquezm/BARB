import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { showToast } from './Toast';
const MACHINE_OPTIONS = [
    { id: 'comp-a1', label: 'Compressor A1' },
    { id: 'press-b3', label: 'Hydraulic Press B3' },
    { id: 'motor-d1', label: 'Motor Drive D1' },
    { id: 'cnc-c2', label: 'CNC Mill C2' },
    { id: 'pump-e4', label: 'Pump E4' },
];
const INITIAL_FORM = {
    title: '',
    machine: 'comp-a1',
    priority: 'Medium',
    status: 'Open',
    description: '',
};
const WorkOrderCreateModal = ({ isOpen, onClose, onCreate }) => {
    const [form, setForm] = useState(INITIAL_FORM);
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => {
        if (isOpen)
            setForm(INITIAL_FORM);
    }, [isOpen]);
    if (!isOpen)
        return null;
    const handleSubmit = async (event) => {
        event.preventDefault();
        const title = form.title.trim();
        const description = form.description.trim();
        if (!title) {
            showToast('⚠️ Agrega un título para la OT');
            return;
        }
        setSubmitting(true);
        try {
            await onCreate({
                ...form,
                title,
                description,
            });
            onClose();
        }
        catch (error) {
            console.error('Error creating work order', error);
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleOverlayClick = (event) => {
        if (event.target === event.currentTarget)
            onClose();
    };
    return (_jsx("div", { className: "modal-overlay open", onClick: handleOverlayClick, children: _jsxs("div", { className: "modal-box", style: { maxWidth: 720 }, children: [_jsxs("div", { className: "modal-header", children: [_jsxs("div", { children: [_jsx("h2", { children: "Crear OT" }), _jsx("div", { style: { marginTop: 4, fontSize: 12, color: 'var(--ink3)' }, children: "Registra una nueva orden de trabajo en el backend mockeado." })] }), _jsx("button", { type: "button", className: "modal-close", onClick: onClose, children: "\u2715" })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "modal-body", children: [_jsxs("div", { className: "ot-detail-grid", children: [_jsxs("div", { className: "ot-detail-field", children: [_jsx("div", { className: "ot-detail-label", children: "T\u00EDtulo" }), _jsx("input", { className: "form-input", value: form.title, onChange: (event) => setForm(prev => ({ ...prev, title: event.target.value })), placeholder: "Ej. Inspecci\u00F3n de vibraci\u00F3n motor D1" })] }), _jsxs("div", { className: "ot-detail-field", children: [_jsx("div", { className: "ot-detail-label", children: "M\u00E1quina" }), _jsx("select", { className: "form-select", "aria-label": "Seleccionar m\u00E1quina", title: "Seleccionar m\u00E1quina", value: form.machine, onChange: (event) => setForm(prev => ({ ...prev, machine: event.target.value })), children: MACHINE_OPTIONS.map(machine => (_jsx("option", { value: machine.id, children: machine.label }, machine.id))) })] }), _jsxs("div", { className: "ot-detail-field", children: [_jsx("div", { className: "ot-detail-label", children: "Prioridad" }), _jsxs("select", { className: "form-select", "aria-label": "Seleccionar prioridad", title: "Seleccionar prioridad", value: form.priority, onChange: (event) => setForm(prev => ({ ...prev, priority: event.target.value })), children: [_jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" })] })] }), _jsxs("div", { className: "ot-detail-field", children: [_jsx("div", { className: "ot-detail-label", children: "Estado inicial" }), _jsxs("select", { className: "form-select", "aria-label": "Seleccionar estado inicial", title: "Seleccionar estado inicial", value: form.status, onChange: (event) => setForm(prev => ({ ...prev, status: event.target.value })), children: [_jsx("option", { value: "Open", children: "Open" }), _jsx("option", { value: "In Progress", children: "In Progress" }), _jsx("option", { value: "Done", children: "Done" }), _jsx("option", { value: "Closed", children: "Closed" })] })] })] }), _jsxs("div", { children: [_jsx("div", { className: "ot-detail-label", style: { marginBottom: 6 }, children: "Descripci\u00F3n" }), _jsx("textarea", { className: "report-textarea", rows: 5, value: form.description, onChange: (event) => setForm(prev => ({ ...prev, description: event.target.value })), placeholder: "Describe la falla, hallazgo o trabajo preventivo..." })] })] }), _jsxs("div", { className: "modal-footer", children: [_jsx("button", { type: "button", className: "btn btn-outline", onClick: onClose, children: "Cancelar" }), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: submitting, children: submitting ? 'Creando...' : 'Crear OT' })] })] })] }) }));
};
export default WorkOrderCreateModal;
