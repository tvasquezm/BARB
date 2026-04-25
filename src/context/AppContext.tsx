import React, { createContext, useContext, useState, useCallback } from 'react'
import { User, AppContextValue, Message } from '../types'

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
  docMessages: [] as Message[],
  debugMessages: [] as Message[],
  user: null,
  apiBase: (import.meta.env.VITE_API_BASE as string) ?? '/api',
  lmBase: (import.meta.env.VITE_LM_BASE as string) ?? '/lm',
  loading: false,
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<string>(defaultState.currentScreen)
  const [dark, setDark] = useState<boolean>(defaultState.dark)
  const [lang, setLang] = useState<string>(defaultState.lang)
  const [discipline, setDiscipline] = useState<string | null>(defaultState.discipline)
  const [docMachine, setDocMachine] = useState<string>(defaultState.docMachine)
  const [plant, setPlant] = useState<string>(defaultState.plant)
  const [selectedMachine, setSelectedMachine] = useState<string | null>(defaultState.selectedMachine)
  const [sessionId, setSessionId] = useState<string | null>(defaultState.sessionId)
  const [sessionStart, setSessionStart] = useState<number | null>(defaultState.sessionStart)
  const [docMessages, setDocMessages] = useState<Message[]>(defaultState.docMessages)
  const [debugMessages, setDebugMessages] = useState<Message[]>(defaultState.debugMessages)
  const [user, setUser] = useState<User | null>(defaultState.user)
  const [apiBase, setApiBase] = useState<string>(defaultState.apiBase)
  const [lmBase, setLmBase] = useState<string>(defaultState.lmBase)
  const [loading, setLoading] = useState<boolean>(defaultState.loading)

  const pushDocMessage = useCallback((m: Message) => setDocMessages(prev => [...prev, m]), [])
  const pushDebugMessage = useCallback((m: Message) => setDebugMessages(prev => [...prev, m]), [])

  const value: AppContextValue = {
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
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useAppContext = (): AppContextValue => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
