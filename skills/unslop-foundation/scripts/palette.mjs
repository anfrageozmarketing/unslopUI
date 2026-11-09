#!/usr/bin/env node
// UI palette generator: one seed colour in, a complete, contrast-checked design foundation out.
// Usage: node palette.mjs --seed "#1f5c4d" [--mood calm|bold|warm|cool] [--spark <hue 0-360>] [--name "Product"] [--out ./design]
// Writes tokens.css, palette.json, PALETTE.md, DESIGN.md (agent-facing contract), preview.html. Exits 1 if any contrast check fails.
// Colour maths in OKLCH, contrast per WCAG 2.x. No dependencies.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/* ---------- colour maths ---------- */
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
export function hexToRgb(hex) { const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return null; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
export function hexToOklch(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => lin(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}
function oklchToLinear(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180); const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const inGamut = (rgb) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);
export function oklchToHex(L, C, h) {
  let lo = 0; let hi = C;
  if (!inGamut(oklchToLinear(L, C, h))) { for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; if (inGamut(oklchToLinear(L, mid, h))) lo = mid; else hi = mid; } C = lo; }
  return toHex(oklchToLinear(L, C, h).map((v) => gam(Math.min(1, Math.max(0, v))) * 255));
}
export function luminance(hex) { const [r, g, b] = hexToRgb(hex).map((v) => lin(v / 255)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
export function contrast(a, b) { const x = luminance(a); const y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

/* ---------- palette ---------- */
const MOODS = {
  calm: { nC: 0.009, nShift: 0, accC: 0.9 },
  bold: { nC: 0.004, nShift: 0, accC: 1.15 },
  warm: { nC: 0.014, nShift: 70, accC: 1.0 },
  cool: { nC: 0.01, nShift: 230, accC: 1.0 },
};
// Move lightness from `start` toward `dir` (+1 lighter, -1 darker) until `min` contrast against `against` is met.
function fit(h, C, start, dir, against, min) {
  let L = start;
  const list = Array.isArray(against) ? against : [against];
  for (let i = 0; i < 200; i++) { const hex = oklchToHex(L, C, h); if (list.every((a) => contrast(hex, a) >= min)) return hex; L += dir * 0.005; if (L < 0 || L > 1) break; }
  return oklchToHex(Math.min(1, Math.max(0, L)), C, h);
}
export function buildPalette(seedHex, mood = 'calm', sparkHue = null) {
  const seed = hexToOklch(seedHex); const m = MOODS[mood] || MOODS.calm;
  const h = seed.h; const accC = Math.min(0.2, Math.max(0.06, seed.C * m.accC));
  const nh = m.nShift ? m.nShift : h;
  const STEPS = { 50: 0.975, 100: 0.95, 200: 0.9, 300: 0.83, 400: 0.72, 500: 0.62, 600: 0.52, 700: 0.42, 800: 0.32, 900: 0.24, 950: 0.17 };
  const neutral = {}; const accent = {};
  for (const [k, L] of Object.entries(STEPS)) { neutral[k] = oklchToHex(L, m.nC, nh); accent[k] = oklchToHex(L, accC * (L > 0.9 || L < 0.22 ? 0.35 : 1), h); }
  // Spark = the one contrasting accent. Warm amber/coral against cool seeds, teal-blue against warm seeds. Override with --spark <hue>.
  const warmSeed = h >= 15 && h <= 110;
  const sparkH = sparkHue != null ? sparkHue % 360 : warmSeed ? 215 : mood === 'bold' ? 25 : 58;
  const SEM = { ok: 150, warn: 78, bad: 27, info: 245 };
  const themes = {};
  for (const theme of ['light', 'dark']) {
    const light = theme === 'light';
    const bg = oklchToHex(light ? 0.965 : 0.19, m.nC, nh);
    const surface = oklchToHex(light ? 0.992 : 0.225, m.nC * 0.6, nh);
    const surface2 = oklchToHex(light ? 0.935 : 0.27, m.nC, nh);
    const line = oklchToHex(light ? 0.87 : 0.34, m.nC, nh);
    const shell = oklchToHex(light ? 0.925 : 0.135, m.nC * 1.2, nh); // app shell (rail and context column): darker than the window in dark mode, light gray in light mode
    const win = surface; // the window: clearly lighter/whiter than the shell
    const ink = fit(nh, m.nC, light ? 0.3 : 0.9, light ? -1 : 1, [bg, shell], 12);
    const inkMuted = fit(nh, m.nC, light ? 0.55 : 0.72, light ? -1 : 1, [bg, shell, surface], 5);
    const accentText = fit(h, accC, seed.L, light ? -1 : 1, bg, 4.5);
    const accentFill = fit(h, accC, light ? 0.45 : 0.72, light ? -1 : 1, bg, 4.5);
    const onAccent = [ '#ffffff', ink, bg ].map((c) => [c, contrast(c, accentFill)]).sort((a, b) => b[1] - a[1])[0][0];
    const accentSoft = oklchToHex(light ? 0.93 : 0.27, accC * 0.35, h);
    const spark = oklchToHex(light ? 0.74 : 0.78, Math.min(0.17, accC * 1.1 + 0.03), sparkH);
    const roles = { bg, shell, surface, window: win, 'surface-2': surface2, line, ink, 'ink-muted': inkMuted, accent: accentFill, 'accent-text': accentText, 'on-accent': onAccent, 'accent-soft': accentSoft, spark };
    for (const [k, hue] of Object.entries(SEM)) {
      roles[k] = fit(hue, 0.15, light ? 0.5 : 0.75, light ? -1 : 1, bg, 4.5);
      roles[`${k}-soft`] = oklchToHex(light ? 0.94 : 0.27, 0.04, hue);
    }
    themes[theme] = roles;
  }
  const checks = [];
  for (const [theme, r] of Object.entries(themes)) {
    const add = (name, fg, bgc, min) => checks.push({ theme, name, fg, bg: bgc, min, ratio: Math.round(contrast(r[fg], r[bgc]) * 100) / 100 });
    add('ink on bg', 'ink', 'bg', 7); add('ink on surface', 'ink', 'surface', 7); add('ink on shell', 'ink', 'shell', 7); add('muted on shell', 'ink-muted', 'shell', 4.5); add('muted on bg', 'ink-muted', 'bg', 4.5); add('muted on surface', 'ink-muted', 'surface', 4.5);
    add('accent text on bg', 'accent-text', 'bg', 4.5); add('on-accent on accent', 'on-accent', 'accent', 4.5);
    for (const k of Object.keys(SEM)) { add(`${k} on bg`, k, 'bg', 4.5); add(`${k} on ${k}-soft`, k, `${k}-soft`, 4.5); }
  }
  for (const c of checks) c.pass = c.ratio >= c.min;
  return { seed: seedHex, mood, steps: { neutral, accent }, themes, checks, ok: checks.every((c) => c.pass) };
}

/* ---------- outputs ---------- */
const SHARED = `  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 72px;
  --radius-s: 6px; --radius-m: 12px; --radius-l: 20px; --radius-pill: 999px;
  --ease-out: cubic-bezier(.2,.8,.2,1); --ease-in-out: cubic-bezier(.65,0,.35,1); --dur-1: 120ms; --dur-2: 220ms; --dur-3: 420ms;
  --shadow-1: 0 1px 2px rgb(0 0 0 / .06), 0 4px 12px rgb(0 0 0 / .05); --shadow-2: 0 2px 4px rgb(0 0 0 / .08), 0 16px 40px rgb(0 0 0 / .12);
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;`;
const vars = (r) => Object.entries(r).map(([k, v]) => `  --${k}: ${v};`).join('\n');
export function tokensCss(p) {
  const ramp = (name, o) => Object.entries(o).map(([k, v]) => `  --${name}-${k}: ${v};`).join('\n');
  return `/* Generated by palette.mjs. seed ${p.seed}, mood ${p.mood}. Edit by re-running, not by hand. */
:root {
${vars(p.themes.light)}
${ramp('n', p.steps.neutral)}
${ramp('a', p.steps.accent)}
${SHARED}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${vars(p.themes.dark).replace(/^ {2}/gm, '    ')}
  }
}
:root[data-theme="dark"] {
${vars(p.themes.dark)}
}
@media (prefers-reduced-motion: reduce) { :root { --dur-1: 0ms; --dur-2: 0ms; --dur-3: 0ms; } }
`;
}
export function paletteMd(p) {
  const rows = p.checks.map((c) => `| ${c.theme} | ${c.name} | ${c.ratio} | ${c.min} | ${c.pass ? 'pass' : '**FAIL**'} |`).join('\n');
  const swatch = (r) => Object.entries(r).map(([k, v]) => `| \`--${k}\` | \`${v}\` |`).join('\n');
  return `# UI palette\n\nSeed \`${p.seed}\`, mood \`${p.mood}\`. Generated by \`palette.mjs\`; roles first, ramps second.\n\n## Roles (light)\n\n| Token | Hex |\n|---|---|\n${swatch(p.themes.light)}\n\n## Roles (dark)\n\n| Token | Hex |\n|---|---|\n${swatch(p.themes.dark)}\n\n## Contrast checks (WCAG 2.x)\n\n| Theme | Pair | Ratio | Min | Result |\n|---|---|---|---|---|\n${rows}\n\nUse \`accent\` for fills, \`accent-text\` for text and thin lines, \`spark\` for illustration and motion highlights only (never for text).\n`;
}
export function previewHtml(p) {
  const sw = (r) => Object.entries(r).map(([k, v]) => `<div class="sw"><i style="background:var(--${k})"></i><b>--${k}</b><span data-var="${k}">${v}</span></div>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Palette preview</title>
<style>${tokensCss(p).replace(/\/\*.*?\*\//, '')}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 var(--font-sans);padding:var(--space-6)}
h1{font-size:28px;margin:0 0 var(--space-2)}h2{font-size:13px;color:var(--ink-muted);margin:var(--space-6) 0 var(--space-3);letter-spacing:.04em}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:var(--space-3)}
.sw{display:grid;grid-template-columns:36px 1fr;gap:2px var(--space-3);align-items:center;font-size:12px}.sw i{grid-row:span 2;width:36px;height:36px;border-radius:var(--radius-s);border:1px solid var(--line)}.sw span{color:var(--ink-muted)}
.ramp{display:flex;border-radius:var(--radius-m);overflow:hidden;height:44px}.ramp i{flex:1}
.stage{position:relative;overflow:hidden;border-radius:var(--radius-l);padding:var(--space-7) var(--space-6);background:radial-gradient(circle at 20% 30%,var(--accent) 0 18%,transparent 19%),radial-gradient(circle at 78% 60%,var(--spark) 0 22%,transparent 23%),var(--accent-soft)}
.glass{max-width:420px;padding:var(--space-5);border-radius:var(--radius-m);background:color-mix(in srgb,var(--surface) 62%,transparent);backdrop-filter:blur(16px) saturate(1.4);-webkit-backdrop-filter:blur(16px) saturate(1.4);border:1px solid color-mix(in srgb,var(--surface) 70%,transparent)}
.btn{background:var(--accent);color:var(--on-accent);border:0;border-radius:var(--radius-pill);padding:var(--space-2) var(--space-5);font:600 14px var(--font-sans)}
.row{display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center}.pill{border-radius:var(--radius-pill);padding:2px var(--space-3);font-size:13px;font-weight:600}
button.t{margin-left:auto;background:none;border:1px solid var(--line);color:var(--ink);border-radius:var(--radius-pill);padding:var(--space-1) var(--space-3)}
</style></head><body>
<div class="row"><h1>Palette preview</h1><button class="t" id="theme">Light / Dark</button></div>
<p style="color:var(--ink-muted)">seed ${p.seed} · mood ${p.mood} · all text pairs checked: ${p.ok ? 'pass' : 'FAIL'}</p>
<h2>RAMPS</h2><div class="ramp">${Object.keys(p.steps.neutral).map((k) => `<i style="background:var(--n-${k})"></i>`).join('')}</div><div class="ramp" style="margin-top:8px">${Object.keys(p.steps.accent).map((k) => `<i style="background:var(--a-${k})"></i>`).join('')}</div>
<h2>ROLES</h2><div class="grid">${sw(p.themes.light)}</div>
<h2>SURFACE OVER IMAGERY (one glass layer)</h2><div class="stage"><div class="glass"><b>Glass on a colour field</b><p style="color:var(--ink-muted);margin:6px 0 var(--space-4)">Secondary text stays readable on the blurred layer.</p><div class="row"><button class="btn">Primary</button><span class="pill" style="background:var(--ok-soft);color:var(--ok)">ok</span><span class="pill" style="background:var(--warn-soft);color:var(--warn)">warn</span><span class="pill" style="background:var(--bad-soft);color:var(--bad)">bad</span><span class="pill" style="background:var(--info-soft);color:var(--info)">info</span></div></div></div>
<script>
function sync(){var cs=getComputedStyle(document.documentElement);document.querySelectorAll('[data-var]').forEach(function(e){e.textContent=cs.getPropertyValue('--'+e.dataset.var).trim();});}
document.getElementById('theme').addEventListener('click',function(){var r=document.documentElement;var dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;r.dataset.theme=dark?'light':'dark';sync();});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',sync);sync();
</script>
</body></html>`;
}

const PURPOSE = {
  bg: 'Page background', shell: 'App shell: rail and context column', window: 'The working window inside the shell', surface: 'Cards and raised containers', 'surface-2': 'Nested or lower-emphasis regions', line: 'Borders and quiet dividers',
  ink: 'Primary text', 'ink-muted': 'Supporting text and secondary icons', accent: 'Fills: primary actions, selected states, focus', 'accent-text': 'Accent used as text or thin lines',
  'on-accent': 'Text and icons on an accent fill', 'accent-soft': 'Soft accent backgrounds, hover and selected rows', spark: 'Illustration and motion highlights only, never text',
  ok: 'Positive outcome (text, marker)', 'ok-soft': 'Background for ok', warn: 'Caution (text, marker)', 'warn-soft': 'Background for warn',
  bad: 'Error or destructive (text, marker)', 'bad-soft': 'Background for bad', info: 'Neutral information (text, marker)', 'info-soft': 'Background for info',
};
export function designMd(p, name = 'Product') {
  const rows = Object.keys(p.themes.light).map((k) => `| ${PURPOSE[k] || k} | \`--${k}\` | \`${p.themes.light[k]}\` | \`${p.themes.dark[k]}\` |`).join('\n');
  return `---
name: ${name} design contract
seed: "${p.seed}"
mood: ${p.mood}
modes:
  - light
  - dark
tokens: tokens.css
generated-by: unslop-foundation/scripts/palette.mjs
---

# ${name} design contract

Read this file before building or changing any UI of ${name}. It is the visual contract for people and coding agents. \`tokens.css\` is the source of truth; if this file and \`tokens.css\` disagree, follow \`tokens.css\`.

## Setup

Import \`tokens.css\` once, at the top of the stylesheet. Light is the default. Dark follows the system (\`prefers-color-scheme\`) unless \`data-theme="light"\` or \`data-theme="dark"\` is set on \`<html>\`.

\`\`\`css
@import "./tokens.css";
body { background: var(--bg); color: var(--ink); font-family: var(--font-sans); }
\`\`\`

## Design direction

- Mood: ${p.mood}. Fill in the product's one-line feeling and its world (objects, metaphors) here when the brief is written.
- One accent (\`--accent\`) for primary actions and focus. One spark (\`--spark\`) for illustration and motion highlights. Everything else is neutral.
- Hierarchy comes from content order, spacing, type weight and surface level before borders, shadows or colour.
- Status colours (\`--ok\`, \`--warn\`, \`--bad\`, \`--info\`) carry meaning only, always with a shape or label, never colour alone.
- Read first, edit one step deeper. Prefer direct manipulation over dropdowns and form grids.

## Colors

Use the role tokens, never raw hex. Both modes use the same token names; CSS resolves the value. Do not branch component code by theme.

| Purpose | Token | Light | Dark |
| --- | --- | --- | --- |
${rows}

Neutral ramp \`--n-50\` to \`--n-950\` and accent ramp \`--a-50\` to \`--a-950\` exist for illustration and fine tuning. Text pairs are contrast-checked in \`PALETTE.md\` (ink 7:1, muted and status text 4.5:1).

## Typography

- Sans-serif only: \`--font-sans\`; mono (\`--font-mono\`) for code, ids and paths.
- Headings bold to heavy with slightly negative letter spacing; body regular with a comfortable line height; 55-75 characters per line.
- Tabular numbers for counters, scores and aligned numbers. Sentence case. Avoid all-caps labels except for short conventions.

## Layout and spacing

Spacing scale: \`--space-1\` 4px, \`--space-2\` 8px, \`--space-3\` 12px, \`--space-4\` 16px, \`--space-5\` 24px, \`--space-6\` 32px, \`--space-7\` 48px, \`--space-8\` 72px. Use only these. Group related things with space before adding lines. Do not double parent and child padding.

## Shapes

\`--radius-s\` 6px, \`--radius-m\` 12px, \`--radius-l\` 20px, \`--radius-pill\` 999px. Nested surfaces use a visibly smaller radius than their parent.

## Elevation and glass

- \`--shadow-1\` for raised content, \`--shadow-2\` for floating layers (menus, popovers, dialogs).
- Glass (\`backdrop-filter\` blur with a translucent \`--surface\`) is one deliberate layer over real imagery, never a base style, never glass on glass. Check contrast on the blurred pixels.

## Motion

\`--dur-1\` 120ms (hover, press), \`--dur-2\` 220ms (state change), \`--dur-3\` 420ms (enter, route draw). Easing \`--ease-out\` for entering, \`--ease-in-out\` for moving. One motion idea per component. Animate \`transform\` and \`opacity\`. Reduced motion sets the durations to 0.

## Icons and illustration

Own bold icon set (24px grid, one stroke weight, round caps), see \`icons.md\` if present. Illustrations use ink, accent, spark, accent-soft and paper only, see \`illustration.md\` if present. Never use third-party assets without an entry in \`CREDITS.md\`.

## Components

Core components and their states live in \`components.html\` if present. Build new components from tokens and from those parts. Every interactive element has a visible focus ring (2px, accent), a target of at least 44px on touch, and an accessible name.

## Do

- Use tokens for every colour, space, radius and duration.
- Keep one primary action per context.
- Show active, selected, loading, empty, error and disabled states.
- Respect reduced motion; keep keyboard access and visible focus.

## Don't

- Don't hardcode colours, shadows, radii or spacing.
- Don't use colour alone to show state.
- Don't make static content look interactive.
- Don't separate with borders or hairlines: use space and surface tone. No outlined boxes around every group.
- Don't edit through a grid of labelled form fields with a Save button: edit in place (tap a status, click a text, type and Enter), with Undo.
- Don't explain with paragraphs: short labels, empty states with one picture and one verb.
- Don't use rows of KPI cards, uniform card grids, or tables with controls in cells as the main element.
- Don't add serif fonts, gradient text, glow, emoji as icons, or purple-blue mesh backgrounds.

## Source of truth

\`tokens.css\` (values), \`palette.json\` (roles and contrast results), \`PALETTE.md\` (readable table), \`preview.html\` (swatches).
`;
}

/* ---------- CLI ---------- */
if (process.argv[1] && process.argv[1].endsWith('palette.mjs')) {
  const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
  const seed = arg('seed'); const mood = arg('mood', 'calm'); const out = arg('out', './design');
  if (!seed || !hexToRgb(seed)) { console.error('Usage: node palette.mjs --seed "#rrggbb" [--mood calm|bold|warm|cool] [--out ./design]'); process.exit(1); }
  if (!MOODS[mood]) { console.error(`Unknown mood "${mood}". Use: ${Object.keys(MOODS).join(', ')}`); process.exit(1); }
  const sh = arg('spark'); const sparkHue = sh != null && Number.isFinite(Number(sh)) ? Number(sh) : null;
  const p = buildPalette(seed.startsWith('#') ? seed : `#${seed}`, mood, sparkHue);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'tokens.css'), tokensCss(p)); writeFileSync(join(out, 'palette.json'), JSON.stringify(p, null, 2));
  writeFileSync(join(out, 'PALETTE.md'), paletteMd(p)); writeFileSync(join(out, 'preview.html'), previewHtml(p));
  writeFileSync(join(out, 'DESIGN.md'), designMd(p, arg('name', 'Product')));
  const failed = p.checks.filter((c) => !c.pass);
  console.log(`palette ${p.seed} (${p.mood}): ${p.checks.length - failed.length}/${p.checks.length} contrast checks pass -> ${out}`);
  for (const c of failed) console.log(`  FAIL ${c.theme} ${c.name}: ${c.ratio} < ${c.min}`);
  process.exit(p.ok ? 0 : 1);
}
