import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
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
    apiBase: import.meta.env.VITE_API_BASE ?? '/api',
    lmBase: import.meta.env.VITE_LM_BASE ?? '/lm',
    loading: false,
};
const AppContext = createContext(undefined);
export const AppProvider = ({ children }) => {
    const [currentScreen, setCurrentScreen] = useState(defaultState.currentScreen);
    const [dark, setDark] = useState(defaultState.dark);
    const [lang, setLang] = useState(defaultState.lang);
    const [discipline, setDiscipline] = useState(defaultState.discipline);
    const [docMachine, setDocMachine] = useState(defaultState.docMachine);
    const [plant, setPlant] = useState(defaultState.plant);
    const [selectedMachine, setSelectedMachine] = useState(defaultState.selectedMachine);
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
