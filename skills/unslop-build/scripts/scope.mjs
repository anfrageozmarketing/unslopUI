#!/usr/bin/env node
// Decides what an app needs (flows, screens, elements, design-system settings) from a short brief. Deterministic, so two runs agree.
// Usage: node scope.mjs brief.json [--out design/SCOPE.md]
// brief.json: { "name": "...", "kind": "internal|b2b|consumer|marketing", "audience": "...", "feeling": "calm|bold|warm|cool", "features": ["accounts","teams",...], "devices": ["desktop","phone"] }
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const FEATURES = {
  accounts: { flows: ['Creating account', 'Logging in', 'Logging out', 'Resetting password', 'Editing profile', 'Deleting and deactivating account', 'Verifying'], screens: ['Signup', 'Login', 'Forgot password', 'Verification', 'My account and profile', 'Delete and deactivate account'], elements: ['Text field', 'Button', 'Link', 'Checkbox', 'Avatar'] },
  teams: { flows: ['Inviting teammates and friends', 'Joining and accepting', 'Leaving', 'Switching account'], screens: ['Invite teammates', 'Settings and preferences'], elements: ['Select', 'Chip', 'Dropdown menu', 'Table'] },
  payments: { flows: ['Subscribing and upgrading', 'Canceling subscription', 'Purchasing and ordering', 'Canceling order and refunding'], screens: ['Pricing', 'Billing', 'Checkout', 'Payment method', 'Order confirmation', 'Subscription and paywall'], elements: ['Card', 'Radio button', 'Stepper', 'Banner', 'Dialog'] },
  content: { flows: ['Adding and creating', 'Editing and updating', 'Deleting and removing', 'Archiving', 'Copying and duplicating', 'Moving', 'Reordering', 'Saving to collection', 'Starting and completing'], screens: ['Home', 'Browse and discover', 'Detail (article, product, note, post)', 'Trash and archive', 'Bookmarks and collections'], elements: ['Card', 'Stacked list', 'Editable text', 'Context menu', 'Toast', 'Tab'] },
  search: { flows: ['Searching and finding', 'Filtering and sorting', 'Selecting and choosing'], screens: ['Search', 'Filter and sort', 'Command palette'], elements: ['Search bar', 'Chip', 'Combobox', 'Popover'] },
  files: { flows: ['Uploading and downloading', 'Importing and exporting'], screens: ['Upload and download', 'Import and export'], elements: ['File upload', 'Progress indicator', 'Toast'] },
  social: { flows: ['Commenting and replying', 'Sharing', 'Following and subscribing', 'Liking and upvoting', 'Reporting', 'Banning and blocking', 'Giving feedback'], screens: ['Comments', 'Followers and following', 'User and group profile', 'Notifications', 'Flag and report'], elements: ['Avatar', 'Badge', 'Switch', 'Popover'] },
  chat: { flows: ['Chatting and sending messages', 'Muting', 'Calling'], screens: ['Chat detail', 'Emails and messages', 'Notifications'], elements: ['Text field', 'Avatar', 'Badge', 'Loading indicator'] },
  notifications: { flows: ['Enabling and disabling', 'Turning on and off', 'Setting up'], screens: ['Notifications', 'Permission', 'Settings and preferences'], elements: ['Switch', 'Badge', 'Toast', 'Banner'] },
  data: { flows: ['Logging and tracking', 'Filtering and sorting', 'Importing and exporting', 'Switching view'], screens: ['Dashboard', 'Charts', 'Progress', 'Timeline and history'], elements: ['Table', 'Segmented control', 'Progress indicator', 'Date picker', 'Tooltip'] },
  scheduling: { flows: ['Scheduling', 'Booking and reserving'], screens: ['Calendar', 'Date and time', 'Event detail'], elements: ['Date picker', 'Time picker', 'Dialog'] },
  ai: { flows: ['Starting and completing', 'Giving feedback'], screens: ['Chat bot', 'Loading', 'Suggestions and similar items'], elements: ['Text field', 'Skeleton', 'Loading indicator', 'Toast'] },
  admin: { flows: ['Banning and blocking', 'Enabling and disabling', 'Verifying'], screens: ['Internal tool', 'Settings and preferences', 'Timeline and history'], elements: ['Table', 'Tree', 'Switch', 'Dialog', 'Toolbar'] },
  onboarding: { flows: ['Onboarding', 'Browsing tutorial', 'Setting up'], screens: ['Account setup', 'Guided tour and tutorial', 'Empty state'], elements: ['Coach marks', 'Progress indicator', 'Stepper'] },
};
const ALWAYS = { flows: ['Changing language', 'Switching to dark mode', 'Showing and hiding'], screens: ['Home', 'Settings and preferences', 'Empty state', 'Error', 'Loading', 'Acknowledgement and success', 'Confirmation', 'Help and support'], elements: ['Button', 'Link', 'Icon', 'Toast', 'Skeleton', 'Tooltip', 'Top navigation bar'] };
const KIND = {
  internal: { density: 'compact', ratio: 1.125, nav: 'Side navigation with labelled areas, collapsible', note: 'Speed and density over decoration; tables and bulk actions allowed.' },
  b2b: { density: 'comfortable', ratio: 1.2, nav: 'Side navigation with labelled areas, workspace switcher', note: 'Roles and teams matter; settings and billing are first-class screens.' },
  consumer: { density: 'roomy', ratio: 1.25, nav: 'Bottom bar on phone, top navigation on desktop', note: 'Onboarding and empty states carry the brand; larger type and images.' },
  marketing: { density: 'roomy', ratio: 1.25, nav: 'Top navigation bar, sticky and compact', note: 'Sections follow the product story, proof only if real.' },
};
const ACCOUNT = {
  sidebar: 'Account at the bottom of the left sidebar: avatar, name, menu (profile, settings, workspace switch, log out). Calm, always in reach, no extra bar.',
  topbar: 'Extra bar above the whole app in a distinct tone: logo, search, notifications, avatar menu (account, theme, log out), optional workspace switcher and announcement slot. The default for tools with accounts, notifications or workspaces.',
  header: 'Account in the top right of the working window header next to the primary action. Best for single-purpose tools with one area.',
  none: 'No account area (single user or public tool).',
};
const uniq = (a) => [...new Set(a)];

export function scope(brief) {
  const kind = KIND[brief.kind] ? brief.kind : 'b2b';
  const feats = uniq(brief.features ?? []).filter((f) => FEATURES[f]);
  const unknown = uniq(brief.features ?? []).filter((f) => !FEATURES[f]);
  const pick = (k) => uniq([...ALWAYS[k], ...feats.flatMap((f) => FEATURES[f][k])]);
  const phone = (brief.devices ?? ['desktop', 'phone']).includes('phone');
  return {
    name: brief.name ?? 'App', kind, feelings: brief.feeling ?? 'calm', features: feats, unknown,
    flows: pick('flows'), screens: pick('screens'), elements: pick('elements'),
    design: { ...KIND[kind], phone, account: ACCOUNT[brief.account] ? { key: brief.account, text: ACCOUNT[brief.account] } : null, command: feats.includes('search') || feats.includes('admin') || kind === 'internal' },
    questions: [...(feats.includes('accounts') && !ACCOUNT[brief.account] ? ['Where should the account area live: sidebar bottom, distinct top bar, or window header? (account: sidebar | topbar | header | none)'] : []), ...(brief.devices ? [] : ['Which devices: desktop only, phone too, phone first?'])],
    skipped: Object.keys(FEATURES).filter((f) => !feats.includes(f)),
  };
}

export function toMd(s) {
  const li = (a) => a.map((x) => `- [ ] ${x}`).join('\n');
  return `# SCOPE: ${s.name}

Kind: ${s.kind} · Feeling: ${s.feelings} · Features: ${s.features.join(', ') || 'none'}${s.unknown.length ? `\n\nUnknown features (ignored, add by hand): ${s.unknown.join(', ')}` : ''}

Generated from the brief. Every line is a proposal: tick it, strike it with a reason (\`na\`), or add to it. Names match the classic catalogs (\`unslop-flows\`, \`unslop-structure\`, \`unslop-components\`).

## Design system settings

- Density ${s.design.density}, type ratio ${s.design.ratio}: \`node scripts/spec.mjs --density ${s.design.density} --ratio ${s.design.ratio}\`
- Palette mood: ${s.feelings}: \`node ../unslop-foundation/scripts/palette.mjs --mood ${s.feelings} --seed <brand colour>\`
- Navigation: ${s.design.nav}
- ${s.design.note}
- Phone layout: ${s.design.phone ? 'required (bottom bar, reflow states)' : 'not required'}
- Account area: ${s.design.account ? s.design.account.key + ': ' + s.design.account.text : 'not decided yet'}
- Command palette: ${s.design.command ? 'yes' : 'optional'}

${s.questions.length ? `## Open questions\n\n${s.questions.map((q) => '- ' + q).join('\n')}\n\n` : ''}## Flows (${s.flows.length})

${li(s.flows)}

## Screens (${s.screens.length})

${li(s.screens)}

## UI elements (${s.elements.length})

${li(s.elements)}

## Not needed for this brief (confirm)

${s.skipped.map((f) => `- ${f}`).join('\n') || '- none'}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [file, flag, out] = process.argv.slice(2);
  if (!file) { console.error('usage: node scope.mjs brief.json [--out SCOPE.md]'); process.exit(2); }
  const md = toMd(scope(JSON.parse(readFileSync(resolve(file), 'utf8'))));
  if (flag === '--out' && out) { mkdirSync(dirname(resolve(out)), { recursive: true }); writeFileSync(resolve(out), md); console.log(`scope: ${out}`); } else process.stdout.write(md);
}
