import { useEffect, useMemo, useState } from 'react';
import { Button, Modal } from '@heroui/react';
import { api } from '../lib/api.js';
import { useActions, useData } from '../lib/hooks.jsx';
import { parseFlow, sollChain, splitSections, takeMermaid } from '../lib/flow.js';
import { DSTATES, FSTATES, SEVERITIES, STATUS_LABEL } from '../lib/constants.js';
import { areaHref } from '../lib/model.js';
import { Icon, InlineText, Markdown, PrioSwitch, PropertyRow, Segmented, StatusPicker, TokenField } from '../components/ui.jsx';
import FlowCanvas from '../components/FlowCanvas.jsx';
import { Window } from '../components/Shell.jsx';

function TextEditor({ open, onOpenChange, initial, onSave }) {
  const [text, setText] = useState(initial);
  useEffect(() => { if (open) setText(initial); }, [open, initial]);
  return (
    <Modal.Backdrop isOpen={open} onOpenChange={onOpenChange} variant="blur">
      <Modal.Container size="lg" placement="center">
        <Modal.Dialog className="glass p-4" aria-label="Text bearbeiten">
          <div className="grid gap-4 md:grid-cols-2" style={{ minHeight: '50vh' }}>
            <textarea className="editor" value={text} onChange={(e) => setText(e.target.value)} aria-label="Markdown" spellCheck={false} style={{ minHeight: '50vh' }} />
            <div className="overflow-auto"><Markdown text={text} /></div>
          </div>
          <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onPress={() => onOpenChange(false)}>Abbrechen</Button><Button onPress={() => { onSave(text); onOpenChange(false); }}>Speichern</Button></div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

// Every value of the note is editable where it stands. No form, no Save button.
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

export default function NotePage({ path, appName }) {
  const { version } = useData(); const { saveBody, archive } = useActions();
  const [note, setNote] = useState(null); const [err, setErr] = useState(null); const [editor, setEditor] = useState(false);
  useEffect(() => { let off = false; setErr(null); api.note(path).then((n) => { if (!off) setNote(n); }).catch((e) => { if (!off) setErr(e.message); }); return () => { off = true; }; }, [path, version]);
  const parts = useMemo(() => {
    if (!note) return null;
    const { pre, secs } = splitSections(note.body); const { code, rest } = takeMermaid(pre);
    const g = code ? parseFlow(code) : { nodes: [], edges: [] };
    return { secs, rest, graph: g.nodes.length ? { g, derived: false } : { g: sollChain(note.meta.title || '', secs) || { nodes: [], edges: [] }, derived: true } };
  }, [note]);
  if (err) return <Window title="Notiz"><p className="quiet">{err}</p></Window>;
  if (!note) return <Window title="Notiz"><p className="quiet">Lädt …</p></Window>;
  const m = note.meta; const isFlow = m.type === 'flow';
  const kind = { flow: 'flows', finding: 'findings', decision: 'decisions' }[m.type] || 'flows';
  const title = m.type === 'decision' ? (m.question || m.title) : (m.title || path.split('/').pop().replace(/\.md$/, ''));
  const managed = ['flow', 'finding', 'decision'].includes(m.type);
  const want = (x) => /^(soll|l[uü]cken)/i.test(x); const pair = parts.secs.filter((s) => want(s.title)); const others = parts.secs.filter((s) => !want(s.title));
  return (
    <Window title={title} sub={<a href={areaHref(kind, appName)} className="underline decoration-transparent hover:decoration-current">{appName}</a>}
      actions={managed && <>
        {isFlow && <Button variant="primary" size="sm" onPress={() => { location.hash = `#/workspace/${encodeURIComponent(path)}`; }}><Icon name="expand" size={18} />Workspace</Button>}
        <Button variant="ghost" size="sm" onPress={() => setEditor(true)}><Icon name="edit" size={18} />Text</Button>
        <Button isIconOnly variant="ghost" aria-label="Archivieren" onPress={async () => { if (await archive(path)) location.hash = areaHref(kind, appName); }}><Icon name="archive" size={22} /></Button>
      </>}>
      <div className="grid gap-6">
        {isFlow && <><div onDoubleClick={() => { location.hash = `#/workspace/${encodeURIComponent(path)}`; }}><FlowCanvas graph={parts.graph.g} onEdit={() => setEditor(true)} /></div>{parts.graph.derived && parts.graph.g.nodes.length > 0 && <p className="quiet -mt-3">Aus „Soll“ abgeleitet</p>}</>}
        {managed && <Properties path={path} note={note} />}
        {parts.rest.trim() && <Markdown text={parts.rest} />}
        {isFlow && pair.length > 0 && <div className="cols2">{pair.map((s) => <section key={s.title}><h2 className="mb-2 text-xl">{s.title}</h2><Markdown text={s.md} /></section>)}</div>}
        {(isFlow ? others : parts.secs).map((s) => <section key={s.title}><h2 className="mb-2 text-xl">{s.title}</h2><Markdown text={s.md} /></section>)}
        {!isFlow && !managed && <Markdown text={note.body} />}
      </div>
      <TextEditor open={editor} onOpenChange={setEditor} initial={note.body.replace(/^\n+/, '')} onSave={(t) => saveBody(path, t)} />
    </Window>
  );
}
