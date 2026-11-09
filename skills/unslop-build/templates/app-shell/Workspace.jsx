// Generic workspace window (full-screen editor over the dimmed app). Class names match shell.css (.ws*).
// Layout: top bar (title + context, labelled mode switch, status, undo, close), stage (all remaining space, prev/next arrows),
// properties panel docked on the right (wide screens), bottom bar (position, tools, Eigenschaften toggle). Esc closes.
//
//   <WorkspaceWindow title="Login" context="in Demo-App" modes={[['flow','Ablauf'],['text','Text']]} mode={mode} onMode={setMode}
//     status={<StatusChip/>} saved="Gespeichert" onUndo={undo} onClose={close}
//     stage={<Canvas/>} panel={<Properties/>} panelOpen={open} onPanel={() => setOpen(!open)}
//     position="3 von 7 in Zugang" tools={<Button>Einpassen</Button>} onPrev={prev} onNext={next} />
import { useEffect } from 'react';

export function WorkspaceWindow({ title, context, modes = [], mode, onMode, status, saved, onUndo, onClose, stage, panel, panelOpen, onPanel, position, tools, onPrev, onNext }) {
  useEffect(() => { const f = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [onClose]);
  return (
    <>
      <div className="ws-back" onClick={onClose} aria-hidden="true" />
      <div className="ws" role="dialog" aria-modal="true" aria-label={`Workspace: ${title}`}>
        <header className="ws-top">
          <div className="ws-ctx"><h1>{title}</h1>{context && <span className="quiet whitespace-nowrap">{context}</span>}</div>
          <div className="seg" role="group" aria-label="Ansicht">{modes.map(([k, l]) => <button key={k} type="button" aria-pressed={mode === k} onClick={() => onMode(k)}>{l}</button>)}</div>
          <div className="ws-right">{status}{saved && <span className="quiet">{saved}</span>}{onUndo && <button type="button" className="tb-btn-text" onClick={onUndo}>Rückgängig</button>}<button type="button" className="tb-btn-text" onClick={onClose}>Schließen <span className="kbd">Esc</span></button></div>
        </header>
        <div className={`ws-stage${panelOpen && panel ? ' has-panel' : ''}`}>
          {stage}
          {onPrev && <button type="button" className="ws-nav l" aria-label="Vorheriges" onClick={onPrev}>‹</button>}
          {onNext && <button type="button" className="ws-nav r" aria-label="Nächstes" onClick={onNext}>›</button>}
          {panelOpen && panel && <aside className="ws-panel" aria-label="Eigenschaften">{panel}</aside>}
        </div>
        <footer className="ws-bottom">
          <span className="quiet">{position}</span>
          <div className="mid">{tools}</div>
          <div className="end"><button type="button" className="tb-btn-text" onClick={onPanel}>Eigenschaften</button></div>
        </footer>
      </div>
    </>
  );
}
