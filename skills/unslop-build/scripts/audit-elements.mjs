#!/usr/bin/env node
// Coverage of the classic UI elements in a source tree: which are used, which are missing, which are likely hand-rolled.
// Usage: node audit-elements.mjs <src-dir> [--json]
// It is a heuristic over source text (HeroUI, shadcn, plain HTML, common class names). Treat the result as a worklist, not a verdict.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

export const ELEMENTS = {
  Accordion: /<Accordion|<details|\baccordion\b/i, Breadcrumbs: /<Breadcrumbs?|breadcrumb/i, Button: /<Button\b|<button\b/, Checkbox: /<Checkbox|type=["']checkbox/,
  'Color picker': /type=["']color|color-?picker/i, Combobox: /<ComboBox|<Combobox|role=["']combobox/, 'Date picker': /<DatePicker|type=["']date/, 'Editable text': /editable|InlineText|contenteditable/i,
  'File upload': /type=["']file|<DropZone|dropzone/i, 'Floating action button': /\bfab\b|floating-action/i, Link: /<Link\b|<a\s[^>]*href/, Pagination: /<Pagination|pagination|load-?more/i,
  'Radio button': /<Radio|type=["']radio/, Rating: /rating|stars?-?input/i, 'Search bar': /<SearchField|type=["']search|search-?bar/i, 'Segmented control': /ToggleButtonGroup|segmented|<ToggleGroup/i,
  Select: /<Select\b|<select\b/, Slider: /<Slider|type=["']range/, Stepper: /stepper|<Stepper/i, Switch: /<Switch\b|role=["']switch/, Tab: /<Tabs|role=["']tab["']/, 'Text field': /<TextField|<Input\b|<input\b|<textarea\b|<TextArea/,
  Tile: /\btile\b|app-tile/i, 'Time picker': /<TimeField|type=["']time/, Badge: /<Badge|\bbadge\b/i, Banner: /<Alert\b|role=["']alert|\bbanner\b/i, Card: /<Card\b|className=["'][^"']*\bcard\b/i,
  Carousel: /carousel|<Carousel/i, Chip: /<Chip\b|\bchip\b/i, Divider: /<Separator|<hr\b|divider/i, Gallery: /gallery/i, 'Grid list': /<GridList|grid-?list/i,
  'Loading indicator': /<Spinner|spinner|loading-?indicator/i, 'Progress indicator': /<ProgressBar|<progress\b|role=["']progressbar|<meter\b/i, 'Side navigation': /<Sidebar|className=["'][^"']*\b(rail|sidebar)\b|side-?nav/i,
  Skeleton: /<Skeleton|skeleton/i, 'Stacked list': /<ListBox|<ul\b|<li\b|role=["']list/, Table: /<Table\b|<table\b/, Toolbar: /<Toolbar|role=["']toolbar/, 'Top navigation bar': /<header\b[^>]*(topbar|navbar)|topbar|<Navbar/i,
  Tree: /<Tree\b|role=["']tree/, 'Coach marks': /coach-?mark|<Tour|onboarding-?tip/i, 'Context menu': /onContextMenu|<ContextMenu/, Dialog: /<Modal|<Dialog|role=["']dialog/, Drawer: /<Drawer|<Sheet\b/,
  'Dropdown menu': /<Dropdown|<DropdownMenu|role=["']menu["']/, 'Full-screen overlay': /fullscreen|\.ws\b|workspace/i, Popover: /<Popover/, Toast: /toast/i, Tooltip: /<Tooltip|title=\{|title=["']/,
  Avatar: /<Avatar|avatar/i, Icon: /phosphor|lucide|<svg\b|<Icon\b/i, Illustration: /illustration|<Portrait|empty-?state|EmptyState/i, 'Command palette': /command-?palette|<Command\b|Palette/i,
};
const STATE_CHECKS = { 'empty states': /empty-?state|EmptyState|keine .* gefunden|no .* yet/i, 'loading states': /skeleton|<Spinner|ProgressBar|loading/i, 'error states': /error|catch\s*\(|errbox|role=["']alert/i, 'undo': /undo|rückgängig/i, 'dark mode': /prefers-color-scheme|data-theme|dark:/i, 'focus-visible': /focus-visible|focus:ring|data-focus/i, 'reduced motion': /prefers-reduced-motion|motion-reduce/i };

function walk(d, out = []) {
  for (const n of readdirSync(d)) {
    if (n === 'node_modules' || n === 'dist' || n.startsWith('.')) continue;
    const p = join(d, n); const s = statSync(p);
    if (s.isDirectory()) walk(p, out); else if (['.jsx', '.tsx', '.js', '.ts', '.vue', '.svelte', '.html', '.css'].includes(extname(n))) out.push(p);
  }
  return out;
}

export function audit(dir) {
  const files = walk(dir); const text = files.map((f) => readFileSync(f, 'utf8')).join('\n');
  const used = {}; const missing = [];
  for (const [name, re] of Object.entries(ELEMENTS)) { const m = text.match(new RegExp(re.source, re.flags + (re.flags.includes('g') ? '' : 'g'))); if (m) used[name] = m.length; else missing.push(name); }
  const states = Object.fromEntries(Object.entries(STATE_CHECKS).map(([k, re]) => [k, re.test(text)]));
  return { files: files.length, used, missing, states };
}

export function toMd(r) {
  const U = Object.entries(r.used).sort((a, b) => b[1] - a[1]);
  return `# Element coverage\n\n${r.files} files scanned (heuristic over source text).\n\n## In use (${U.length})\n${U.map(([k, n]) => `- ${k} (${n})`).join('\n')}\n\n## Not found (${r.missing.length})\nDecide per element: needed for this app (build it), not needed (\`na\` with a reason), or hand-rolled under another name (rename or replace by the HeroUI part).\n${r.missing.map((k) => `- [ ] ${k}`).join('\n')}\n\n## Cross-cutting\n${Object.entries(r.states).map(([k, v]) => `- ${v ? '[x]' : '[ ]'} ${k}`).join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2]; if (!dir) { console.error('usage: node audit-elements.mjs <src-dir> [--json]'); process.exit(2); }
  const r = audit(resolve(dir)); console.log(process.argv.includes('--json') ? JSON.stringify(r, null, 2) : toMd(r));
}
