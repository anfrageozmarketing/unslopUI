import { Skeleton } from '@heroui/react';
import { Icon } from './ui.jsx';

// Boot screen: the real shell silhouette with a drawing route line, shown until the first data arrives.
export function BootScreen() {
  return (
    <div className="boot" role="status" aria-live="polite" aria-label="Command Center wird geöffnet">
      <div className="boot-rail">
        <span className="logo"><Icon name="route" size={24} /></span>
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="boot-btn" />)}
      </div>
      <div className="boot-ctx">
        <Skeleton className="h-7 w-24 rounded-lg" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
      </div>
      <div className="boot-win">
        <svg className="boot-route" viewBox="0 0 320 90" aria-hidden="true">
          <path className="m-draw" pathLength="1" d="M10 62 C 60 62, 70 24, 120 24 S 190 66, 230 52 S 290 20, 310 28" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
          <circle cx="10" cy="62" r="7" fill="var(--accent)" /><circle cx="120" cy="24" r="7" fill="var(--spark)" /><circle cx="230" cy="52" r="7" fill="var(--accent)" /><circle cx="310" cy="28" r="7" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="3" />
        </svg>
        <p className="boot-t">Deine Apps werden geladen</p>
        <div className="boot-cards">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}</div>
      </div>
    </div>
  );
}

// Skeleton in the shape of a list view: title, a few rows. Used inside a Window while data for that view arrives.
export function ListSkeleton({ rows = 6, label = 'Inhalt wird geladen' }) {
  return (
    <div className="grid gap-3" role="status" aria-live="polite" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div className="skel-row" key={i}><Skeleton className="h-4 w-16 rounded-md" /><Skeleton className="h-5 rounded-md" style={{ width: `${48 + ((i * 17) % 40)}%` }} /></div>
      ))}
    </div>
  );
}

// Skeleton of a note page: header lines, a diagram block, two text blocks.
export function NoteSkeleton() {
  return (
    <div className="grid gap-5" role="status" aria-live="polite" aria-label="Notiz wird geladen">
      <Skeleton className="h-9 w-2/5 rounded-xl" />
      <Skeleton className="h-56 w-full rounded-3xl" />
      <div className="grid gap-2"><Skeleton className="h-4 w-4/5 rounded-md" /><Skeleton className="h-4 w-3/5 rounded-md" /><Skeleton className="h-4 w-2/3 rounded-md" /></div>
    </div>
  );
}

// Skeleton of the editor stage: dark canvas with three placeholder nodes.
export function StageSkeleton() {
  return (
    <div className="stage-skel" role="status" aria-live="polite" aria-label="Flow wird geladen">
      <Skeleton className="stage-node" style={{ left: '12%', top: '40%' }} />
      <Skeleton className="stage-node" style={{ left: '42%', top: '24%' }} />
      <Skeleton className="stage-node" style={{ left: '42%', top: '58%' }} />
      <Skeleton className="stage-node" style={{ left: '72%', top: '40%' }} />
    </div>
  );
}
