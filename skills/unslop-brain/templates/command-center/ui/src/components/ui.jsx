import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Popover, ListBox, ToggleButton, ToggleButtonGroup, Input } from '@heroui/react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ICONS } from '../../../design/icons.mjs';
import { portrait } from '../../../design/illustrations.mjs';
import { STATUS, STATUS_LABEL, PRIOS } from '../lib/constants.js';
import { areasOf } from '../lib/model.js';

export function Icon({ name, size = 24, label, onFill = false }) {
  const d = ICONS[name]; if (!d) return null;
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return (
    <svg className={`ic${onFill ? ' on-fill' : ''}`} viewBox="0 0 24 24" width={size} height={size} focusable="false" {...a11y}>
      <path className="ic-soft" d={d.f} transform="translate(1.6 1.6)" /><path className="ic-line" d={d.l} />
    </svg>
  );
}

export const StatusMark = ({ status, size }) => <span className={`st${size === 'lg' ? ' lg' : ''}`} data-s={status} />;

// One tick per flow, grouped by area, coloured by status.
export function Strip({ app, size }) {
  const areas = areasOf(app);
  if (!areas.length) return <span className="quiet">noch keine Flows</span>;
  return (
    <div className={`strip${size ? ` ${size}` : ''}`} role="img" aria-label={STATUS.map(([k, l]) => `${l}: ${app.counts[k] || 0}`).join(', ')}>
      {areas.map((ar) => <div className="g" key={ar}>{app.flows.filter((f) => f.area === ar).map((f) => <i className="tick" key={f.path} data-s={f.status} title={`${f.title} · ${STATUS_LABEL[f.status]}`} />)}</div>)}
    </div>
  );
}

// Generated image of an app: numbers and token colours only, so injecting it as markup is safe.
export function Portrait({ app, width = 960, height = 280, calm = false }) {
  const html = useMemo(() => portrait({ seed: app.name, flows: app.flows }, { width, height }), [app, width, height]);
  return <div className={`portrait-wrap${calm ? ' calm' : ''}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Markdown({ text }) {
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(String(text || ''), { gfm: true })), [text]);
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}

// Click the marker, pick a status. No dropdown field.
export function StatusPicker({ status, onChange, size }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <Button isIconOnly variant="ghost" aria-label={`Status: ${STATUS_LABEL[status] || status}. Ändern`}><StatusMark status={status} size={size} /></Button>
      </Popover.Trigger>
      <Popover.Content placement="bottom start">
        <Popover.Dialog className="glass w-60 p-2">
          <ListBox aria-label="Status" selectionMode="single" selectedKeys={[status]} onSelectionChange={(keys) => { const k = [...keys][0]; setOpen(false); if (k && k !== status) onChange(String(k)); }}>
            {STATUS.map(([k, l]) => (
              <ListBox.Item key={k} id={k} textValue={l}><span className="flex items-center gap-3"><StatusMark status={k} />{l}</span><ListBox.ItemIndicator /></ListBox.Item>
            ))}
          </ListBox>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

export function Segmented({ label, options, value, onChange, size = 'sm' }) {
  return (
    <ToggleButtonGroup aria-label={label} selectionMode="single" disallowEmptySelection size={size} selectedKeys={new Set([value])}
      onSelectionChange={(keys) => { const k = [...keys][0]; if (k != null && String(k) !== value) onChange(String(k)); }}>
      {options.map(([v, l]) => <ToggleButton key={v} id={v}>{l}</ToggleButton>)}
    </ToggleButtonGroup>
  );
}
export const PrioSwitch = ({ value, onChange }) => <Segmented label="Priorität" options={PRIOS.map((p) => [p, p])} value={value} onChange={onChange} />;

// Click to edit, Enter saves, Esc cancels.
export function InlineText({ value, onSave, className, label }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value || '');
  const ref = useRef(null);
  useEffect(() => { setV(value || ''); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  if (!editing) return <button type="button" className={`${className || ''} text-left`} onClick={() => setEditing(true)} aria-label={`${label || 'Text'} bearbeiten`}>{value || <span className="quiet">leer</span>}</button>;
  const commit = () => { setEditing(false); if (v !== (value || '')) onSave(v); };
  return <Input ref={ref} aria-label={label || 'Text'} variant="secondary" value={v} onChange={(e) => setV(e.target.value)} onBlur={commit}
    onKeyDown={(e) => { if (e.key === 'Enter') commit(); else if (e.key === 'Escape') { setV(value || ''); setEditing(false); } }} />;
}

// One line at the end of a list: type a title, press Enter.
export function QuickAdd({ placeholder, onSubmit, children }) {
  const [v, setV] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async (e) => { e.preventDefault(); const t = v.trim(); if (!t || busy) return; setBusy(true); const ok = await onSubmit(t); setBusy(false); if (ok !== false) setV(''); };
  return (
    <form className="quick" onSubmit={go}>
      <Icon name="plus" size={22} />
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} aria-label={placeholder} maxLength={80} />
      {children}
      <span className="kbd" aria-hidden="true">Enter</span>
    </form>
  );
}
