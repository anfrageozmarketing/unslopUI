import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ToggleButton, ToggleButtonGroup, toast } from '@heroui/react';
import { api } from '../lib/api.js';
import { useActions, useData } from '../lib/hooks.jsx';
import { parseFlow, sollChain, splitSections, takeMermaid } from '../lib/flow.js';
import { replaceMermaid, serialize } from '../lib/flowEdit.js';
import { STATUS_LABEL } from '../lib/constants.js';
import { byPrio } from '../lib/model.js';
import { Icon, Markdown, StatusPicker } from '../components/ui.jsx';
import FlowEditor from '../components/FlowEditor.jsx';
import { StageSkeleton } from '../components/Loading.jsx';
import { Properties } from './NotePage.jsx';

const graphOf = (note) => {
  const { pre, secs } = splitSections(note.body); const { code } = takeMermaid(pre);
  const g = code ? parseFlow(code) : { nodes: [], edges: [] };
  return g.nodes.length ? g : (sollChain(note.meta.title || '', secs) || { nodes: [], edges: [] });
};

// Full-screen workspace for one flow: a large window over the dimmed app. Autosave, undo, neighbours, labelled controls.
export default function Workspace({ path, appName }) {
  const { data, reload, version } = useData(); const { change } = useActions();
  const [note, setNote] = useState(null); const [err, setErr] = useState(null);
  const [graph, setGraph] = useState(null); const [text, setText] = useState('');
  const [mode, setMode] = useState('flow'); const [panel, setPanel] = useState(() => window.innerWidth >= 1100);
  const [saved, setSaved] = useState('saved'); const [fit, setFit] = useState(0);
  useEffect(() => { let t; const on = () => { clearTimeout(t); t = setTimeout(() => setFit((x) => x + 1), 120); }; window.addEventListener('resize', on); return () => { clearTimeout(t); window.removeEventListener('resize', on); }; }, []);
  const history = useRef([]); const timer = useRef(null); const body = useRef('');
  const app = data.apps.find((a) => a.name === appName);
  const close = useCallback(() => { reload(); location.hash = `#/note/${encodeURIComponent(path)}`; }, [path, reload]);

  useEffect(() => { // load once per path; later edits stay local
    let off = false; setNote(null); setErr(null); history.current = [];
    api.note(path).then((n) => { if (off) return; setNote(n); body.current = n.body; setText(n.body); setGraph(graphOf(n)); setSaved('saved'); setFit((x) => x + 1); }).catch((e) => !off && setErr(e.message));
    return () => { off = true; clearTimeout(timer.current); };
  }, [path]);
  useEffect(() => { // frontmatter changes (status, priority, ...) refresh the meta, never the text being edited
    if (!note) return; let off = false;
    api.note(path).then((n) => { if (!off) setNote((cur) => (cur ? { ...n, body: cur.body } : n)); }).catch(() => {});
    return () => { off = true; };
  }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((nextBody) => {
    body.current = nextBody; setSaved('saving'); clearTimeout(timer.current);
    timer.current = setTimeout(async () => { try { await api.putBody(path, nextBody); setSaved('saved'); } catch (e) { setSaved('error'); toast.danger(e.message); } }, 500);
  }, [path]);
  const apply = (next) => { history.current.push(graph); setGraph(next); const b = replaceMermaid(body.current, serialize(next)); setText(b); persist(b); };
  const undo = useCallback(() => { const prev = history.current.pop(); if (!prev) return; setGraph(prev); const b = replaceMermaid(body.current, serialize(prev)); setText(b); persist(b); }, [persist]);
  const onText = (v) => { setText(v); persist(v); };
  const switchMode = (m) => { if (m === 'flow' && mode === 'text') { const g = graphOf({ body: body.current, meta: note.meta }); history.current = []; setGraph(g); setFit((x) => x + 1); } setMode(m); };

  const siblings = useMemo(() => (app && note ? app.flows.filter((f) => f.area === note.meta.area).sort(byPrio) : []), [app, note]);
  const idx = siblings.findIndex((f) => f.path === path);
  const go = (d) => { const t = siblings[idx + d]; if (t) { reload(); location.hash = `#/workspace/${encodeURIComponent(t.path)}`; } };
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA)$/.test(e.target?.tagName);
      if (e.key === 'Escape' && !typing) { e.preventDefault(); close(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && mode === 'flow') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [close, undo, mode]);

  if (err) return <div className="ws"><div className="p-8"><p className="quiet">{err}</p><Button onPress={close}>Zurück</Button></div></div>;
  const m = note?.meta; const title = m?.title || path.split('/').pop().replace(/\.md$/, '');
  const savedLabel = saved === 'saving' ? 'Speichert …' : saved === 'error' ? 'Nicht gespeichert' : 'Gespeichert';
  return (
    <>
      <div className="ws-back" onClick={close} aria-hidden="true" />
      <div className="ws" role="dialog" aria-modal="true" aria-label={`Workspace: ${title}`}>
        <header className="ws-top">
          <div className="ws-ctx"><span className="ws-app" aria-hidden="true">{(appName || '?')[0]}</span><h1>{title}</h1><span className="quiet whitespace-nowrap">in {appName}</span></div>
          <ToggleButtonGroup aria-label="Modus" selectionMode="single" disallowEmptySelection selectedKeys={new Set([mode])} onSelectionChange={(k) => { const v = [...k][0]; if (v) switchMode(String(v)); }}>
            <ToggleButton id="flow">Ablauf</ToggleButton><ToggleButton id="text">Text</ToggleButton>
          </ToggleButtonGroup>
          <div className="ws-right">
            {m && <><StatusPicker status={m.status} onChange={(v) => change(path, 'status', v, m.status, `Status: ${STATUS_LABEL[v]}`)} /><span className="text-sm font-semibold">{STATUS_LABEL[m.status]}</span></>}
            <span className="quiet text-sm" role="status">{savedLabel}</span>
            <Button variant="ghost" size="sm" isDisabled={mode !== 'flow'} onPress={undo}><Icon name="undo" size={18} />Rückgängig</Button>
            <Button variant="ghost" size="sm" onPress={async () => { try { await navigator.clipboard.writeText(location.href); toast.success('Link kopiert'); } catch { toast.danger('Link konnte nicht kopiert werden'); } }}><Icon name="link" size={18} />Link</Button>
            <Button variant="secondary" size="sm" onPress={close}><Icon name="close" size={18} />Schließen<span className="kbd">Esc</span></Button>
          </div>
        </header>
        <div className={`ws-stage${panel && note ? ' has-panel' : ''}`}>
          {!graph ? <StageSkeleton /> : mode === 'flow'
            ? <FlowEditor graph={graph} onChange={apply} fitSignal={fit} />
            : <div className="ws-text"><textarea className="editor" value={text} onChange={(e) => onText(e.target.value)} aria-label="Notiztext (Markdown)" spellCheck={false} /><div className="pv"><Markdown text={text} /></div></div>}
          <button type="button" className="ws-nav l" aria-label="Vorheriger Flow" title="Vorheriger Flow" disabled={idx <= 0} onClick={() => go(-1)}><Icon name="back" size={22} /></button>
          <button type="button" className="ws-nav r" aria-label="Nächster Flow" title="Nächster Flow" disabled={idx < 0 || idx >= siblings.length - 1} onClick={() => go(1)}><Icon name="next" size={22} /></button>
          {panel && note && (
            <aside className="ws-panel" aria-label="Eigenschaften">
              <Properties path={path} note={note} />
              {mode === 'flow' && (() => { const { secs } = splitSections(text); return secs.filter((s) => /^(soll|l[uü]cken)/i.test(s.title)).map((s) => <section key={s.title}><h2>{s.title}</h2><Markdown text={s.md} /></section>); })()}
            </aside>
          )}
        </div>
        <footer className="ws-bottom">
          <span className="quiet text-sm">{idx >= 0 ? `${idx + 1} von ${siblings.length} in ${m?.area}` : ''}</span>
          <div className="mid">{mode === 'flow' && <Button variant="secondary" onPress={() => setFit((x) => x + 1)}><Icon name="fit" size={20} />Einpassen</Button>}<span className="quiet text-sm self-center">{mode === 'flow' ? 'Schritt anklicken, Kante berühren, vom Ausgang ziehen' : 'Markdown links, Vorschau rechts'}</span></div>
          <div className="end"><Button variant={panel ? 'secondary' : 'primary'} onPress={() => { setPanel((p) => !p); setTimeout(() => setFit((x) => x + 1), 60); }}><Icon name="sidebar" size={20} />Eigenschaften</Button></div>
        </footer>
      </div>
    </>
  );
}
