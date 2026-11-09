import { useEffect, useMemo, useState } from 'react';
import { Toast } from '@heroui/react';
import { DataProvider, useData, useRoute } from './lib/hooks.jsx';
import { ShellProvider, useShell } from './lib/shell.jsx';
import Workspace from './views/Workspace.jsx';
import { Context, Rail, TopBar, Window } from './components/Shell.jsx';
import Palette from './components/Palette.jsx';
import { AppsView, DecisionsView, FindingsView, FlowsView, FocusView } from './views/Areas.jsx';
import NotePage from './views/NotePage.jsx';
import Gallery from './views/Gallery.jsx';
import { BootScreen, ListSkeleton } from './components/Loading.jsx';

function Shell() {
  const route = useRoute();
  const { data, reload, state } = useData();
  const { ctxOpen } = useShell();
  const [palette, setPalette] = useState(false);
  const [theme, setTheme] = useState(() => { try { const t = localStorage.getItem('cc.theme'); return t === 'dark' || t === 'light' ? t : null; } catch { return null; } });
  const [lastApp, setLastApp] = useState(null);
  const appName = route.app || lastApp || data.apps[0]?.name || null;
  useEffect(() => { if (route.app) setLastApp(route.app); }, [route.app]);
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((o) => !o); }
      else if (e.key === '/' && !typing) { e.preventDefault(); setPalette(true); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { if (theme) { document.documentElement.dataset.theme = theme; try { localStorage.setItem('cc.theme', theme); } catch { /* private mode */ } } }, [theme]);
  const toggleTheme = () => { const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; setTheme(dark ? 'light' : 'dark'); };
  const app = useMemo(() => data.apps.find((a) => a.name === appName), [data, appName]);
  const area = route.name === 'note' || route.name === 'workspace' ? route.kind : route.name === 'gallery' ? 'apps' : route.name;
  const needApp = <Window title="Apps"><ListSkeleton label="Apps werden geladen" /></Window>;
  const view = route.name === 'apps' ? <AppsView />
    : route.name === 'gallery' ? <Gallery />
    : route.name === 'note' && (route.kind === 'findings' || route.kind === 'decisions') && app ? <>{route.kind === 'findings' ? <FindingsView app={app} /> : <DecisionsView app={app} />}<NotePage key={route.path} path={route.path} appName={route.app} dialog /></>
    : route.name === 'note' ? <NotePage path={route.path} appName={route.app} />
    : route.name === 'workspace' ? (app ? <FlowsView app={app} /> : needApp)
    : !app ? needApp
    : route.name === 'flows' ? <FlowsView app={app} />
    : route.name === 'focus' ? <FocusView app={app} />
    : route.name === 'findings' ? <FindingsView app={app} />
    : <DecisionsView app={app} />;
  if (state === 'loading') return <BootScreen />;
  return (
    <>
      <div className="frame">
      <TopBar apps={data.apps} app={appName} onSearch={() => setPalette(true)} onTheme={toggleTheme} onReload={reload} />
      <div className={`app${ctxOpen ? '' : ' no-ctx'}`}>
        <Rail route={{ ...route, kind: route.kind }} apps={data.apps} app={appName} onSearch={() => setPalette(true)} onTheme={toggleTheme} onReload={reload} />
        <div className="deck">
          <Context area={area} apps={data.apps} app={appName} />
          {view}
        </div>
      </div>
      </div>
      {route.name === 'workspace' && <Workspace key={route.path} path={route.path} appName={route.app} />}
      <Palette open={palette} onOpenChange={setPalette} apps={data.apps} />
      <Toast.Provider placement="bottom end" />
    </>
  );
}
export default function App() { return <DataProvider><ShellProvider><Shell /></ShellProvider></DataProvider>; }
