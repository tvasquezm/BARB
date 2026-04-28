import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import createApiService from '../services/api';
import { getTranslations } from '../utils/i18n';
const Login = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('technician');
    const { setUser, apiBase, setLoading, dark, setDark, lang } = useAppContext();
    const navigate = useNavigate();
    const api = createApiService(apiBase);
    const t = useMemo(() => getTranslations(lang), [lang]);
    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add('dark');
            document.body.dataset.theme = 'dark';
        }
        else {
            document.documentElement.classList.remove('dark');
            document.body.dataset.theme = 'light';
        }
    }, [dark]);
    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const resp = await api.auth.login(name || 'operator', password || '***', role);
            const usr = resp && resp.name
                ? { id: resp.id || String(Date.now()), name: resp.name, role: resp.role || role }
                : { id: String(Date.now()), name: name || 'Usuario', role };
            setUser(usr);
            const dest = role === 'admin' ? '/dashboard' : '/menu';
            navigate(dest);
        }
        catch (err) {
            const usr = { id: String(Date.now()), name: name || 'Usuario', role };
            setUser(usr);
            const dest = role === 'admin' ? '/dashboard' : '/menu';
            navigate(dest);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "flex min-h-screen w-full flex-col items-center justify-center relative", style: { background: 'var(--bg)' }, children: [_jsx("div", { className: "absolute right-6 top-6", children: _jsx("button", { className: "icon-btn", onClick: () => setDark(!dark), title: t.login.themeToggle, "aria-label": t.login.themeToggle, style: { background: 'var(--surface)', border: '1px solid var(--border)' }, children: _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" }) }) }) }), _jsxs("div", { className: "login-card", children: [_jsx("div", { className: "login-icon", children: "\uD83C\uDFED" }), _jsx("div", { className: "login-title", children: "BARB" }), _jsx("div", { className: "login-sub", children: t.login.subtitle }), _jsxs("form", { onSubmit: submit, children: [_jsx("div", { className: "form-field", children: _jsx("input", { value: name, onChange: (e) => setName(e.target.value), className: "form-input", placeholder: t.login.usernamePlaceholder, autoComplete: "username", "aria-label": t.login.usernamePlaceholder }) }), _jsx("div", { className: "form-field", children: _jsx("input", { value: password, onChange: (e) => setPassword(e.target.value), type: "password", className: "form-input", placeholder: t.login.passwordPlaceholder, autoComplete: "current-password", "aria-label": t.login.passwordPlaceholder }) }), _jsxs("div", { className: "form-field", children: [_jsx("label", { className: "sr-only", htmlFor: "role-select", children: t.login.chooseRole }), _jsxs("select", { id: "role-select", value: role, onChange: (e) => setRole(e.target.value), className: "form-select", "aria-label": t.login.chooseRole, children: [_jsx("option", { value: "technician", children: t.login.technician }), _jsx("option", { value: "engineer", children: t.login.engineer }), _jsx("option", { value: "supervisor", children: t.login.supervisor }), _jsx("option", { value: "admin", children: t.login.admin })] })] }), _jsx("button", { type: "submit", className: "btn btn-primary btn-lg w-full mt-4", children: t.login.loginButton })] })] })] }));
};
export default Login;
