import { NoteSkeleton } from '../components/Loading.jsx';
import { replaceSection } from '../lib/note.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { api } from '../lib/api.js';
import { useActions, useData } from '../lib/hooks.jsx';
import { parseFlow, sollChain, splitSections, takeMermaid } from '../lib/flow.js';
import { DSTATES, FSTATES, SEVERITIES, STATUS_LABEL } from '../lib/constants.js';
import { areaHref } from '../lib/model.js';
import { Icon, InlineText, Markdown, PrioSwitch, PropertyRow, Segmented, StatusPicker, TokenField } from '../components/ui.jsx';
import FlowCanvas from '../components/FlowCanvas.jsx';
import { Sheet, Window } from '../components/Shell.jsx';


// Click the text and type; it saves when you leave it. Esc cancels. No pencil, no button.
function EditableMarkdown({ text, onSave, label, placeholder = 'Klicken und schreiben' }) {
  const [editing, setEditing] = useState(false); const [v, setV] = useState(text); const ref = useRef(null);
  useEffect(() => { if (!editing) setV(text); }, [text, editing]);
  useEffect(() => { if (editing && ref.current) { const t = ref.current; t.focus(); t.style.height = 'auto'; t.style.height = `${t.scrollHeight + 4}px`; } }, [editing]);
  const commit = () => { setEditing(false); if (v.trim() !== (text || '').trim()) onSave(v); };
  if (!editing) return (
    <div className="edit-md" role="button" tabIndex={0} aria-label={`${label} bearbeiten`}
      onClick={(e) => { if (!e.target.closest('a')) setEditing(true); }} onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) setEditing(true); }}>
      {text.trim() ? <Markdown text={text} /> : <p className="quiet">{placeholder}</p>}
    </div>
  );
  return <textarea ref={ref} className="editor edit-md-area" value={v} aria-label={label} spellCheck={false}
    onChange={(e) => { setV(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight + 4}px`; }}
    onBlur={commit} onKeyDown={(e) => { if (e.key === 'Escape') { setV(text); setEditing(false); } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit(); }} />;
}

export function Properties({ path, note }) {
  const { change } = useActions(); const m = note.meta; const t = m.type;
  const set = (field, prev, label) => (v) => change(path, field, v, prev, label);
  return (
    <div className="props">
      {t === 'flow' && <>
        <PropertyRow label="Status"><StatusPicker status={m.status} onChange={(v) => change(path, 'status', v, m.status, `Status: ${STATUS_LABEL[v]}`)} /></PropertyRow>
        <PropertyRow label="Priorität"><PrioSwitch value={m.prio} onChange={(v) => change(path, 'prio', v, m.prio)} /></PropertyRow>
        <PropertyRow label="Begründung"><InlineText label="Begründung" value={m.reason} onSave={set('reason', m.reason || '')} placeholder="nur bei „Nicht nötig“" /></PropertyRow>
        <PropertyRow label="Screens"><TokenField value={m.screens || []} onChange={set('screens', m.screens || [])} placeholder="Route" /></PropertyRow>
        <PropertyRow label="Endpoints"><TokenField value={m.endpoints || []} onChange={set('endpoints', m.endpoints || [])} placeholder="Endpoint" /></PropertyRow>
        <PropertyRow label="Nachweis"><InlineText label="Nachweis" value={m.evidence} onSave={set('evidence', m.evidence || '')} placeholder="Test, Gate oder Link" /></PropertyRow>
      </>}
      {t === 'finding' && <>
        <PropertyRow label="Status"><Segmented label="Status" options={FSTATES} value={m.state} onChange={(v) => change(path, 'state', v, m.state)} /></PropertyRow>
        <PropertyRow label="Schwere"><Segmented label="Schwere" options={SEVERITIES.map((s) => [s, s])} value={m.severity} onChange={(v) => change(path, 'severity', v, m.severity)} /></PropertyRow>
        <PropertyRow label="Wo"><InlineText label="Wo" value={m.where} onSave={set('where', m.where || '')} placeholder="Datei oder Route" /></PropertyRow>
      </>}
      {t === 'decision' && <>
        <PropertyRow label="Status"><Segmented label="Status" options={DSTATES} value={m.state} onChange={(v) => change(path, 'state', v, m.state)} /></PropertyRow>
        <PropertyRow label="Frage"><InlineText label="Frage" value={m.question} onSave={set('question', m.question || '')} placeholder="Was muss entschieden werden?" /></PropertyRow>
        <PropertyRow label="Antwort"><InlineText label="Antwort" value={m.answer} onSave={set('answer', m.answer || '')} placeholder="Noch offen" /></PropertyRow>
      </>}
    </div>
  );
}

export default function NotePage({ path, appName, dialog = false }) {
  const { version } = useData(); const { saveBody, archive } = useActions();
  const [note, setNote] = useState(null); const [err, setErr] = useState(null); 
  useEffect(() => { let off = false; setErr(null); api.note(path).then((n) => { if (!off) setNote(n); }).catch((e) => { if (!off) setErr(e.message); }); return () => { off = true; }; }, [path, version]);
  const parts = useMemo(() => {
    if (!note) return null;
    const { pre, secs } = splitSections(note.body); const { code, rest } = takeMermaid(pre);
    const g = code ? parseFlow(code) : { nodes: [], edges: [] };
    return { secs, rest, graph: g.nodes.length ? { g, derived: false } : { g: sollChain(note.meta.title || '', secs) || { nodes: [], edges: [] }, derived: true } };
  }, [note]);
  const Shell = dialog ? Sheet : Window; const back = () => { if (history.length > 1) history.back(); else location.hash = '#/apps'; };
  if (err) return <Shell title="Notiz" onClose={back}><div className="grid gap-3"><p className="quiet">Die Notiz konnte nicht geladen werden ({err}).</p><div><Button variant="secondary" onPress={() => setErr(null) || api.note(path).then(setNote).catch((e) => setErr(e.message))}>Erneut versuchen</Button></div></div></Shell>;
  if (!note) return <Shell title="Notiz" onClose={back}><NoteSkeleton /></Shell>;
  const m = note.meta; const isFlow = m.type === 'flow';
  const kind = { flow: 'flows', finding: 'findings', decision: 'decisions' }[m.type] || 'flows';
  const title = m.type === 'decision' ? (m.question || m.title) : (m.title || path.split('/').pop().replace(/\.md$/, ''));
  const managed = ['flow', 'finding', 'decision'].includes(m.type);
  const Frame = dialog ? Sheet : Window;
  const want = (x) => /^(soll|l[uü]cken)/i.test(x); const pair = parts.secs.filter((s) => want(s.title)); const others = parts.secs.filter((s) => !want(s.title));
  return (
    <Frame title={title} onClose={() => { location.hash = areaHref(kind, appName); }} sub={<a href={areaHref(kind, appName)} className="underline decoration-transparent hover:decoration-current">{appName}</a>}
      actions={managed && <>
        {!dialog && <Button variant="ghost" size="sm" onPress={() => { location.hash = areaHref(kind, appName); }}><Icon name="back" size={18} />Zurück</Button>}
        {isFlow && <Button variant="primary" size="sm" onPress={() => { location.hash = `#/workspace/${encodeURIComponent(path)}`; }}><Icon name="expand" size={18} />Workspace</Button>}
        <Button isIconOnly variant="ghost" aria-label="Archivieren" onPress={async () => { if (await archive(path)) location.hash = areaHref(kind, appName); }}><Icon name="archive" size={22} /></Button>
      </>}>
      <div className="grid gap-6">
        {isFlow && <><div onDoubleClick={() => { location.hash = `#/workspace/${encodeURIComponent(path)}`; }}><FlowCanvas graph={parts.graph.g} onEdit={() => { location.hash = `#/workspace/${encodeURIComponent(path)}`; }} /></div>{parts.graph.derived && parts.graph.g.nodes.length > 0 && <p className="quiet -mt-3">Aus „Soll“ abgeleitet</p>}</>}
        {managed && <Properties path={path} note={note} />}
        {managed && (parts.rest.trim() || !isFlow) && <EditableMarkdown label="Beschreibung" text={parts.rest} onSave={(t) => saveBody(path, replaceSection(note.body, null, t))} />}
        {!managed && parts.rest.trim() && <Markdown text={parts.rest} />}
        {isFlow && pair.length > 0 && <div className="cols2">{pair.map((s) => <section key={s.title}><h2 className="mb-2 text-xl">{s.title}</h2><EditableMarkdown label={s.title} text={s.md} onSave={(t) => saveBody(path, replaceSection(note.body, s.title, t))} /></section>)}</div>}
        {(isFlow ? others : parts.secs).map((s) => <section key={s.title}><h2 className="mb-2 text-xl">{s.title}</h2>{managed ? <EditableMarkdown label={s.title} text={s.md} onSave={(t) => saveBody(path, replaceSection(note.body, s.title, t))} /> : <Markdown text={s.md} />}</section>)}
        {!isFlow && !managed && <Markdown text={note.body} />}
      </div>
    </Frame>
  );
}
