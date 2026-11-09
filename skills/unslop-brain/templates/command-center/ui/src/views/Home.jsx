import { useData } from '../lib/hooks.jsx';
import { appHref, summaryParts } from '../lib/model.js';
import { Portrait, Strip } from '../components/ui.jsx';

export default function Home() {
  const { data, state, error } = useData();
  if (state === 'error') return <p className="quiet">Daten konnten nicht geladen werden: {error}</p>;
  return (
    <div>
      <h1 className="text-4xl">Apps</h1>
      {state === 'ready' && !data.apps.length && <p className="quiet mt-4">Noch keine Apps im Vault. Lege unter Apps/&lt;Name&gt;/ eine _App.md an.</p>}
      <div className="apps">
        {data.apps.map((a) => (
          <a key={a.name} className="app-row" href={appHref(a.name)}>
            <Portrait app={a} width={1100} height={320} />
            <h2>{a.name}</h2>{a.stack && <p className="quiet mt-1">{a.stack}</p>}
            <div className="glass panel"><Strip app={a} size="lg" /><p className="quiet" style={{ color: 'var(--ink)' }}>{summaryParts(a).join(' · ')}</p></div>
          </a>
        ))}
      </div>
    </div>
  );
}
