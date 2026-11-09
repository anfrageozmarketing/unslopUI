import { useEffect, useMemo, useState } from 'react';
import { Modal, SearchField } from '@heroui/react';
import { Icon } from './ui.jsx';
import { filterPalette, paletteItems } from '../lib/model.js';

// Command palette: Modal + SearchField + our own keyboard list (combobox pattern).
export default function Palette({ open, onOpenChange, apps }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const items = useMemo(() => paletteItems(apps), [apps]);
  const results = useMemo(() => filterPalette(items, q), [items, q]);
  useEffect(() => { if (open) { setQ(''); setActive(0); } }, [open]);
  useEffect(() => { setActive(0); }, [q]);
  const go = (it) => { if (!it) return; onOpenChange(false); location.hash = it.href; };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
  };
  return (
    <Modal.Backdrop isOpen={open} onOpenChange={onOpenChange} variant="blur">
      <Modal.Container placement="top" size="lg">
        <Modal.Dialog className="glass p-3 palette-dialog" aria-label="Suchen und springen">
          <SearchField aria-label="Suchen" autoFocus value={q} onChange={setQ} fullWidth>
            <SearchField.Group><SearchField.SearchIcon /><SearchField.Input placeholder="Apps, Flows, Befunde, Entscheidungen" onKeyDown={onKey} role="combobox" aria-expanded="true" aria-controls="pal-list" aria-activedescendant={results[active] ? `pal-${results[active].id}` : undefined} /><SearchField.ClearButton /></SearchField.Group>
          </SearchField>
          <div className="palette-list" id="pal-list" role="listbox" aria-label="Treffer">
            {results.length === 0 && <p className="quiet px-3 py-4">Keine Treffer.</p>}
            {results.map((it, i) => (
              <button key={it.id} id={`pal-${it.id}`} type="button" role="option" aria-selected={i === active} className="pal-item" onMouseEnter={() => setActive(i)} onClick={() => go(it)}>
                <Icon name={it.icon} size={20} /><span className="flex-1 truncate">{it.label}</span><span className="quiet truncate">{it.hint}</span><span className="kbd">{it.kind}</span>
              </button>
            ))}
          </div>
          <div className="quiet mt-2 flex gap-3 px-1"><span><span className="kbd">↑↓</span> wählen</span><span><span className="kbd">Enter</span> öffnen</span><span><span className="kbd">Esc</span> schließen</span></div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
