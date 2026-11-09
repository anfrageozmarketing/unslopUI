import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Button } from '@heroui/react';
import { layoutFlow, edgePath, KIND_LABEL } from '../lib/flow.js';
import { Icon } from './ui.jsx';

const ROUTER_ICON = <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path d="M4 16h8m0 0c6 0 6-8 14-8m0 0l-4-3m4 3l-4 3M12 16c6 0 6 8 14 8m0 0l-4-3m4 3l-4 3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;

// The flow as nodes and curves. Drag to pan, wheel to zoom, buttons and keys +, -, 0.
export default function FlowCanvas({ graph, onEdit }) {
  const lay = useMemo(() => (graph.nodes.length ? layoutFlow(graph) : null), [graph]);
  const stage = useRef(null); const world = useRef(null); const view = useRef({ k: 1, x: 0, y: 0 }); const drag = useRef(null);
  const apply = () => { const v = view.current; if (world.current) world.current.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.k})`; };
  const size = () => ({ w: stage.current?.clientWidth || 900, h: stage.current?.clientHeight || 480 });
  const fit = useCallback(() => {
    if (!lay || !stage.current) return;
    const { w, h } = size(); const narrow = w < 600;
    let k = Math.min(1.5, (w - 24) / lay.w, (h - 24) / lay.h); if (narrow) k = Math.max(k, 0.8);
    view.current = { k, x: narrow ? 12 : (w - lay.w * k) / 2, y: (h - lay.h * k) / 2 }; apply();
  }, [lay]);
  const zoomAt = useCallback((f, cx, cy) => {
    const v = view.current; const k2 = Math.max(0.3, Math.min(2, v.k * f));
    view.current = { k: k2, x: cx - (cx - v.x) * (k2 / v.k), y: cy - (cy - v.y) * (k2 / v.k) }; apply();
  }, []);
  useEffect(() => { fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit); }, [fit]);
  useEffect(() => {
    const s = stage.current; if (!s) return undefined;
    const onWheel = (e) => { e.preventDefault(); const r = s.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.1 : 0.9, e.clientX - r.left, e.clientY - r.top); };
    s.addEventListener('wheel', onWheel, { passive: false }); return () => s.removeEventListener('wheel', onWheel);
  }, [zoomAt, lay]);

  if (!lay) return (
    <div className="fstage" ref={stage}><div className="fempty"><p>Für diesen Flow gibt es noch keinen Ablauf.</p>
      <Button variant="secondary" onPress={onEdit}>Ablauf als Text zeichnen</Button></div></div>
  );
  const others = [...lay.pos.values()];
  const edges = graph.edges.map((e, i) => { const a = lay.pos.get(e.from); const b = lay.pos.get(e.to); if (!a || !b) return null; return { i, e, back: lay.back.has(e), ...edgePath(a, b, lay.back.has(e), others) }; }).filter(Boolean);
  const center = () => { const { w, h } = size(); return [w / 2, h / 2]; };
  return (
    <div className="fstage" ref={stage} tabIndex={0} role="group" aria-label="Ablauf als Diagramm. Ziehen zum Verschieben, Mausrad zum Zoomen."
      onPointerDown={(e) => { if (e.target.closest?.('.fctl')) return; drag.current = { sx: e.clientX - view.current.x, sy: e.clientY - view.current.y }; stage.current.classList.add('grab'); e.currentTarget.setPointerCapture?.(e.pointerId); }}
      onPointerMove={(e) => { if (!drag.current) return; view.current.x = e.clientX - drag.current.sx; view.current.y = e.clientY - drag.current.sy; apply(); }}
      onPointerUp={() => { drag.current = null; stage.current?.classList.remove('grab'); }} onPointerCancel={() => { drag.current = null; stage.current?.classList.remove('grab'); }}
      onKeyDown={(e) => { const [cx, cy] = center(); if (e.key === '+' || e.key === '=') zoomAt(1.18, cx, cy); else if (e.key === '-') zoomAt(0.85, cx, cy); else if (e.key === '0') fit(); }}>
      <div className="fworld" ref={world} style={{ width: lay.w, height: lay.h }}>
        <svg className="fsvg" width={lay.w} height={lay.h} viewBox={`0 0 ${lay.w} ${lay.h}`} aria-hidden="true">
          <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9z" className="farrow" /></marker></defs>
          {edges.map((x) => <path key={x.i} d={x.d} className={`fedge${x.back ? ' back' : ''}`} markerEnd="url(#arr)" />)}
        </svg>
        {graph.nodes.map((n) => {
          const p = lay.pos.get(n.id); const dec = n.shape === 'decision';
          return (
            <div key={n.id} className={`fnode k-${n.kind}${dec ? ' dec' : ''}`} style={{ left: p.x, top: p.y, width: p.w, height: p.h }} title={n.label}>
              <span className="fbadge">{KIND_LABEL[n.kind]}<b className="fnum">{n.n}</b></span>
              {dec ? <><span className="ficon">{ROUTER_ICON}</span><span className="fcap">{n.label}</span></> : <span className="flabel">{n.label}</span>}
              <i className="port in" /><i className="port out" />
            </div>
          );
        })}
        {edges.filter((x) => x.e.label).map((x) => <span key={`l${x.i}`} className="elabel" style={{ left: Math.round(x.mx), top: Math.round(x.my) }}>{x.e.label}</span>)}
      </div>
      <div className="fctl glass">
        <button type="button" aria-label="Verkleinern" onClick={() => zoomAt(0.85, ...center())}><Icon name="zoom-out" /></button>
        <button type="button" aria-label="Vergrößern" onClick={() => zoomAt(1.18, ...center())}><Icon name="zoom-in" /></button>
        <button type="button" aria-label="Einpassen" onClick={fit}><Icon name="fit" /></button>
      </div>
    </div>
  );
}
