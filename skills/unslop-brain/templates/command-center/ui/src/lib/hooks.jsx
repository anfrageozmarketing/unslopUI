import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from '@heroui/react';
import { api } from './api.js';
import { parseHash } from './model.js';

const Ctx = createContext(null);
export function DataProvider({ children }) {
  const [data, setData] = useState({ apps: [] });
  const [state, setState] = useState('loading');
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(async () => {
    try { setData(await api.index()); setState('ready'); setError(null); setVersion((v) => v + 1); }
    catch (e) { setError(e.message); setState('error'); }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return <Ctx.Provider value={{ data, state, error, reload, version }}>{children}</Ctx.Provider>;
}
export const useData = () => useContext(Ctx);

export function useRoute() {
  const [r, setR] = useState(() => parseHash(location.hash));
  useEffect(() => { const f = () => setR(parseHash(location.hash)); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  return r;
}

// Every change is optimistic from the user's view and comes with an Undo.
export function useActions() {
  const { reload } = useData();
  return useMemo(() => ({
    async change(path, field, value, prev, label = 'Gespeichert') {
      try {
        await api.patch(path, field, value); await reload();
        const id = toast(label, { timeout: 6000, actionProps: { children: 'Rückgängig', variant: 'tertiary', onPress: async () => {
          try { await api.patch(path, field, prev); await reload(); toast.close(id); } catch (e) { toast.danger(e.message); }
        } } });
      } catch (e) { toast.danger(e.message); }
    },
    async create(kind, payload) {
      try { const r = await api.create(kind, payload); await reload(); toast.success('Angelegt'); return r; } catch (e) { toast.danger(e.message); return null; }
    },
    async archive(path) {
      try {
        const r = await api.archive(path); await reload();
        const id = toast('Archiviert', { timeout: 8000, actionProps: { children: 'Rückgängig', variant: 'tertiary', onPress: async () => {
          try { await api.restore(r.restore); await reload(); toast.close(id); } catch (e) { toast.danger(e.message); }
        } } });
        return true;
      } catch (e) { toast.danger(e.message); return false; }
    },
    async saveBody(path, text) {
      try { await api.putBody(path, text); await reload(); toast.success('Text gespeichert'); return true; } catch (e) { toast.danger(e.message); return false; }
    },
  }), [reload]);
}
