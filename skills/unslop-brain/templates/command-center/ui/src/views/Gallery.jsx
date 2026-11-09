import { useState } from 'react';
import { Button, Skeleton, toast } from '@heroui/react';
import { AREAS } from '../lib/model.js';
import { STATUS, PRIOS } from '../lib/constants.js';
import { EmptyState, Icon, InlineText, PrioSwitch, PropertyRow, QuickAdd, Segmented, StatusMark, StatusPicker, Strip, TokenField } from '../components/ui.jsx';
import { Window } from '../components/Shell.jsx';

const Cell = ({ cap, children }) => <div><div className="cap">{cap}</div>{children}</div>;
const demoApp = { name: 'Demo', counts: { missing: 2, partial: 1, exists: 1, built: 1, na: 1 }, flows: [['Zugang', 'missing'], ['Zugang', 'missing'], ['Zugang', 'partial'], ['Kernablauf', 'exists'], ['Kernablauf', 'built'], ['System', 'na']].map(([area, status], i) => ({ path: String(i), title: `Flow ${i}`, area, status })) };

// Components first: every building block in its states, before any screen uses it.
export default function Gallery() {
  const [status, setStatus] = useState('partial'); const [prio, setPrio] = useState('V1'); const [text, setText] = useState('Test e2e grün'); const [tokens, setTokens] = useState(['/login', '/forgot']); const [seg, setSeg] = useState('open');
  return (
    <Window title="Bausteine" sub="Alle Teile in ihren Zuständen">
      <div className="gal">
        <section><h2>Leiste</h2><div className="grid-c">
          <Cell cap="Aktiv"><div className="rail-btn" aria-current="page" style={{ position: 'relative' }}><Icon name="route" size={26} /></div></Cell>
          <Cell cap="Standard"><div className="rail-btn"><Icon name="alert" size={26} /></div></Cell>
          <Cell cap="Mit Zähler"><div className="rail-btn"><Icon name="question" size={26} /><span className="cnt-badge cnt">3</span></div></Cell>
        </div></section>
        <section><h2>Bereiche</h2><div className="grid-c">{AREAS.map((a) => <Cell key={a.key} cap={a.label}><div className="inline-flex items-center gap-2 font-bold"><Icon name={a.icon} size={24} />{a.label}</div></Cell>)}</div></section>
        <section><h2>Status</h2><div className="grid-c">
          {STATUS.map(([k, l]) => <Cell key={k} cap={l}><span className="inline-flex items-center gap-2 font-semibold"><StatusMark status={k} />{l}</span></Cell>)}
          <Cell cap="Auswahl (antippen)"><StatusPicker status={status} onChange={setStatus} /></Cell>
          <Cell cap="Streifen"><Strip app={demoApp} size="lg" /></Cell>
        </div></section>
        <section><h2>Direkt bearbeiten</h2><div className="props" style={{ maxWidth: 640 }}>
          <PropertyRow label="Priorität"><PrioSwitch value={prio} onChange={setPrio} /></PropertyRow>
          <PropertyRow label="Nachweis"><InlineText label="Nachweis" value={text} onSave={setText} placeholder="leer" /></PropertyRow>
          <PropertyRow label="Screens"><TokenField value={tokens} onChange={setTokens} placeholder="Route" /></PropertyRow>
          <PropertyRow label="Ansicht"><Segmented label="Ansicht" options={[['open', 'Offen'], ['all', 'Alle']]} value={seg} onChange={setSeg} /></PropertyRow>
        </div></section>
        <section><h2>Anlegen</h2><div style={{ maxWidth: 640 }}><QuickAdd placeholder="Neuer Flow" onSubmit={async (t) => { toast.success(`Angelegt: ${t}`); }} /></div></section>
        <section><h2>Zeilen</h2><div className="rows" style={{ maxWidth: 640 }}>
          <div className="row"><StatusMark status="missing" /><span className="t">Login</span><span className="meta">Zugang · MVP</span><span /></div>
          <div className="row" style={{ background: 'var(--surface-2)' }}><StatusMark status="partial" /><span className="t">Bericht senden (Hover)</span><span className="meta">Kernablauf</span><span className="acts" style={{ opacity: 1 }}><Button isIconOnly variant="ghost" aria-label="Archivieren"><Icon name="archive" size={20} /></Button></span></div>
          <div className="row f"><span className="sev sev-Blocker">Blocker</span><span className="t">API ohne Authentifizierung</span><span className="meta">main.py</span><span /></div>
        </div></section>
        <section><h2>Schaltflächen</h2><div className="flex flex-wrap items-center gap-3">
          <Button>Primär</Button><Button variant="secondary">Sekundär</Button><Button variant="ghost">Leise</Button><Button variant="danger-soft">Gefahr</Button><Button isDisabled>Aus</Button>
          <Button isIconOnly variant="secondary" aria-label="Suchen"><Icon name="search" /></Button>
          <Button variant="secondary" onPress={() => toast('Gespeichert', { actionProps: { children: 'Rückgängig', variant: 'tertiary' } })}>Hinweis mit Rückgängig</Button>
        </div></section>
        <section><h2>Leere Zustände</h2><div className="grid-c">
          <EmptyState art="emptyFlows" title="Noch kein Ablauf"><Button size="sm">Flow anlegen</Button></EmptyState>
          <EmptyState art="emptyFindings" title="Keine Befunde" />
          <EmptyState art="error" title="Nicht gespeichert"><Button size="sm" variant="secondary">Erneut</Button></EmptyState>
        </div></section>
        <section><h2>Laden</h2><div className="grid gap-3" style={{ maxWidth: 420 }}><Skeleton className="h-4 w-3/5 rounded-lg" /><Skeleton className="h-4 w-4/5 rounded-lg" /><Skeleton className="h-4 w-2/5 rounded-lg" /></div></section>
        <section><h2>Priorität</h2><div className="flex gap-6">{PRIOS.map((p) => <span key={p} className={`node p-${p}`} style={{ width: 90 }}><StatusMark status="missing" /><span className="lbl">{p}</span></span>)}</div></section>
      </div>
    </Window>
  );
}
