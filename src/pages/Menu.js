import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getTranslations } from '../utils/i18n';
import { showToast } from '../components/Toast';
const EMPTY_UPLOAD = {
    title: '',
    discipline: 'all',
    notes: '',
    file: null,
};
const Menu = () => {
    const { user, lang } = useAppContext();
    const navigate = useNavigate();
    const t = useMemo(() => getTranslations(lang), [lang]);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState(EMPTY_UPLOAD);
    const copy = lang === 'es'
        ? {
            uploadTitle: 'Subida de documentos',
            uploadDescription: 'Carga manuales, fichas técnicas o procedimientos para el asistente documental.',
            uploadName: 'Nombre del documento',
            uploadDiscipline: 'Disciplina',
            uploadNotes: 'Notas internas',
            uploadFile: 'Archivo',
            uploadSubmit: 'Subir documento',
            uploadCancel: 'Cancelar',
            uploadHint: 'El archivo se guardará en el repositorio documental.',
            uploadSuccess: '📄 Documento preparado para subida',
        }
        : {
            uploadTitle: 'Document upload',
            uploadDescription: 'Upload manuals, technical sheets or procedures for the document assistant.',
            uploadName: 'Document name',
            uploadDiscipline: 'Discipline',
            uploadNotes: 'Internal notes',
            uploadFile: 'File',
            uploadSubmit: 'Upload document',
            uploadCancel: 'Cancel',
            uploadHint: 'The file will be stored in the document repository.',
            uploadSuccess: '📄 Document prepared for upload',
        };
    const openUpload = () => {
        setUploadForm(EMPTY_UPLOAD);
        setUploadOpen(true);
    };
    const handleUploadSubmit = (event) => {
        event.preventDefault();
        if (!uploadForm.title.trim()) {
            showToast(lang === 'es' ? '⚠️ Escribe un nombre para el documento' : '⚠️ Add a name for the document');
            return;
        }
        if (!uploadForm.file) {
            showToast(lang === 'es' ? '⚠️ Selecciona un archivo' : '⚠️ Select a file');
            return;
        }
        showToast(copy.uploadSuccess);
        setUploadOpen(false);
        setUploadForm(EMPTY_UPLOAD);
    };
    return (_jsxs("div", { className: "menu-body", children: [_jsx("div", { className: "page-title", children: t.menu.title }), _jsxs("div", { className: "menu-grid", children: [_jsxs("button", { className: "menu-card", onClick: () => navigate('/docchat'), children: [_jsx("div", { className: "menu-card-icon blue", children: _jsxs("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "none", stroke: "#1a5fa8", strokeWidth: "2", children: [_jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), _jsx("polyline", { points: "14 2 14 8 20 8" }), _jsx("line", { x1: "16", y1: "13", x2: "8", y2: "13" }), _jsx("line", { x1: "16", y1: "17", x2: "8", y2: "17" }), _jsx("polyline", { points: "10 9 9 9 8 9" })] }) }), _jsxs("div", { className: "menu-card-text", children: [_jsx("h3", { children: t.menu.documentChatTitle }), _jsx("p", { children: t.menu.documentChatDescription })] })] }), _jsxs("button", { className: "menu-card", onClick: () => navigate('/topology'), children: [_jsx("div", { className: "menu-card-icon green", children: _jsxs("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "none", stroke: "#1a7a50", strokeWidth: "2", children: [_jsx("circle", { cx: "12", cy: "5", r: "3" }), _jsx("circle", { cx: "5", cy: "19", r: "3" }), _jsx("circle", { cx: "19", cy: "19", r: "3" }), _jsx("line", { x1: "12", y1: "8", x2: "5.5", y2: "16" }), _jsx("line", { x1: "12", y1: "8", x2: "18.5", y2: "16" }), _jsx("line", { x1: "7", y1: "19", x2: "17", y2: "19" })] }) }), _jsxs("div", { className: "menu-card-text", children: [_jsx("h3", { children: t.menu.topologyTitle }), _jsx("p", { children: t.menu.topologyDescription })] })] }), user?.role === 'admin' && (_jsxs(_Fragment, { children: [_jsxs("button", { className: "menu-card admin-only", onClick: () => navigate('/dashboard'), style: { borderColor: 'rgba(94,61,179,0.3)' }, children: [_jsx("div", { className: "menu-card-icon purple", children: _jsxs("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "none", stroke: "#5e3db3", strokeWidth: "2", children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7" })] }) }), _jsxs("div", { className: "menu-card-text", children: [_jsxs("h3", { children: [t.menu.dashboardTitle, ' ', _jsx("span", { style: {
                                                            fontSize: '10px',
                                                            background: 'var(--purple-bg)',
                                                            color: 'var(--purple)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontWeight: 600,
                                                            marginLeft: '4px',
                                                        }, children: t.menu.adminBadge })] }), _jsx("p", { children: t.menu.dashboardDescription })] })] }), _jsxs("button", { className: "menu-card admin-only", onClick: openUpload, style: { borderColor: 'rgba(26,95,168,0.22)' }, children: [_jsx("div", { className: "menu-card-icon blue", children: _jsxs("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "none", stroke: "#1a5fa8", strokeWidth: "2", children: [_jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), _jsx("polyline", { points: "17 8 12 3 7 8" }), _jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })] }) }), _jsxs("div", { className: "menu-card-text", children: [_jsx("h3", { children: lang === 'es' ? 'Subir documentos' : 'Upload documents' }), _jsx("p", { children: copy.uploadDescription })] })] })] }))] }), uploadOpen && (_jsx("div", { className: "modal-overlay open", onClick: (event) => { if (event.target === event.currentTarget)
                    setUploadOpen(false); }, children: _jsxs("div", { className: "modal-box", style: { maxWidth: 560 }, children: [_jsxs("div", { className: "modal-header", children: [_jsx("h2", { children: copy.uploadTitle }), _jsx("button", { className: "modal-close", onClick: () => setUploadOpen(false), "aria-label": t.common.close, children: "\u2715" })] }), _jsxs("form", { onSubmit: handleUploadSubmit, className: "modal-body", style: { display: 'grid', gap: 14 }, children: [_jsx("p", { style: { margin: 0, color: 'var(--ink2)', fontSize: 13, lineHeight: 1.6 }, children: copy.uploadDescription }), _jsx("label", { className: "sr-only", htmlFor: "upload-title", children: copy.uploadName }), _jsx("input", { id: "upload-title", className: "form-input", value: uploadForm.title, onChange: (event) => setUploadForm(prev => ({ ...prev, title: event.target.value })), placeholder: copy.uploadName, "aria-label": copy.uploadName }), _jsx("label", { className: "sr-only", htmlFor: "upload-discipline", children: copy.uploadDiscipline }), _jsxs("select", { id: "upload-discipline", className: "form-select", value: uploadForm.discipline, onChange: (event) => setUploadForm(prev => ({ ...prev, discipline: event.target.value })), "aria-label": copy.uploadDiscipline, children: [_jsx("option", { value: "all", children: t.common.all }), _jsx("option", { value: "electrical", children: "Electrical" }), _jsx("option", { value: "mechanical", children: "Mechanical" }), _jsx("option", { value: "hydraulic", children: "Hydraulic" }), _jsx("option", { value: "pneumatic", children: "Pneumatic" }), _jsx("option", { value: "automation", children: "Automation" })] }), _jsx("label", { className: "sr-only", htmlFor: "upload-notes", children: copy.uploadNotes }), _jsx("textarea", { id: "upload-notes", className: "form-input", value: uploadForm.notes, onChange: (event) => setUploadForm(prev => ({ ...prev, notes: event.target.value })), placeholder: copy.uploadNotes, "aria-label": copy.uploadNotes, rows: 4, style: { resize: 'vertical', minHeight: 96 } }), _jsxs("div", { style: { display: 'grid', gap: 8 }, children: [_jsx("label", { htmlFor: "upload-file", style: { fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }, children: copy.uploadFile }), _jsx("input", { id: "upload-file", type: "file", onChange: (event) => setUploadForm(prev => ({ ...prev, file: event.target.files?.[0] || null })), "aria-label": copy.uploadFile })] }), _jsx("div", { style: { fontSize: 12, color: 'var(--ink3)' }, children: copy.uploadHint }), _jsxs("div", { className: "modal-footer", style: { padding: 0, borderTop: 'none', marginTop: 4 }, children: [_jsx("button", { className: "btn btn-primary", type: "submit", children: copy.uploadSubmit }), _jsx("button", { className: "btn btn-outline", type: "button", onClick: () => setUploadOpen(false), children: copy.uploadCancel })] })] })] }) }))] }));
};
export default Menu;
