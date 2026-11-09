import { Button, Modal, Popover } from '@heroui/react';
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
      {AREAS.map((a) => (
        <a key={a.key} className="rail-btn" href={areaHref(a.key, app)} title={a.label} aria-current={current === a.key ? 'page' : undefined}>
          <span className="rail-ic"><Icon name={a.icon} size={26} active={current === a.key} />{count[a.key] > 0 && <span className="cnt-badge cnt" role="img" aria-label={a.key === 'findings' ? `${count[a.key]} offene Blocker (alle Apps)` : `${count[a.key]} offene Entscheidungen (alle Apps)`} title={a.key === 'findings' ? `${count[a.key]} offene Blocker (alle Apps)` : `${count[a.key]} offene Entscheidungen (alle Apps)`}>{count[a.key] > 9 ? '9+' : count[a.key]}</span>}</span>
          <span className="rail-lbl">{a.label}</span>
        </a>
      ))}
      <span className="sp" />
    </nav>
  );
}

// Top bar above the whole app: its own tone, holds product, search, messages and the account area.
export function TopBar({ apps, app, onSearch, onTheme, onReload }) {
  const blockers = apps.reduce((n, a) => n + blockersOf(a).length, 0);
  return (
    <header className="topbar">
      <a className="tb-brand" href="#/apps" aria-label="Command Center, zur Übersicht"><span className="tb-logo"><Icon name="route" size={22} /></span><b>Command Center</b></a>
      <button type="button" className="tb-search" onClick={onSearch} aria-label="Suchen und springen"><Icon name="search" size={18} /><span>Apps, Flows, Befunde suchen</span><span className="kbd">Strg K</span></button>
      <div className="tb-right">
        <a className="tb-btn" href={areaHref('findings', app)} aria-label={blockers ? `${blockers} offene Blocker` : 'Keine offenen Blocker'} title="Blocker"><Icon name="bell" size={22} />{blockers > 0 && <span className="cnt-badge tb-cnt">{blockers > 9 ? '9+' : blockers}</span>}</a>
        <Popover>
          <Popover.Trigger><button type="button" className="tb-avatar" aria-label="Konto"><span>Ich</span></button></Popover.Trigger>
          <Popover.Content placement="bottom end">
            <Popover.Dialog className="glass w-64 p-3">
              <div className="grid gap-3">
                <div><b>Angemeldet</b><div className="quiet text-sm">über den Zugang des Teams</div></div>
                <Button variant="secondary" onPress={onTheme}><Icon name="contrast" size={20} />Hell oder dunkel</Button>
                <Button variant="secondary" onPress={onReload}><Icon name="refresh" size={20} />Neu laden</Button>
              </div>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </div>
    </header>
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
            <span className="nm"><span>{a.name}</span>{bl > 0 && <span className="cnt-badge" title={`${bl} offene Blocker`}>{bl > 9 ? '9+' : bl}</span>}</span>
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

// Detail as a dialog over the list: close button, Esc and a click outside all lead back.
export function Sheet({ title, sub, actions, onClose, children }) {
  return (
    <Modal.Backdrop isOpen onOpenChange={(o) => { if (!o) onClose(); }} variant="blur">
      <Modal.Container size="lg" placement="center">
        <Modal.Dialog className="note-dialog" aria-label={typeof title === 'string' ? title : 'Details'}>
          <header className="window-head">
            <div className="min-w-0"><h1>{title}</h1>{sub && <div className="sub-t">{sub}</div>}</div>
            <div className="tools">{actions}<Button variant="secondary" size="sm" onPress={onClose}>Schließen <span className="kbd">Esc</span></Button></div>
          </header>
          <div className="window-body">{children}</div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export const OpenApp = ({ app }) => {
  const url = safeUrl(app?.url);
  return url ? <Button variant="secondary" size="sm" onPress={() => window.open(url, '_blank', 'noopener,noreferrer')}>App öffnen<Icon name="link-out" size={18} /></Button> : null;
};
