import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
const defaultState = {
    currentScreen: 'login',
    dark: false,
    lang: 'es',
    discipline: null,
    docMachine: 'all',
    plant: 'plant1',
    selectedMachine: null,
    sessionId: null,
    sessionStart: null,
    docMessages: [],
    debugMessages: [],
    user: null,
    apiBase: import.meta.env.VITE_API_URL ??
        import.meta.env.VITE_API_BASE ??
        '/api',
    lmBase: import.meta.env.VITE_LM_STUDIO_URL ??
        import.meta.env.VITE_LM_BASE ??
        '/lm',
    loading: false,
};
const readStoredString = (key, fallback) => {
    if (typeof window === 'undefined')
        return fallback;
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
};
const readStoredBoolean = (key, fallback) => {
    if (typeof window === 'undefined')
        return fallback;
    const value = window.localStorage.getItem(key);
    if (value === null)
        return fallback;
    return value === 'true';
};
const AppContext = createContext(undefined);
export const AppProvider = ({ children }) => {
    const [currentScreen, setCurrentScreen] = useState(() => readStoredString('barb.currentScreen', defaultState.currentScreen) ?? defaultState.currentScreen);
    const [dark, setDark] = useState(() => readStoredBoolean('barb.dark', defaultState.dark));
    const [lang, setLang] = useState(() => readStoredString('barb.lang', defaultState.lang) ?? defaultState.lang);
    const [discipline, setDiscipline] = useState(() => readStoredString('barb.discipline', defaultState.discipline));
    const [docMachine, setDocMachine] = useState(() => readStoredString('barb.docMachine', defaultState.docMachine) ?? defaultState.docMachine);
    const [plant, setPlant] = useState(() => readStoredString('barb.plant', defaultState.plant) ?? defaultState.plant);
    const [selectedMachine, setSelectedMachine] = useState(() => readStoredString('barb.selectedMachine', defaultState.selectedMachine));
    const [sessionId, setSessionId] = useState(defaultState.sessionId);
    const [sessionStart, setSessionStart] = useState(defaultState.sessionStart);
    const [docMessages, setDocMessages] = useState(defaultState.docMessages);
    const [debugMessages, setDebugMessages] = useState(defaultState.debugMessages);
    const [user, setUser] = useState(defaultState.user);
    const [apiBase, setApiBase] = useState(defaultState.apiBase);
    const [lmBase, setLmBase] = useState(defaultState.lmBase);
    const [loading, setLoading] = useState(defaultState.loading);
    const pushDocMessage = useCallback((m) => setDocMessages(prev => [...prev, m]), []);
    const pushDebugMessage = useCallback((m) => setDebugMessages(prev => [...prev, m]), []);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        window.localStorage.setItem('barb.currentScreen', currentScreen);
    }, [currentScreen]);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        window.localStorage.setItem('barb.dark', String(dark));
    }, [dark]);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        window.localStorage.setItem('barb.lang', lang);
    }, [lang]);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        if (discipline)
            window.localStorage.setItem('barb.discipline', discipline);
        else
            window.localStorage.removeItem('barb.discipline');
    }, [discipline]);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        window.localStorage.setItem('barb.docMachine', docMachine);
    }, [docMachine]);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        window.localStorage.setItem('barb.plant', plant);
    }, [plant]);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        if (selectedMachine)
            window.localStorage.setItem('barb.selectedMachine', selectedMachine);
        else
            window.localStorage.removeItem('barb.selectedMachine');
    }, [selectedMachine]);
    const value = {
        currentScreen,
        dark,
        lang,
        discipline,
        docMachine,
        plant,
        selectedMachine,
        sessionId,
        sessionStart,
        docMessages,
        debugMessages,
        user,
        apiBase,
        lmBase,
        loading,
        setCurrentScreen,
        setDark,
        setLang,
        setDiscipline,
        setDocMachine,
        setPlant,
        setSelectedMachine,
        setSessionId,
        setSessionStart,
        pushDocMessage,
        pushDebugMessage,
        setUser,
        setApiBase,
        setLmBase,
        setLoading,
    };
    return _jsx(AppContext.Provider, { value: value, children: children });
};
export const useAppContext = () => {
    const ctx = useContext(AppContext);
    if (!ctx)
        throw new Error('useAppContext must be used within AppProvider');
    return ctx;
};
