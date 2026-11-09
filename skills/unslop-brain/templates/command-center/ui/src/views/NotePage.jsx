import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Label, TextField } from '@heroui/react';
import { api } from '../lib/api.js';
import { useActions, useData } from '../lib/hooks.jsx';
import { sollChain, splitSections, takeMermaid, parseFlow } from '../lib/flow.js';
import { DSTATES, FSTATES, SEVERITIES, STATUS_LABEL } from '../lib/constants.js';
import { appHref, splitList } from '../lib/model.js';
import { Icon, Markdown, PrioSwitch, Segmented, StatusPicker } from '../components/ui.jsx';
import FlowCanvas from '../components/FlowCanvas.jsx';
import { Lane } from '../components/RouteMap.jsx';

const MANAGED = ['flow', 'finding', 'decision'];

function ManagePanel({ path, note, appName }) {
  const { change, archive, saveBody } = useActions();
  const m = note.meta; const t = m.type;
  const defs = t === 'flow' ? [['reason', 'Begründung (bei „Nicht nötig“)'], ['screens', 'Screens (Komma trennt)', true], ['endpoints', 'Endpoints (Komma trennt)', true], ['evidence', 'Nachweis (für „Gebaut“)']]
    : t === 'decision' ? [['question', 'Frage'], ['answer', 'Antwort']] : [['where', 'Wo']];
  const initial = Object.fromEntries(defs.map(([k, , list]) => [k, list ? (m[k] || []).join(', ') : m[k] || '']));
  const [vals, setVals] = useState(initial); const [editing, setEditing] = useState(false); const [text, setText] = useState(note.body.replace(/^\n+/, ''));
  useEffect(() => { setVals(initial); setText(note.body.replace(/^\n+/, '')); }, [path, note]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => { for (const [k, , list] of defs) if (vals[k] !== initial[k]) await change(path, k, list ? splitList(vals[k]) : vals[k], list ? splitList(initial[k]) : initial[k]); };
  return (
    <details className="glass my-6 p-4" style={{ borderRadius: 'var(--radius-m)' }}>
      <summary className="cursor-pointer text-sm font-semibold">Bearbeiten</summary>
      <div className="mt-4 grid gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {t === 'finding' && <><Segmented label="Status" options={FSTATES} value={m.state} onChange={(v) => change(path, 'state', v, m.state)} /><Segmented label="Schwere" options={SEVERITIES.map((s) => [s, s])} value={m.severity} onChange={(v) => change(path, 'severity', v, m.severity)} /></>}
          {t === 'decision' && <Segmented label="Status" options={DSTATES} value={m.state} onChange={(v) => change(path, 'state', v, m.state)} />}
        </div>
        <div className="fgrid">
          {defs.map(([k, label]) => <TextField key={k} value={vals[k]} onChange={(v) => setVals((s) => ({ ...s, [k]: v }))}><Label>{label}</Label><Input variant="secondary" /></TextField>)}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="sm" onPress={save}>Speichern</Button>
          <Button variant="secondary" size="sm" onPress={() => setEditing((e) => !e)}><Icon name="edit" size={18} />{editing ? 'Text schließen' : 'Text bearbeiten'}</Button>
          <Button variant="danger-soft" size="sm" onPress={async () => { if (confirm('Notiz archivieren? Sie liegt danach im Ordner _Archiv der App.') && await archive(path)) location.hash = appName ? appHref(appName) : '#/'; }}><Icon name="archive" size={18} />Archivieren</Button>
        </div>
        {editing && <div className="grid gap-3"><textarea className="editor" rows={18} value={text} onChange={(e) => setText(e.target.value)} aria-label="Notiztext (Markdown)" spellCheck={false} />
          <div><Button variant="primary" size="sm" onPress={async () => { if (await saveBody(path, text)) setEditing(false); }}>Text speichern</Button></div></div>}
      </div>
    </details>
  );
}

function FlowPage({ path, note, appName }) {
  const { data } = useData(); const { change } = useActions();
  const app = data.apps.find((a) => a.name === appName); const m = note.meta;
  const { pre, secs } = useMemo(() => splitSections(note.body), [note.body]);
  const { code, rest } = useMemo(() => takeMermaid(pre), [pre]);
  const graph = useMemo(() => { const g = code ? parseFlow(code) : { nodes: [], edges: [] }; return g.nodes.length ? { g, derived: false } : { g: sollChain(m.title || '', secs) || { nodes: [], edges: [] }, derived: true }; }, [code, secs, m.title]);
  const want = (t) => /^(soll|l[uü]cken)/i.test(t);
  const pair = secs.filter((s) => want(s.title)); const others = secs.filter((s) => !want(s.title));
  const [editBody, setEditBody] = useState(false);
  return (
    <div>
      <header className="fp-head">
        <StatusPicker size="lg" status={m.status} onChange={(v) => change(path, 'status', v, m.status, `Status: ${STATUS_LABEL[v]}`)} />
        <div className="grid gap-2">
          <h1>{m.title || path.split('/').pop().replace(/\.md$/, '')}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm"><span className="font-semibold">{STATUS_LABEL[m.status] || m.status}</span>{m.area && <span className="quiet">· {m.area}</span>}<PrioSwitch value={m.prio} onChange={(v) => change(path, 'prio', v, m.prio)} />{m.reason && <span className="quiet">· {m.reason}</span>}</div>
        </div>
      </header>
      <FlowCanvas graph={graph.g} onEdit={() => setEditBody(true)} />
      {graph.derived && graph.g.nodes.length > 0 && <p className="quiet -mt-3 mb-5">Aus „Soll“ abgeleitet, kein gezeichneter Ablauf.</p>}
      <div className="facts">
        {m.screens?.length > 0 && <div className="fact"><span className="quiet">Screens</span><span className="tags">{m.screens.map((x) => <code className="tag" key={x}>{x}</code>)}</span></div>}
        {m.endpoints?.length > 0 && <div className="fact"><span className="quiet">Endpoints</span><span className="tags">{m.endpoints.map((x) => <code className="tag" key={x}>{x}</code>)}</span></div>}
        {m.evidence && <div className="fact"><span className="quiet">Nachweis</span><span>{m.evidence}</span></div>}
      </div>
      {app && m.area && <div className="mt-4 border-y py-4" style={{ borderColor: 'var(--line)' }}><Lane app={app} area={m.area} current={path} /></div>}
      {rest.trim() && <Markdown text={rest} />}
      {pair.length > 0 && <div className="cols2">{pair.map((s) => <section key={s.title}><h2 className="mb-2 text-xl">{s.title}</h2><Markdown text={s.md} /></section>)}</div>}
      {others.map((s) => <section key={s.title} className="mt-6"><h2 className="mb-2 text-xl">{s.title}</h2><Markdown text={s.md} /></section>)}
      <ManagePanel path={path} note={note} appName={appName} key={`${path}${editBody}`} />
    </div>
  );
}

export default function NotePage({ path, appName }) {
  const { version } = useData();
  const [note, setNote] = useState(null); const [err, setErr] = useState(null);
  useEffect(() => { let off = false; setErr(null); api.note(path).then((n) => { if (!off) setNote(n); }).catch((e) => { if (!off) setErr(e.message); }); return () => { off = true; }; }, [path, version]);
  if (err) return <p className="quiet">{err}</p>;
  if (!note || note.__path !== undefined) return <p className="quiet">Lädt …</p>;
  if (note.meta.type === 'flow') return <FlowPage path={path} note={note} appName={appName} />;
  return (
    <div className="max-w-3xl">
      {MANAGED.includes(note.meta.type) && <ManagePanel path={path} note={note} appName={appName} />}
      <Markdown text={note.body} />
    </div>
  );
}
