import { useEffect, useState } from 'react';
import { Button, Kbd, Toast } from '@heroui/react';
import { DataProvider, useData, useRoute } from './lib/hooks.jsx';
import { appHref, blockersOf, safeUrl } from './lib/model.js';
import { Icon, Strip } from './components/ui.jsx';
import Palette from './components/Palette.jsx';
import Home from './views/Home.jsx';
import AppView from './views/AppView.jsx';
import NotePage from './views/NotePage.jsx';

function Sidebar({ route, onSearch }) {
  const { data } = useData();
  return (
    <aside className="side">
      <a className="brand" href="#/"><span className="logo"><Icon name="route" size={20} onFill /></span>Command Center</a>
      <Button variant="secondary" fullWidth onPress={onSearch}><Icon name="search" size={20} />Suchen<span className="ml-auto"><Kbd><Kbd.Abbr keyValue="command" /><Kbd.Content>K</Kbd.Content></Kbd></span></Button>
      <nav aria-label="Apps" className="grid gap-1">
        <a className="nav-item" href="#/" aria-current={route.name === 'home' ? 'page' : undefined}><span className="nm"><span className="inline-flex items-center gap-2"><Icon name="grid" size={20} />Alle Apps</span></span></a>
        {data.apps.map((a) => {
          const bl = blockersOf(a).length; const url = safeUrl(a.url);
          return (
            <div key={a.name}>
              <a className="nav-item" href={appHref(a.name)} aria-current={route.app === a.name ? 'page' : undefined}><span className="nm"><span>{a.name}</span>{bl > 0 && <span className="badge" title={`${bl} offene Blocker`}>{bl}</span>}</span><Strip app={a} size="sm" /></a>
              {url && <a className="side-open" href={url} target="_blank" rel="noopener noreferrer">App öffnen<Icon name="link-out" size={14} /></a>}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function Shell() {
  const route = useRoute();
  const { data, reload } = useData();
  const [palette, setPalette] = useState(false);
  const [theme, setTheme] = useState(null);
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((o) => !o); }
      else if (e.key === '/' && !typing) { e.preventDefault(); setPalette(true); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { if (theme) document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { window.scrollTo(0, 0); }, [route.name, route.path, route.app]);
  const toggleTheme = () => { const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; setTheme(dark ? 'light' : 'dark'); };
  const crumbs = route.name === 'home' ? [] : [{ label: 'Apps', href: '#/' }, ...(route.app ? [{ label: route.app, href: route.name === 'note' ? appHref(route.app) : null }] : []), ...(route.name === 'note' ? [{ label: route.path.split('/').pop().replace(/\.md$/, '') }] : [])];
  return (
    <div className="shell">
      <Sidebar route={route} onSearch={() => setPalette(true)} />
      <main className="main">
        <div className="topbar">
          <nav className="crumbs" aria-label="Pfad">{crumbs.map((c, i) => <span key={i}>{i > 0 && '/ '}{c.href ? <a href={c.href}>{c.label}</a> : c.label}</span>)}</nav>
          <div className="tools">
            <Button isIconOnly variant="ghost" aria-label="Aktualisieren" onPress={reload}><Icon name="refresh" size={22} /></Button>
            <Button variant="ghost" size="sm" onPress={toggleTheme}>Hell / Dunkel</Button>
          </div>
        </div>
        {route.name === 'home' && <Home />}
        {route.name === 'app' && <AppView name={route.app} />}
        {route.name === 'note' && <NotePage path={route.path} appName={route.app} />}
      </main>
      <Palette open={palette} onOpenChange={setPalette} apps={data.apps} />
      <Toast.Provider placement="bottom end" />
    </div>
  );
}
export default function App() { return <DataProvider><Shell /></DataProvider>; }
