import { AREA_ICON } from '../lib/constants.js';
import { areasOf, byPrio, noteHref } from '../lib/model.js';
import { STATUS_LABEL } from '../lib/constants.js';
import { Icon, StatusMark } from './ui.jsx';

export function Lane({ app, area, active, current, fresh }) {
  const flows = app.flows.filter((f) => f.area === area).sort(byPrio);
  const done = flows.filter((f) => f.status === 'built' || f.status === 'exists').length;
  return (
    <section className="lane" aria-label={area}>
      <header><h3><Icon name={AREA_ICON[area] || 'route'} size={22} />{area}</h3><span className="quiet num">{done}/{flows.length}</span></header>
      <div className="track">
        {flows.map((f, i) => (
          <a key={f.path} href={noteHref(f)} className={`node m-rise p-${f.prio}${active?.size && !active.has(f.status) ? ' dim' : ''}${f.path === current ? ' cur' : ''}${fresh?.has(f.path) ? ' m-new' : ''}`} data-s={f.status} style={{ '--i': i }}
            aria-current={f.path === current ? 'page' : undefined} title={`${f.title} · ${STATUS_LABEL[f.status]} · ${f.prio}${f.reason ? ` · ${f.reason}` : ''}`}>
            <StatusMark status={f.status} /><span className="lbl">{softWrap(f.title)}</span>{f.prio === 'MVP' && <span className="mvp">MVP</span>}
          </a>
        ))}
      </div>
    </section>
  );
}

// One lane per area, one node per flow. Marker = status, size = priority.
const softWrap = (t = '') => t.replace(/\p{L}{14,}/gu, (w) => `${w.slice(0, Math.ceil(w.length / 2))}\u00AD${w.slice(Math.ceil(w.length / 2))}`);

export default function RouteMap({ app, active, fresh }) {
  const areas = areasOf(app);
  if (!areas.length) return <p className="quiet">Noch keine Flows. Lege den ersten unten an.</p>;
  return <div className="map">{areas.map((a) => <Lane key={a} app={app} area={a} active={active} fresh={fresh} />)}</div>;
}
