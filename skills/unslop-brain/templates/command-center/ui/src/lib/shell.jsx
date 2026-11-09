import { createContext, useCallback, useContext, useState } from 'react';

// Shell state that should survive reloads: is the context column open?
const KEY = 'cc.ctxOpen';
const Ctx = createContext({ ctxOpen: true, toggle: () => {} });
export function ShellProvider({ children }) {
  const [ctxOpen, setOpen] = useState(() => { try { return localStorage.getItem(KEY) !== '0'; } catch { return true; } });
  const toggle = useCallback(() => setOpen((o) => { const n = !o; try { localStorage.setItem(KEY, n ? '1' : '0'); } catch { /* private mode */ } return n; }), []);
  return <Ctx.Provider value={{ ctxOpen, toggle }}>{children}</Ctx.Provider>;
}
export const useShell = () => useContext(Ctx);
