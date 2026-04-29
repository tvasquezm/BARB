async function callAPI(base, path, opts) {
    const url = base + path;
    const headers = { 'Content-Type': 'application/json', ...opts?.headers };
    const res = await fetch(url, { credentials: 'include', ...opts, headers });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || res.statusText);
    }
    // Try parse JSON, otherwise return empty
    const txt = await res.text();
    try {
        return JSON.parse(txt);
    }
    catch {
        return txt;
    }
}
export const createApiService = (apiBase = '/api', lmBase = '/lm') => {
    return {
        auth: {
            login: async (username, password, role) => callAPI(apiBase, '/auth/login', { method: 'POST', body: JSON.stringify({ username, password, role }) }),
            logout: async () => callAPI(apiBase, '/auth/logout', { method: 'POST' }),
        },
        health: async () => callAPI(apiBase, '/health', { method: 'GET' }),
        disciplines: async (plantId) => callAPI(apiBase, `/disciplines${plantId ? `?plantId=${encodeURIComponent(plantId)}` : ''}`, { method: 'GET' }),
        plants: async () => callAPI(apiBase, '/plants', { method: 'GET' }),
        chat: {
            documents: async (payload) => callAPI(apiBase, '/chat/documents', { method: 'POST', body: JSON.stringify(payload) }),
            debug: async (payload) => callAPI(apiBase, '/chat/debug', { method: 'POST', body: JSON.stringify(payload) }),
        },
        debug: {
            startSession: async (payload) => callAPI(apiBase, '/debug/sessions', { method: 'POST', body: JSON.stringify(payload) }),
        },
        reports: {
            send: async (payload) => callAPI(apiBase, '/reports/debug', { method: 'POST', body: JSON.stringify(payload) }),
            upload: async (payload) => callAPI(apiBase, '/reports/upload', { method: 'POST', body: JSON.stringify(payload) }),
        },
        user: {
            savePreferences: async (payload) => callAPI(apiBase, '/user/preferences', { method: 'PUT', body: JSON.stringify(payload) }),
        },
        lmBase,
    };
};
export default createApiService;
