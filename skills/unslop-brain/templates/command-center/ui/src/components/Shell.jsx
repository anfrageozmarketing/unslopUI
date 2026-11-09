import { Button } from '@heroui/react';
import { AREAS, areaHref, appHref, blockersOf, openDecisionsOf, pct, safeUrl, totalsOf } from '../lib/model.js';
import { Icon, Strip } from './ui.jsx';
import { useShell } from '../lib/shell.jsx';

// Rail (areas), context column (apps as folders, info at the bottom), window (the working surface).
export function Rail({ route, apps, app, onSearch, onTheme, onReload }) {
  const blockers = apps.reduce((n, a) => n + blockersOf(a).length, 0);
  const decisions = apps.reduce((n, a) => n + openDecisionsOf(a).length, 0);
  const count = { findings: blockers, decisions };
  const current = route.name === 'note' || route.name === 'workspace' ? (route.kind || 'flows') : route.name;
  return (
    <nav className="rail" aria-label="Bereiche">
      <a className="logo" href="#/apps" aria-label="Command Center"><Icon name="route" size={24} /></a>
      {AREAS.map((a) => (
        <a key={a.key} className="rail-btn" href={areaHref(a.key, app)} title={a.label} aria-current={current === a.key ? 'page' : undefined}>
          <span className="rail-ic"><Icon name={a.icon} size={26} active={current === a.key} />{count[a.key] > 0 && <span className="badge cnt" role="img" aria-label={a.key === 'findings' ? `${count[a.key]} offene Blocker (alle Apps)` : `${count[a.key]} offene Entscheidungen (alle Apps)`} title={a.key === 'findings' ? `${count[a.key]} offene Blocker (alle Apps)` : `${count[a.key]} offene Entscheidungen (alle Apps)`}>{count[a.key]}</span>}</span>
          <span className="rail-lbl">{a.label}</span>
        </a>
      ))}
      <span className="sp" />
      <button type="button" className="rail-btn util" title="Suchen (Strg K)" onClick={onSearch}><span className="rail-ic"><Icon name="search" size={24} /></span><span className="rail-lbl">Suchen</span></button>
      <button type="button" className="rail-btn util" title="Hell oder dunkel" onClick={onTheme}><span className="rail-ic"><Icon name="contrast" size={24} /></span><span className="rail-lbl">Design</span></button>
      <button type="button" className="rail-btn util" title="Aktualisieren" onClick={onReload}><span className="rail-ic"><Icon name="refresh" size={24} /></span><span className="rail-lbl">Laden</span></button>
    </nav>
  );
}

export function Context({ area, apps, app }) {
  const t = totalsOf(apps);
  const label = AREAS.find((a) => a.key === area)?.label || 'Apps';
  return (
    <aside className="ctx" aria-label={`${label}: Apps`}>
      <h2>{label}</h2>
      {apps.map((a) => {
        const bl = blockersOf(a).length;
        return (
          <a key={a.name} className="folder" href={area === 'apps' ? appHref(a.name) : areaHref(area, a.name)} aria-current={app === a.name && area !== 'apps' ? 'page' : undefined}>
            <span className="nm"><span>{a.name}</span>{bl > 0 && <span className="badge" title={`${bl} offene Blocker`}>{bl}</span>}</span>
            <Strip app={a} size="sm" />
          </a>
        );
      })}
      <div className="info">
        <div className="row"><span className="muted">Abdeckung</span><b className="num">{pct(t.coverage)}</b></div>
        <div className="meter" role="progressbar" aria-label="Abdeckung" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((t.coverage || 0) * 100)}><span className="meter-fill" style={{ width: `${Math.min(100, Math.max(0, Math.round((t.coverage || 0) * 100)))}%` }} /></div>
        <div className="row"><span className="muted">Flows</span><b className="num">{t.flows}</b></div>
        <div className="row"><span className="muted">Blocker</span><b className="num">{t.blockers}</b></div>
      </div>
    </aside>
  );
}

export function Window({ title, sub, actions, children }) {
  const { ctxOpen, toggle } = useShell();
  return (
    <main className="window">
      <button type="button" className="edge-toggle" aria-label={ctxOpen ? 'Seitenleiste einklappen' : 'Seitenleiste ausklappen'} aria-expanded={ctxOpen} title={ctxOpen ? 'Seitenleiste einklappen' : 'Seitenleiste ausklappen'} onClick={toggle}><Icon name={ctxOpen ? 'caret-l' : 'caret-r'} size={16} /></button>
      <header className="window-head">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0"><h1 className="truncate">{title}</h1>{sub && <div className="sub-t">{sub}</div>}</div>
        </div>
        <div className="tools">{actions}</div>
      </header>
      <div className="window-body">{children}</div>
    </main>
  );
}

export const OpenApp = ({ app }) => {
  const url = safeUrl(app?.url);
  return url ? <Button variant="secondary" size="sm" onPress={() => window.open(url, '_blank', 'noopener,noreferrer')}>App öffnen<Icon name="link-out" size={18} /></Button> : null;
};
