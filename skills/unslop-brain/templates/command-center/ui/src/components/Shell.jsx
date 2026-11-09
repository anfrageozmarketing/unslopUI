import { Button } from '@heroui/react';
import { AREAS, areaHref, appHref, blockersOf, openDecisionsOf, pct, safeUrl, totalsOf } from '../lib/model.js';
import { Icon, Strip } from './ui.jsx';

// Rail (areas), context column (apps as folders, info at the bottom), window (the working surface).
export function Rail({ route, apps, app, onSearch, onTheme, onReload }) {
  const blockers = apps.reduce((n, a) => n + blockersOf(a).length, 0);
  const decisions = apps.reduce((n, a) => n + openDecisionsOf(a).length, 0);
  const count = { findings: blockers, decisions };
  const current = route.name === 'note' ? (route.kind || 'flows') : route.name;
  return (
    <nav className="rail" aria-label="Bereiche">
      <a className="logo" href="#/apps" aria-label="Command Center"><Icon name="route" size={24} onFill /></a>
      {AREAS.map((a) => (
        <a key={a.key} className="rail-btn" href={areaHref(a.key, app)} aria-label={a.label} title={a.label} aria-current={current === a.key ? 'page' : undefined}>
          <Icon name={a.icon} size={26} />{count[a.key] > 0 && <span className="badge cnt">{count[a.key]}</span>}
        </a>
      ))}
      <span className="sp" />
      <button type="button" className="rail-btn util" aria-label="Suchen (Strg K)" title="Suchen (Strg K)" onClick={onSearch}><Icon name="search" size={24} /></button>
      <button type="button" className="rail-btn util" aria-label="Hell oder dunkel" title="Hell oder dunkel" onClick={onTheme}><Icon name="contrast" size={24} /></button>
      <button type="button" className="rail-btn util" aria-label="Aktualisieren" title="Aktualisieren" onClick={onReload}><Icon name="refresh" size={24} /></button>
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
        <div className="meter" aria-hidden="true"><i style={{ width: `${Math.round((t.coverage || 0) * 100)}%` }} /></div>
        <div className="row"><span className="muted">Flows</span><b className="num">{t.flows}</b></div>
        <div className="row"><span className="muted">Blocker</span><b className="num">{t.blockers}</b></div>
      </div>
    </aside>
  );
}

export function Window({ title, sub, actions, children }) {
  return (
    <main className="window">
      <header className="window-head">
        <div><h1>{title}</h1>{sub && <div className="sub-t">{sub}</div>}</div>
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
