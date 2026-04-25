import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { showToast } from './Toast';
const SettingsModal = ({ isOpen, onClose }) => {
    const { user, dark, setDark, apiBase, lmBase } = useAppContext();
    const [localApi, setLocalApi] = useState(apiBase);
    const [localLm, setLocalLm] = useState(lmBase);
    if (!isOpen)
        return null;
    const handleSave = () => {
        // En un escenario real, aquí despacharías a useAppContext().setApiBase(localApi), etc.
        showToast('✅ Configuración guardada localmente');
        onClose();
    };
    const testConnections = () => {
        showToast('🔌 Probando conexión a FastAPI y LM Studio...');
        setTimeout(() => showToast('✅ FastAPI · ❌ LM Studio (No detectado)'), 1500);
    };
    return (_jsx("div", { className: "modal-overlay open", onClick: (e) => { if (e.target === e.currentTarget)
            onClose(); }, children: _jsxs("div", { className: "modal-box", children: [_jsxs("div", { className: "modal-header", children: [_jsx("h2", { children: "Settings" }), _jsx("button", { className: "modal-close", onClick: onClose, children: "\u2715" })] }), _jsxs("div", { className: "modal-body", children: [_jsxs("div", { className: "settings-section", children: [_jsx("h3", { children: "Appearance & Language" }), _jsxs("div", { className: "settings-block", children: [_jsxs("div", { className: "settings-row", children: [_jsx("div", { children: _jsx("div", { className: "sr-label", children: "Dark Theme" }) }), _jsxs("label", { className: "toggle", children: [_jsx("input", { type: "checkbox", checked: dark, onChange: () => setDark(!dark) }), _jsx("span", { className: "toggle-track" }), _jsx("span", { className: "toggle-thumb" })] })] }), _jsxs("div", { className: "settings-row", children: [_jsx("div", { className: "sr-label", children: "Language" }), _jsxs("select", { className: "form-select", defaultValue: "Espa\u00F1ol", style: { maxWidth: 150 }, onChange: () => showToast('Language updated (Simulado)'), children: [_jsx("option", { children: "English" }), _jsx("option", { children: "Espa\u00F1ol" })] })] })] })] }), _jsxs("div", { className: "settings-section", children: [_jsx("h3", { children: "Account" }), _jsxs("div", { className: "settings-block", children: [_jsx("div", { className: "settings-row", children: _jsxs("div", { children: [_jsx("div", { className: "sr-label", children: "Username" }), _jsx("div", { className: "sr-sub", children: user?.name || 'Invitado' })] }) }), _jsx("div", { className: "settings-row", children: _jsxs("div", { children: [_jsx("div", { className: "sr-label", children: "Role" }), _jsx("div", { className: "sr-sub capitalize", children: user?.role || '—' })] }) })] })] }), _jsxs("div", { className: "settings-section", children: [_jsx("h3", { children: "System & Connections" }), _jsxs("div", { className: "settings-block", children: [_jsxs("div", { className: "settings-row", children: [_jsx("div", { className: "sr-label", children: "App Version" }), _jsx("div", { style: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink2)' }, children: "2.1.0 (React)" })] }), _jsxs("div", { className: "settings-row", children: [_jsx("div", { children: _jsx("div", { className: "sr-label", children: "FastAPI Endpoint" }) }), _jsx("input", { className: "form-input", value: localApi, onChange: e => setLocalApi(e.target.value), style: { maxWidth: 190, fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 8px' } })] }), _jsxs("div", { className: "settings-row", children: [_jsx("div", { children: _jsx("div", { className: "sr-label", children: "LM Studio Endpoint" }) }), _jsx("input", { className: "form-input", value: localLm, onChange: e => setLocalLm(e.target.value), style: { maxWidth: 190, fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 8px' } })] }), _jsxs("div", { className: "settings-row", children: [_jsxs("div", { children: [_jsx("div", { className: "sr-label", children: "Probar conexiones" }), _jsx("div", { className: "sr-sub", children: "Verifica el estado de las APIs" })] }), _jsx("button", { className: "btn btn-sm btn-outline", onClick: testConnections, children: "\uD83D\uDD0C Probar" })] })] })] })] }), _jsxs("div", { className: "modal-footer", children: [_jsx("button", { className: "btn btn-primary", onClick: handleSave, children: "Save Changes" }), _jsx("button", { className: "btn btn-outline", onClick: onClose, children: "Cancel" })] })] }) }));
};
export default SettingsModal;
