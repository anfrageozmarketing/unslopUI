import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { edgePath, KIND_LABEL, layoutFlow } from '../lib/flow.js';
import { addAfter, addFirst, connect, deleteNode, insertOnEdge, removeEdge, renameNode, setEdgeLabel, setShape } from '../lib/flowEdit.js';
import { Icon } from './ui.jsx';

const ROUTER = <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path d="M4 16h8m0 0c6 0 6-8 14-8m0 0l-4-3m4 3l-4 3M12 16c6 0 6 8 14 8m0 0l-4-3m4 3l-4 3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;

// Visual flow editor: select a node to rename, switch its type, append a step or delete it; hover an edge to insert a step,
// name it or remove it; drag from an output port to another node to connect. Layout stays automatic.
export default function FlowEditor({ graph, onChange, fitSignal }) {
  const lay = useMemo(() => (graph.nodes.length ? layoutFlow(graph) : null), [graph]);
  const stage = useRef(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [sel, setSel] = useState(null); // { type: 'node'|'edge', id }
  const [edit, setEdit] = useState(null); // { type: 'node'|'edge', id, value }
  const [hover, setHover] = useState(null); // edge index
  const [link, setLink] = useState(null); // { from, x, y } while dragging a connection
  const drag = useRef(null);
  const size = () => ({ w: stage.current?.clientWidth || 900, h: stage.current?.clientHeight || 480 });
  const fit = useCallback(() => {
    if (!lay) return; const { w, h } = size(); const narrow = w < 600;
    let k = Math.min(1.4, (w - 80) / lay.w, (h - 120) / lay.h); if (narrow) k = Math.max(k, 0.8);
    setView({ k, x: narrow ? 12 : (w - lay.w * k) / 2, y: (h - lay.h * k) / 2 });
  }, [lay]);
  const first = useRef(true);
  useEffect(() => { if (lay && first.current) { first.current = false; fit(); } }, [lay, fit]);
  useEffect(() => { fit(); }, [fitSignal]); // eslint-disable-line react-hooks/exhaustive-deps
  const zoomAt = useCallback((f, cx, cy) => setView((v) => { const k2 = Math.max(0.3, Math.min(2, v.k * f)); return { k: k2, x: cx - (cx - v.x) * (k2 / v.k), y: cy - (cy - v.y) * (k2 / v.k) }; }), []);
  useEffect(() => {
    const s = stage.current; if (!s) return undefined;
    const onWheel = (e) => { e.preventDefault(); const r = s.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.1 : 0.9, e.clientX - r.left, e.clientY - r.top); };
    s.addEventListener('wheel', onWheel, { passive: false }); return () => s.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const toWorld = (e) => { const r = stage.current.getBoundingClientRect(); return { x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k }; };
  const toScreen = (x, y) => ({ left: view.x + x * view.k, top: view.y + y * view.k });
  const nodeById = (id) => graph.nodes.find((n) => n.id === id);
  const pick = (op) => { onChange(op); };

  if (!lay) {
    return (
      <div className="fstage" ref={stage}><div className="fempty"><p>Noch kein Ablauf</p><Button onPress={() => { const g = addFirst(graph, 'Start'); pick(g); setSel({ type: 'node', id: g.nodes[0].id }); }}><Icon name="plus" size={20} />Ersten Schritt hinzufügen</Button></div></div>
    );
  }
  const others = [...lay.pos.values()];
  const edges = graph.edges.map((e, i) => { const a = lay.pos.get(e.from); const b = lay.pos.get(e.to); if (!a || !b) return null; return { i, e, back: lay.back.has(e), ...edgePath(a, b, lay.back.has(e), others) }; }).filter(Boolean);
  const leaves = graph.nodes.filter((n) => !graph.edges.some((e) => e.from === n.id));
  const selNode = sel?.type === 'node' ? nodeById(sel.id) : null;

  const startEdit = (type, id, value) => setEdit({ type, id, value });
  const commit = () => {
    if (!edit) return;
    if (edit.type === 'node') pick(renameNode(graph, edit.id, edit.value)); else pick(setEdgeLabel(graph, edit.id, edit.value));
    setEdit(null);
  };
  const append = (id) => { const from = nodeById(id); const g = addAfter(graph, id, { label: 'Neuer Schritt', edgeLabel: from?.shape === 'decision' ? 'ja' : null }); pick(g); const n = g.nodes[g.nodes.length - 1]; setSel({ type: 'node', id: n.id }); startEdit('node', n.id, n.label); };
  const remove = () => { if (sel?.type === 'node') { pick(deleteNode(graph, sel.id)); setSel(null); } else if (sel?.type === 'edge') { pick(removeEdge(graph, sel.id)); setSel(null); } };

  const onDown = (e) => {
    if (e.target.closest('.fnode, .ghost, .emini, .tb, .fctl, .elabel, .eg')) return;
    setSel(null); setEdit(null); drag.current = { sx: e.clientX - view.x, sy: e.clientY - view.y }; stage.current.classList.add('grab'); e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (drag.current) setView((v) => ({ ...v, x: e.clientX - drag.current.sx, y: e.clientY - drag.current.sy }));
    else if (link) setLink((l) => ({ ...l, ...toWorld(e) }));
  };
  const onUp = (e) => {
    if (link) {
      const t = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.fnode'); const id = t?.getAttribute('data-id');
      if (id && id !== link.from) pick(connect(graph, link.from, id, nodeById(link.from)?.shape === 'decision' ? 'ja' : null));
      setLink(null);
    }
    drag.current = null; stage.current?.classList.remove('grab');
  };
  const onKey = (e) => {
    if (edit) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); remove(); }
    else if (e.key === 'Enter' && selNode) { e.preventDefault(); startEdit('node', selNode.id, selNode.label); }
    else if (e.key === 'Escape') setSel(null);
    else if (e.key === '+' || e.key === '=') { const { w, h } = size(); zoomAt(1.18, w / 2, h / 2); }
    else if (e.key === '-') { const { w, h } = size(); zoomAt(0.85, w / 2, h / 2); }
    else if (e.key === '0') fit();
  };
  const bar = selNode && !edit ? toScreen(lay.pos.get(selNode.id).x + lay.pos.get(selNode.id).w / 2, lay.pos.get(selNode.id).y - 34) : null;
  const editPos = edit ? (edit.type === 'node' ? toScreen(lay.pos.get(edit.id).x + lay.pos.get(edit.id).w / 2, lay.pos.get(edit.id).y - 34) : (() => { const x = edges.find((q) => q.i === edit.id); return toScreen(x?.mx || 0, (x?.my || 0) - 20); })()) : null;
  const { w: sw, h: sh } = size();

  return (
    <div className="fstage" ref={stage} tabIndex={0} role="application" aria-label="Ablauf bearbeiten. Schritt anklicken, Kante berühren, vom Ausgang zu einem Schritt ziehen."
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}>
      <div className="fworld" style={{ width: lay.w, height: lay.h, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
        <svg className="fsvg" width={lay.w} height={lay.h} viewBox={`0 0 ${lay.w} ${lay.h}`} aria-hidden="true">
          <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9z" className="farrow" /></marker></defs>
          {edges.map((x) => <path key={x.i} d={x.d} className={`fedge${x.back ? ' back' : ''}`} markerEnd="url(#arr)" style={sel?.type === 'edge' && sel.id === x.i ? { stroke: '#7fd0b4', strokeWidth: 3.4 } : undefined} />)}
          {edges.map((x) => <path key={`h${x.i}`} d={x.d} className="eg" onPointerEnter={() => setHover(x.i)} onPointerLeave={() => setHover((h) => (h === x.i ? null : h))} onClick={() => setSel({ type: 'edge', id: x.i })} />)}
          {link && (() => { const a = lay.pos.get(link.from); return <path d={`M${a.x + a.w} ${a.y + a.h / 2} L${link.x} ${link.y}`} className="fedge back" style={{ stroke: '#7fd0b4' }} />; })()}
        </svg>
        {graph.nodes.map((n) => {
          const p = lay.pos.get(n.id); const dec = n.shape === 'decision';
          return (
            <div key={n.id} data-id={n.id} className={`fnode k-${n.kind}${dec ? ' dec' : ''}${sel?.type === 'node' && sel.id === n.id ? ' sel' : ''}`} style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
              onClick={() => setSel({ type: 'node', id: n.id })} onDoubleClick={() => startEdit('node', n.id, n.label)}>
              <span className="fbadge">{KIND_LABEL[n.kind]}<b className="fnum">{n.n}</b></span>
              {dec ? <><span className="ficon">{ROUTER}</span><span className="fcap">{n.label}</span></> : <span className="flabel">{n.label}</span>}
              <i className="port in" />
              <i className="port out" onPointerDown={(e) => { e.stopPropagation(); setLink({ from: n.id, x: p.x + p.w, y: p.y + p.h / 2 }); stage.current.setPointerCapture?.(e.pointerId); }} />
            </div>
          );
        })}
        {leaves.map((n) => { const p = lay.pos.get(n.id); return <button key={`g${n.id}`} type="button" className="ghost" style={{ left: p.x + p.w + 34, top: p.y + p.h / 2 }} aria-label="Schritt anhängen" title="Schritt anhängen" onClick={() => append(n.id)}><Icon name="plus" size={20} /></button>; })}
        {edges.filter((x) => x.e.label).map((x) => <button type="button" key={`l${x.i}`} className="elabel" style={{ left: Math.round(x.mx), top: Math.round(x.my) }} title="Beschriftung ändern" onClick={() => { setSel({ type: 'edge', id: x.i }); startEdit('edge', x.i, x.e.label); }}>{x.e.label}</button>)}
        {edges.filter((x) => hover === x.i || (sel?.type === 'edge' && sel.id === x.i)).map((x) => (
          <div key={`m${x.i}`} className="emini" style={{ left: Math.round(x.mx), top: Math.round(x.my + (x.e.label ? 30 : 0)) }} onPointerEnter={() => setHover(x.i)} onPointerLeave={() => setHover(null)}>
            <button type="button" title="Schritt einfügen" aria-label="Schritt einfügen" onClick={() => { const g = insertOnEdge(graph, x.i, {}); pick(g); const n = g.nodes[g.nodes.length - 1]; setSel({ type: 'node', id: n.id }); startEdit('node', n.id, n.label); }}><Icon name="plus" size={18} /></button>
            <button type="button" title="Beschriften" aria-label="Kante beschriften" onClick={() => startEdit('edge', x.i, x.e.label || '')}><Icon name="edit" size={16} /></button>
            <button type="button" className="x" title="Kante entfernen" aria-label="Kante entfernen" onClick={() => { pick(removeEdge(graph, x.i)); setSel(null); }}><Icon name="close" size={16} /></button>
          </div>
        ))}
      </div>

      {bar && (
        <div className="tb glass" style={{ left: Math.min(Math.max(bar.left, 190), sw - 190), top: Math.max(bar.top, 56) }}>
          <Button size="sm" variant="ghost" onPress={() => startEdit('node', selNode.id, selNode.label)}><Icon name="edit" size={18} />Umbenennen</Button>
          <Button size="sm" variant="ghost" onPress={() => pick(setShape(graph, selNode.id, selNode.shape === 'decision' ? 'step' : 'decision'))}><Icon name="fork" size={18} />{selNode.shape === 'decision' ? 'Als Schritt' : 'Als Weiche'}</Button>
          <Button size="sm" variant="ghost" onPress={() => append(selNode.id)}><Icon name="plus" size={18} />Anhängen</Button>
          <Button size="sm" variant="danger-soft" onPress={remove}><Icon name="trash" size={18} />Löschen</Button>
        </div>
      )}
      {edit && editPos && (
        <div className="tb glass" style={{ left: Math.min(Math.max(editPos.left, 130), sw - 130), top: Math.max(editPos.top, 56) }}>
          <input autoFocus value={edit.value} aria-label={edit.type === 'node' ? 'Name des Schritts' : 'Beschriftung der Kante'} onChange={(e) => setEdit({ ...edit, value: e.target.value })} onBlur={commit}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') commit(); else if (e.key === 'Escape') setEdit(null); }} />
        </div>
      )}
      <div className="fctl glass">
        <button type="button" aria-label="Verkleinern" title="Verkleinern" onClick={() => zoomAt(0.85, sw / 2, sh / 2)}><Icon name="zoom-out" /></button>
        <button type="button" aria-label="Vergrößern" title="Vergrößern" onClick={() => zoomAt(1.18, sw / 2, sh / 2)}><Icon name="zoom-in" /></button>
        <button type="button" aria-label="Einpassen" title="Einpassen" onClick={fit}><Icon name="fit" /></button>
      </div>
    </div>
  );
}
