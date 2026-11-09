// Generic app shell: top bar, rail, dark layer 2 (menu + light window). Class names match shell.css.
// Usage:
//   <AppShell brand={{ name: 'My App', logo: <Icon/> }} areas={[{ key, label, icon, href, count }]} current="flows"
//             menu={<MenuColumn/>} onSearch={...} account={<AccountMenu/>} messages={{ count: 3, href: '#/inbox' }}
//             ctxOpen={open} onToggle={toggle}>{view}</AppShell>
// The view is a <Window title sub actions> (below). Nothing here is app-specific.

export function AppShell({ brand, areas, current, menu, onSearch, account, messages, ctxOpen = true, onToggle, children }) {
  return (
    <div className="frame">
      <header className="topbar">
        <a className="tb-brand" href="#/" aria-label={`${brand.name}, zur Übersicht`}><span className="tb-logo">{brand.logo}</span><b>{brand.name}</b></a>
        <button type="button" className="tb-search" onClick={onSearch} aria-label="Suchen und springen"><span>Suchen</span><span className="kbd">Strg K</span></button>
        <div className="tb-right">
          {messages && <a className="tb-btn" href={messages.href} aria-label={`${messages.count} offen`}>{messages.icon}{messages.count > 0 && <span className="cnt-badge tb-cnt">{messages.count > 9 ? '9+' : messages.count}</span>}</a>}
          {account}
        </div>
      </header>
      <div className={`app${ctxOpen ? '' : ' no-ctx'}`}>
        <nav className="rail" aria-label="Bereiche">
          {areas.map((a) => (
            <a key={a.key} className="rail-btn" href={a.href} title={a.label} aria-current={current === a.key ? 'page' : undefined}>
              <span className="rail-ic">{a.icon}{a.count > 0 && <span className="cnt-badge cnt" role="img" aria-label={`${a.count} offen`}>{a.count > 9 ? '9+' : a.count}</span>}</span>
              <span className="rail-lbl">{a.label}</span>
            </a>
          ))}
        </nav>
        <div className="deck">
          <aside className="ctx" aria-label="Menü">{menu}</aside>
          {children}
          {onToggle && <button type="button" className="edge-toggle" aria-label={ctxOpen ? 'Seitenleiste einklappen' : 'Seitenleiste ausklappen'} aria-expanded={ctxOpen} onClick={onToggle}>{ctxOpen ? '‹' : '›'}</button>}
        </div>
      </div>
    </div>
  );
}

// The light content window. Title, optional subtitle, actions on the right (one primary).
export function Window({ title, sub, actions, children }) {
  return (
    <main className="window">
      <header className="window-head">
        <div className="min-w-0"><h1 className="truncate">{title}</h1>{sub && <div className="sub-t">{sub}</div>}</div>
        <div className="tools">{actions}</div>
      </header>
      <div className="window-body">{children}</div>
    </main>
  );
}
