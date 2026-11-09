import { useMemo, useState } from 'react';
import { Button, Dropdown, Label, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { useActions, useData, useFresh } from '../lib/hooks.jsx';
import { AREA_ORDER, SEVERITIES, STATUS, SEV_RANK } from '../lib/constants.js';
import { areasOf, blockersOf, nextFlows, noteHref, openDecisionsOf } from '../lib/model.js';
import { EmptyState, Icon, Portrait, QuickAdd, Segmented, StatusMark, Strip } from '../components/ui.jsx';
import RouteMap from '../components/RouteMap.jsx';
import { OpenApp, Window } from '../components/Shell.jsx';

export function AppsView() {
  const { data, state, error } = useData();
  return (
    <Window title="Apps">
      {state === 'error' && <p className="quiet">Daten konnten nicht geladen werden: {error}</p>}
      {state === 'ready' && !data.apps.length && <EmptyState art="firstApp" title="Erste App anlegen"><p className="quiet">_App.md im Vault</p></EmptyState>}
      <div className="cards">
        {data.apps.map((a) => (
          <a key={a.name} className="card" href={`#/flows/${encodeURIComponent(a.name)}`}>
            <Portrait app={a} width={900} height={420} />
            <div className="glass panel"><h2>{a.name}</h2></div>
          </a>
        ))}
      </div>
    </Window>
  );
}

const pickArea = (areas, area, setArea) => (
  <Dropdown>
    <Button variant="ghost" size="sm" aria-label={`Bereich: ${area}`}>{area}</Button>
    <Dropdown.Popover><Dropdown.Menu onAction={(k) => setArea(String(k))}>{areas.map((a) => <Dropdown.Item key={a} id={a} textValue={a}><Label>{a}</Label></Dropdown.Item>)}</Dropdown.Menu></Dropdown.Popover>
  </Dropdown>
);

export function FlowsView({ app }) {
  const { create } = useActions();
  const fresh = useFresh(app.flows.map((x) => x.path));
  const [active, setActive] = useState(new Set());
  const areas = useMemo(() => [...new Set([...AREA_ORDER, ...areasOf(app)])], [app]);
  const [area, setArea] = useState(areas[0]);
  return (
    <Window title={app.name} sub="Flows" actions={<OpenApp app={app} />}>
      <div className="grid gap-6">
        <QuickAdd placeholder="Neuer Flow" onSubmit={async (title) => { const r = await create('flow', { app: app.name, area, title, status: 'missing', prio: 'V1', screens: [], endpoints: [] }); return !!r; }}>{pickArea(areas, area, setArea)}</QuickAdd>
        <div className="scroll-x"><ToggleButtonGroup aria-label="Status filtern" selectionMode="multiple" size="sm" selectedKeys={active} onSelectionChange={(k) => setActive(new Set([...k].map(String)))}>
          {STATUS.filter(([k]) => app.counts[k]).map(([k, l]) => <ToggleButton key={k} id={k}><StatusMark status={k} />{l}<span className="num muted">{app.counts[k]}</span></ToggleButton>)}
        </ToggleButtonGroup></div>
        <RouteMap app={app} active={active} fresh={fresh} />
      </div>
    </Window>
  );
}

export function FocusView({ app }) {
  const bl = blockersOf(app); const dc = openDecisionsOf(app); const next = nextFlows(app);
  const Group = ({ title, children, items }) => (items.length ? <section><h2 className="group-t">{title}</h2><div className="rows">{children}</div></section> : null);
  return (
    <Window title={app.name} sub="Fokus" actions={<OpenApp app={app} />}>
      {!bl.length && !dc.length && !next.length && <EmptyState art="success" title="Alles erledigt" />}
      <Group title="Blocker" items={bl}>{bl.map((b) => <a key={b.path} href={noteHref(b)} className="row f"><span className="sev sev-Blocker">Blocker</span><span className="t">{b.title}</span><span className="meta">{b.where}</span></a>)}</Group>
      <Group title="Entscheidungen" items={dc}>{dc.map((d) => <a key={d.path} href={noteHref(d)} className="row q"><span className="big">{d.question || d.title}</span></a>)}</Group>
      <Group title="Als Nächstes" items={next}>{next.map((f) => <a key={f.path} href={noteHref(f)} className="row"><StatusMark status={f.status} /><span className="t">{f.title}</span><span className="meta">{f.area} · {f.prio}</span></a>)}</Group>
    </Window>
  );
}

const openRow = (e, n) => { if (!e.target.closest('button, a, [role="button"], input')) location.hash = noteHref(n); };

export function FindingsView({ app }) {
  const { create, change, archive } = useActions();
  const [show, setShow] = useState('open'); const [sev, setSev] = useState('Gap');
  const fresh = useFresh(app.findings.map((x) => x.path));
  const list = app.findings.filter((f) => show === 'all' || f.state === 'open').sort((x, y) => (SEV_RANK[x.severity] ?? 9) - (SEV_RANK[y.severity] ?? 9) || x.title.localeCompare(y.title));
  return (
    <Window title={app.name} sub="Befunde" actions={<Segmented label="Befunde zeigen" options={[['open', 'Offen'], ['all', 'Alle']]} value={show} onChange={setShow} />}>
      <div className="grid gap-4">
        <QuickAdd placeholder="Neuer Befund" onSubmit={async (title) => { const r = await create('finding', { app: app.name, title, severity: sev, where: '' }); return !!r; }}>
          <Dropdown><Button variant="ghost" size="sm" aria-label={`Schwere: ${sev}`}>{sev}</Button><Dropdown.Popover><Dropdown.Menu onAction={(k) => setSev(String(k))}>{SEVERITIES.map((s) => <Dropdown.Item key={s} id={s} textValue={s}><Label>{s}</Label></Dropdown.Item>)}</Dropdown.Menu></Dropdown.Popover></Dropdown>
        </QuickAdd>
        {list.length === 0 && <EmptyState art="emptyFindings" title="Keine Befunde" />}
        <div className="rows">
          {list.map((f) => (
            <div key={f.path} className={`row f${fresh.has(f.path) ? ' m-new' : ''}`} data-open onClick={(e) => openRow(e, f)}>
              <span className={`sev sev-${f.severity}`}>{f.severity}</span>
              <span><a className="t" href={noteHref(f)}>{f.title}</a>{f.where && <span className="meta"> · {f.where}</span>}</span>
              <span className="meta">{f.state === 'open' ? '' : f.state === 'fixed' ? 'Behoben' : 'Offen lassen'}</span>
              <span className="acts">
                <Button isIconOnly variant="ghost" aria-label={f.state === 'open' ? 'Als behoben markieren' : 'Wieder öffnen'} onPress={() => change(f.path, 'state', f.state === 'open' ? 'fixed' : 'open', f.state)}><Icon name={f.state === 'open' ? 'check' : 'undo'} size={20} /></Button>
                <Button isIconOnly variant="ghost" aria-label="Archivieren" onPress={() => archive(f.path)}><Icon name="archive" size={20} /></Button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}

export function DecisionsView({ app }) {
  const { create, change, archive } = useActions();
  const [show, setShow] = useState('open');
  const fresh = useFresh(app.decisions.map((x) => x.path));
  const list = app.decisions.filter((d) => show === 'all' || d.state === show).sort((x, y) => x.title.localeCompare(y.title));
  return (
    <Window title={app.name} sub="Fragen" actions={<Segmented label="Entscheidungen zeigen" options={[['open', 'Offen'], ['decided', 'Entschieden'], ['all', 'Alle']]} value={show} onChange={setShow} />}>
      <div className="grid gap-4">
        <QuickAdd placeholder="Neue Entscheidung" onSubmit={async (title) => { const r = await create('decision', { app: app.name, title, question: '' }); return !!r; }} />
        {list.length === 0 && <EmptyState art="emptyDecisions" title="Nichts zu entscheiden" />}
        <div className="rows">
          {list.map((d) => (
            <div key={d.path} className={`row q${fresh.has(d.path) ? ' m-new' : ''}`} data-open onClick={(e) => openRow(e, d)}>
              <span><a className="big" href={noteHref(d)}>{d.question || d.title}</a>{d.state === 'decided' && <span className="block text-sm">→ {d.answer || 'entschieden'}</span>}</span>
              <span className="acts">
                <Button isIconOnly variant="ghost" aria-label={d.state === 'open' ? 'Als entschieden markieren' : 'Wieder öffnen'} onPress={() => change(d.path, 'state', d.state === 'open' ? 'decided' : 'open', d.state)}><Icon name={d.state === 'open' ? 'check' : 'undo'} size={20} /></Button>
                <Button isIconOnly variant="ghost" aria-label="Archivieren" onPress={() => archive(d.path)}><Icon name="archive" size={20} /></Button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}
