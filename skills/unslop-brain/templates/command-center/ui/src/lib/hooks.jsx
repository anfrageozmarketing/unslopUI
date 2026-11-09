import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
    catch (e) { setError(e.message); setState((s) => (s === 'loading' ? 'error' : s)); }
  }, []);
  // Optimistic local edit: the screen changes at once; the server confirms in the background.
  const patchLocal = useCallback((path, field, value) => setData((d) => ({ ...d, apps: d.apps.map((a) => {
    const lists = ['flows', 'findings', 'decisions'];
    if (!lists.some((k) => (a[k] || []).some((x) => x.path === path))) return a;
    const next = { ...a };
    for (const k of lists) next[k] = (a[k] || []).map((x) => {
      if (x.path !== path) return x;
      if (k === 'flows' && field === 'status' && a.counts) next.counts = { ...a.counts, [x.status]: Math.max(0, (a.counts[x.status] || 0) - 1), [value]: ((next.counts || a.counts)[value] || 0) + 1 };
      return { ...x, [field]: value };
    });
    return next;
  }) })), []);
  const dropLocal = useCallback((path) => setData((d) => ({ ...d, apps: d.apps.map((a) => ({ ...a, flows: (a.flows || []).filter((x) => x.path !== path), findings: (a.findings || []).filter((x) => x.path !== path), decisions: (a.decisions || []).filter((x) => x.path !== path) })) })), []);
  useEffect(() => { reload(); }, [reload]);
  return <Ctx.Provider value={{ data, state, error, reload, version, patchLocal, dropLocal }}>{children}</Ctx.Provider>;
}
export const useData = () => useContext(Ctx);

export function useRoute() {
  const [r, setR] = useState(() => parseHash(location.hash));
  useEffect(() => { const f = () => setR(parseHash(location.hash)); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  return r;
}

// Every change is optimistic from the user's view and comes with an Undo.
export function useActions() {
  const { reload, patchLocal, dropLocal } = useData();
  return useMemo(() => ({
    async change(path, field, value, prev, label = 'Gespeichert') {
      patchLocal(path, field, value);
      try {
        await api.patch(path, field, value); reload();
        const id = toast(label, { timeout: 6000, actionProps: { children: 'Rückgängig', variant: 'tertiary', onPress: async () => {
          patchLocal(path, field, prev);
          try { await api.patch(path, field, prev); reload(); toast.close(id); } catch (e) { patchLocal(path, field, value); toast.danger(e.message); }
        } } });
      } catch (e) { patchLocal(path, field, prev); toast.danger(e.message); }
    },
    async create(kind, payload) {
      try { const r = await api.create(kind, payload); await reload(); toast.success('Angelegt'); return r; } catch (e) { toast.danger(e.message); return null; }
    },
    async archive(path) {
      dropLocal(path);
      try {
        const r = await api.archive(path); reload();
        const id = toast('Archiviert', { timeout: 8000, actionProps: { children: 'Rückgängig', variant: 'tertiary', onPress: async () => {
          try { await api.restore(r.restore); await reload(); toast.close(id); } catch (e) { toast.danger(e.message); }
        } } });
        return true;
      } catch (e) { reload(); toast.danger(e.message); return false; }
    },
    async saveBody(path, text) {
      try { await api.putBody(path, text); await reload(); toast.success('Text gespeichert'); return true; } catch (e) { toast.danger(e.message); return false; }
    },
  }), [reload, patchLocal, dropLocal]);
}

// Keys that appeared since the last render (not on first load). Used to animate new list items in place.
export function useFresh(keys) {
  const seen = useRef(null); const [fresh, setFresh] = useState(() => new Set()); const sig = keys.join('|');
  useEffect(() => {
    const cur = new Set(keys); let t;
    if (seen.current) { const add = keys.filter((k) => !seen.current.has(k)); if (add.length) { setFresh(new Set(add)); t = setTimeout(() => setFresh(new Set()), 2400); } }
    seen.current = cur; return () => clearTimeout(t);
  }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  return fresh;
}
