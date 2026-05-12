import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { showToast } from './Toast';
import { getTranslations, normalizeLang } from '../utils/i18n';
const SettingsModal = ({ isOpen, onClose }) => {
    const { user, dark, lang, setDark, setLang, apiBase, lmBase, setApiBase, setLmBase, } = useAppContext();
    const t = useMemo(() => getTranslations(lang), [lang]);
    const [localApi, setLocalApi] = useState(apiBase);
    const [localLm, setLocalLm] = useState(lmBase);
    const [localLang, setLocalLang] = useState(normalizeLang(lang));
    useEffect(() => {
        if (!isOpen)
            return;
        setLocalApi(apiBase);
        setLocalLm(lmBase);
        setLocalLang(normalizeLang(lang));
    }, [apiBase, lang, lmBase, isOpen]);
    if (!isOpen)
        return null;
    const handleSave = () => {
        const nextApi = localApi.trim();
        const nextLm = localLm.trim();
        if (nextApi)
            setApiBase(nextApi);
        if (nextLm)
            setLmBase(nextLm);
        setLang(localLang);
        showToast(t.settings.savedLocally);
        onClose();
    };
    /**
     * Realiza un "handshake" liviano contra LM Studio verificando que el servidor responde
     * al endpoint equivalente a OpenAI-compatible `GET /models`.
     *
     * - Normaliza `localLm` (trim + remueve slash final)
     * - Asegura URL absoluta (si no trae protocolo, antepone `http://`)
     * - Si `localLm` termina en `/v1` -> prueba `${base}/models`
     *   Si no -> prueba `${base}/v1/models`
     * - Aplica AbortSignal.timeout(3000) para evitar requests colgadas/stalled
     * - Usa headers para asegurar respuesta fresca y parseable
     * - Maneja errores: TimeoutError y TypeError (para logs diferenciados en dev)
     */
    const testConnections = async () => {
        showToast(t.settings.testingConnections);
        const normalizedLm = (localLm || '')
            .trim()
            .replace(/\/+$/, ''); // elimina slashes finales
        if (!normalizedLm) {
            showToast(t.settings.apiOkLmOffline);
            return;
        }
        const baseUrl = /^https?:\/\//i.test(normalizedLm) ? normalizedLm : `http://${normalizedLm}`;
        const handshakeUrl = baseUrl.includes('/v1')
            ? baseUrl.endsWith('/v1') ? `${baseUrl}/models` : baseUrl.replace(/\/v1\/+$/i, '') + '/v1/models'
            : `${baseUrl}/v1/models`;
        const acceptHeaders = {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
        };
        try {
            const res = await fetch(handshakeUrl, {
                method: 'GET',
                headers: acceptHeaders,
                cache: 'no-store',
                signal: AbortSignal.timeout(3000),
            });
            if (res.ok) {
                showToast(t.settings.apiOkLmOk);
                return;
            }
            // Servidor respondió con error 4xx/5xx
            showToast(t.settings.apiOkLmOffline);
        }
        catch (err) {
            if (err instanceof DOMException && err.name === 'TimeoutError') {
                // Timeout explícito por AbortSignal.timeout
                if (import.meta.env.DEV)
                    console.debug('[LMStudio handshake] TimeoutError', err);
            }
            else if (err instanceof TypeError) {
                // Red/CORS/Network failure típicamente aparece como TypeError
                if (import.meta.env.DEV)
                    console.debug('[LMStudio handshake] TypeError', err);
            }
            else {
                if (import.meta.env.DEV)
                    console.debug('[LMStudio handshake] Unknown error', err);
            }
            showToast(t.settings.apiOkLmOffline);
        }
    };
    return (_jsx("div", { className: "modal-overlay open", onClick: (event) => { if (event.target === event.currentTarget)
            onClose(); }, children: _jsxs("div", { className: "modal-box", children: [_jsxs("div", { className: "modal-header", children: [_jsx("h2", { children: t.settings.title }), _jsx("button", { className: "modal-close", onClick: onClose, "aria-label": t.common.close, children: "\u2715" })] }), _jsxs("div", { className: "modal-body", children: [_jsxs("div", { className: "settings-section", children: [_jsx("h3", { children: t.settings.appearanceLanguage }), _jsxs("div", { className: "settings-block", children: [_jsxs("div", { className: "settings-row", children: [_jsx("div", { children: _jsx("div", { className: "sr-label", children: t.settings.darkTheme }) }), _jsxs("label", { className: "toggle", "aria-label": t.settings.darkTheme, children: [_jsx("input", { type: "checkbox", checked: dark, onChange: () => setDark(!dark), "aria-label": t.settings.darkTheme }), _jsx("span", { className: "toggle-track" }), _jsx("span", { className: "toggle-thumb" })] })] }), _jsxs("div", { className: "settings-row", children: [_jsx("div", { children: _jsx("div", { className: "sr-label", children: t.common.language }) }), _jsxs("select", { className: "form-select", value: localLang, title: t.common.language, "aria-label": t.common.language, style: { maxWidth: 150 }, onChange: (event) => setLocalLang(normalizeLang(event.target.value)), children: [_jsx("option", { value: "en", children: "English" }), _jsx("option", { value: "es", children: "Espa\u00F1ol" })] })] })] })] }), _jsxs("div", { className: "settings-section", children: [_jsx("h3", { children: t.settings.account }), _jsxs("div", { className: "settings-block", children: [_jsx("div", { className: "settings-row", children: _jsxs("div", { children: [_jsx("div", { className: "sr-label", children: t.common.username }), _jsx("div", { className: "sr-sub", children: user?.name || t.settings.guest })] }) }), _jsx("div", { className: "settings-row", children: _jsxs("div", { children: [_jsx("div", { className: "sr-label", children: t.common.role }), _jsx("div", { className: "sr-sub capitalize", children: user?.role || '—' })] }) })] })] }), _jsxs("div", { className: "settings-section", children: [_jsx("h3", { children: t.settings.systemConnections }), _jsxs("div", { className: "settings-block", children: [_jsxs("div", { className: "settings-row", children: [_jsx("div", { className: "sr-label", children: t.settings.appVersion }), _jsx("div", { style: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink2)' }, children: "2.1.0 (React)" })] }), _jsxs("div", { className: "settings-row", children: [_jsx("div", { children: _jsx("div", { className: "sr-label", children: t.settings.fastApiEndpoint }) }), _jsx("input", { className: "form-input", value: localApi, onChange: (event) => setLocalApi(event.target.value), title: t.settings.fastApiEndpoint, "aria-label": t.settings.fastApiEndpoint, placeholder: "http://127.0.0.1:8000/api", style: { maxWidth: 190, fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 8px' } })] }), _jsxs("div", { className: "settings-row", children: [_jsx("div", { children: _jsx("div", { className: "sr-label", children: t.settings.lmStudioEndpoint }) }), _jsx("input", { className: "form-input", value: localLm, onChange: (event) => setLocalLm(event.target.value), title: t.settings.lmStudioEndpoint, "aria-label": t.settings.lmStudioEndpoint, placeholder: "http://localhost:1234/v1", style: { maxWidth: 190, fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 8px' } })] }), _jsxs("div", { className: "settings-row", children: [_jsx("div", { children: _jsx("div", { className: "sr-label", children: t.settings.testConnections }) }), _jsx("button", { className: "btn btn-sm btn-outline", onClick: testConnections, children: t.settings.testConnections })] })] })] })] }), _jsxs("div", { className: "modal-footer", children: [_jsx("button", { className: "btn btn-primary", onClick: handleSave, children: t.settings.saveChanges }), _jsx("button", { className: "btn btn-outline", onClick: onClose, children: t.common.cancel })] })] }) }));
};
export default SettingsModal;
