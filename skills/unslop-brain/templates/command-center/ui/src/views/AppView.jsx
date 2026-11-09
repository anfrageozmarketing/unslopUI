import { useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Label, Tabs, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { useActions, useData } from '../lib/hooks.jsx';
import { AREA_ORDER, SEVERITIES, STATUS, STATUS_LABEL, SEV_RANK } from '../lib/constants.js';
import { areasOf, blockersOf, nextFlows, noteHref, openDecisionsOf, pct, safeUrl, summaryParts } from '../lib/model.js';
import { Icon, Portrait, QuickAdd, Segmented, StatusMark, Strip } from '../components/ui.jsx';
import RouteMap from '../components/RouteMap.jsx';

function FlowsTab({ app }) {
  const { create } = useActions();
  const [active, setActive] = useState(new Set());
  const areas = useMemo(() => [...new Set([...AREA_ORDER, ...areasOf(app)])], [app]);
  const [area, setArea] = useState(areas[0]);
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleButtonGroup aria-label="Status filtern" selectionMode="multiple" size="sm" selectedKeys={active} onSelectionChange={(k) => setActive(new Set([...k].map(String)))}>
          {STATUS.filter(([k]) => app.counts[k]).map(([k, l]) => <ToggleButton key={k} id={k}><StatusMark status={k} />{l}<span className="num muted">{app.counts[k]}</span></ToggleButton>)}
        </ToggleButtonGroup>
      </div>
      <RouteMap app={app} active={active} />
      <QuickAdd placeholder="Neuer Flow: Titel tippen" onSubmit={async (title) => { const r = await create('flow', { app: app.name, area, title, status: 'missing', prio: 'V1', screens: [], endpoints: [] }); if (r?.path) location.hash = noteHref({ path: r.path }); return !!r; }}>
        <Dropdown>
          <Button variant="ghost" size="sm" aria-label={`Bereich: ${area}`}>{area}</Button>
          <Dropdown.Popover><Dropdown.Menu onAction={(k) => setArea(String(k))}>{areas.map((a) => <Dropdown.Item key={a} id={a} textValue={a}><Label>{a}</Label></Dropdown.Item>)}</Dropdown.Menu></Dropdown.Popover>
        </Dropdown>
      </QuickAdd>
    </div>
  );
}

function Stream({ title, children, empty }) {
  const items = [].concat(children || []).filter(Boolean);
  return <section className="mb-8"><h2 className="mb-3 text-2xl">{title}</h2>{items.length ? <div className="items">{items}</div> : <p className="quiet">{empty}</p>}</section>;
}
function AttentionTab({ app }) {
  return (
    <div>
      <Stream title="Blocker" empty="Keine offenen Blocker.">{blockersOf(app).map((b) => <a key={b.path} href={noteHref(b)} className="item f"><span className="sev sev-Blocker">Blocker</span><span className="title">{b.title}</span><span className="meta">{b.where}</span></a>)}</Stream>
      <Stream title="Offene Entscheidungen" empty="Keine offenen Entscheidungen.">{openDecisionsOf(app).map((d) => <a key={d.path} href={noteHref(d)} className="item q"><span><span className="big">{d.question || d.title}</span><br /><span className="meta">{d.title}</span></span></a>)}</Stream>
      <Stream title="Als Nächstes bauen" empty="Alles Wichtige ist umgesetzt.">{nextFlows(app).map((f) => <a key={f.path} href={noteHref(f)} className="item"><StatusMark status={f.status} /><span className="title">{f.title}</span><span className="meta">{f.area} · {f.prio}</span></a>)}</Stream>
    </div>
  );
}

function FindingsTab({ app }) {
  const { create, change, archive } = useActions();
  const [show, setShow] = useState('open');
  const [sev, setSev] = useState('Gap');
  const list = app.findings.filter((f) => show === 'all' || f.state === 'open').sort((x, y) => (SEV_RANK[x.severity] ?? 9) - (SEV_RANK[y.severity] ?? 9) || x.title.localeCompare(y.title));
  return (
    <div className="grid gap-4">
      <Segmented label="Befunde zeigen" options={[['open', 'Offen'], ['all', 'Alle']]} value={show} onChange={setShow} />
      <div className="items">
        {list.length === 0 && <p className="quiet">Keine Befunde in dieser Ansicht.</p>}
        {list.map((f) => (
          <div key={f.path} className="item f">
            <span className={`sev sev-${f.severity}`}>{f.severity}</span>
            <span><a className="title" href={noteHref(f)}>{f.title}</a>{f.where && <span className="meta"> · {f.where}</span>}</span>
            <span className="meta">{f.state === 'open' ? '' : f.state === 'fixed' ? 'Behoben' : 'Wird nicht behoben'}</span>
            <span className="acts">
              <Button isIconOnly variant="ghost" aria-label={f.state === 'open' ? 'Als behoben markieren' : 'Wieder öffnen'} onPress={() => change(f.path, 'state', f.state === 'open' ? 'fixed' : 'open', f.state)}><Icon name={f.state === 'open' ? 'check' : 'undo'} size={20} /></Button>
              <Button isIconOnly variant="ghost" aria-label="Archivieren" onPress={() => archive(f.path)}><Icon name="archive" size={20} /></Button>
            </span>
          </div>
        ))}
      </div>
      <QuickAdd placeholder="Neuer Befund: Was ist das Problem?" onSubmit={async (title) => { const r = await create('finding', { app: app.name, title, severity: sev, where: '' }); if (r?.path) location.hash = noteHref({ path: r.path }); return !!r; }}>
        <Dropdown>
          <Button variant="ghost" size="sm" aria-label={`Schwere: ${sev}`}>{sev}</Button>
          <Dropdown.Popover><Dropdown.Menu onAction={(k) => setSev(String(k))}>{SEVERITIES.map((s) => <Dropdown.Item key={s} id={s} textValue={s}><Label>{s}</Label></Dropdown.Item>)}</Dropdown.Menu></Dropdown.Popover>
        </Dropdown>
      </QuickAdd>
    </div>
  );
}

function DecisionsTab({ app }) {
  const { create, change, archive } = useActions();
  const [show, setShow] = useState('open');
  const list = app.decisions.filter((d) => show === 'all' || d.state === show).sort((x, y) => x.title.localeCompare(y.title));
  return (
    <div className="grid gap-4">
      <Segmented label="Entscheidungen zeigen" options={[['open', 'Offen'], ['decided', 'Entschieden'], ['all', 'Alle']]} value={show} onChange={setShow} />
      <div className="items">
        {list.length === 0 && <p className="quiet">Keine Entscheidungen in dieser Ansicht.</p>}
        {list.map((d) => (
          <div key={d.path} className="item q" style={d.state === 'decided' ? { borderLeftColor: 'var(--line)' } : undefined}>
            <span><a className="big" href={noteHref(d)}>{d.question || d.title}</a>{d.state === 'decided' && <span className="block text-sm">→ {d.answer || 'entschieden'}</span>}<span className="meta block">{d.title}</span></span>
            <span className="acts">
              <Button isIconOnly variant="ghost" aria-label={d.state === 'open' ? 'Als entschieden markieren' : 'Wieder öffnen'} onPress={() => change(d.path, 'state', d.state === 'open' ? 'decided' : 'open', d.state)}><Icon name={d.state === 'open' ? 'check' : 'undo'} size={20} /></Button>
              <Button isIconOnly variant="ghost" aria-label="Archivieren" onPress={() => archive(d.path)}><Icon name="archive" size={20} /></Button>
            </span>
          </div>
        ))}
      </div>
      <QuickAdd placeholder="Neue Entscheidung: Titel tippen" onSubmit={async (title) => { const r = await create('decision', { app: app.name, title, question: '' }); if (r?.path) location.hash = noteHref({ path: r.path }); return !!r; }} />
    </div>
  );
}

export default function AppView({ name }) {
  const { data, state } = useData();
  const app = data.apps.find((a) => a.name === name);
  const [tab, setTab] = useState('flows');
  useEffect(() => setTab('flows'), [name]);
  if (!app) return <p className="quiet">{state === 'loading' ? 'Lädt …' : 'App nicht gefunden.'}</p>;
  const url = safeUrl(app.url);
  const tabLabel = (icon, text, n) => <span className="inline-flex items-center gap-2"><Icon name={icon} size={20} />{text}{n != null && <span className="num muted">{n}</span>}</span>;
  return (
    <div className="grid gap-6">
      <section className="hero">
        <Portrait app={app} width={1180} height={300} />
        <div className="glass panel"><h1>{app.name}</h1>{app.stack && <span className="quiet" style={{ color: 'var(--ink-muted)' }}>{app.stack}</span>}<span>{summaryParts(app).join(' · ')}</span></div>
        <div className="glass panel"><Strip app={app} size="lg" />
          <div className="flex items-center gap-3">{app.score != null && <span className="num">Score {app.score}/36</span>}{url && <Button variant="secondary" size="sm" onPress={() => window.open(url, '_blank', 'noopener,noreferrer')}>App öffnen<Icon name="link-out" size={18} /></Button>}</div>
        </div>
      </section>
      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Bereiche">
            <Tabs.Tab id="flows">{tabLabel('flows', 'Flows', app.total)}<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="attention">{tabLabel('attention', 'Aufmerksamkeit')}<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="findings">{tabLabel('findings', 'Befunde', app.findings.length)}<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="decisions">{tabLabel('decisions', 'Entscheidungen', app.decisions.length)}<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="flows" className="pt-6"><FlowsTab app={app} /></Tabs.Panel>
        <Tabs.Panel id="attention" className="pt-6"><AttentionTab app={app} /></Tabs.Panel>
        <Tabs.Panel id="findings" className="pt-6"><FindingsTab app={app} /></Tabs.Panel>
        <Tabs.Panel id="decisions" className="pt-6"><DecisionsTab app={app} /></Tabs.Panel>
      </Tabs>
    </div>
  );
}
