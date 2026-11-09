#!/usr/bin/env node
// One command: opens routes in a real browser, takes screenshots (light/dark x widths) and measures typical rendering defects.
// Needs: playwright-core (npm i -D playwright-core) and a Chrome/Chromium (system Chrome is used by default).
// Scenarios (--scenarios file.json): click through the app and assert behaviour, e.g. that a theme choice survives a reload.
// Usage: node verify.mjs --url http://127.0.0.1:3000 --routes "/,/login,/settings" --out verify-out [--widths 1280,360] [--themes light,dark] [--auth user:pass]
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a), []));
if (!args.url) { console.error('usage: node verify.mjs --url <base> --routes "/a,/b" --out <dir> [--widths 1280,360] [--themes light,dark] [--auth user:pass]'); process.exit(2); }

// Runs inside the page. Returns a list of defects.
export function inspect() {
  const out = [];
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const name = (e) => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '')).slice(0, 60);
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 1) out.push({ kind: 'overflow-x', msg: `page scrolls sideways (${de.scrollWidth} > ${de.clientWidth})` });
  for (const e of document.querySelectorAll('[role="progressbar"], progress, meter, [class*="progress" i], [class*="meter" i]')) {
    if (!vis(e)) continue; const r = e.getBoundingClientRect();
    if (r.height < 4) out.push({ kind: 'progress-thin', msg: `${name(e)} is only ${r.height.toFixed(1)}px tall` });
    const fill = e.firstElementChild; const val = e.getAttribute('aria-valuenow');
    if (fill && val && Number(val) > 0) { const fr = fill.getBoundingClientRect(); if (fr.width < 2) out.push({ kind: 'progress-empty', msg: `${name(e)} value ${val} but fill is ${fr.width.toFixed(1)}px` }); if (fr.width > r.width + 1) out.push({ kind: 'progress-over', msg: `${name(e)} fill wider than track` }); }
    if (e.getAttribute('role') === 'progressbar' && val === null && !e.hasAttribute('aria-busy')) out.push({ kind: 'progress-a11y', msg: `${name(e)} has no aria-valuenow` });
  }
  for (const e of document.querySelectorAll('h1,h2,h3,p,span,a,button,label,li,div')) {
    if (!vis(e) || e.children.length > 3) continue; const t = (e.textContent || '').trim(); if (!t) continue;
    const cs = getComputedStyle(e);
    if (e.scrollWidth > e.clientWidth + 2 && cs.overflowX !== 'visible' && cs.overflowX !== 'auto' && cs.overflowX !== 'scroll' && cs.textOverflow !== 'ellipsis') out.push({ kind: 'clipped-text', msg: `${name(e)} clips "${t.slice(0, 40)}"` });
  }
  for (const e of document.querySelectorAll('img')) if (vis(e) && (!e.complete || e.naturalWidth === 0)) out.push({ kind: 'broken-image', msg: name(e) });
  const small = innerWidth <= 480;
  for (const e of document.querySelectorAll('button, a[href], [role="button"], input, select, textarea, [role="tab"]')) {
    if (!vis(e)) continue; const r = e.getBoundingClientRect();
    if (small && (r.width < 40 || r.height < 40)) out.push({ kind: 'tap-target', msg: `${name(e)} is ${Math.round(r.width)}x${Math.round(r.height)}px (min 44)` });
    if (!e.disabled && getComputedStyle(e).cursor === 'auto' && !small && e.tagName !== 'INPUT' && e.tagName !== 'TEXTAREA') out.push({ kind: 'cursor', msg: `${name(e)} is clickable but cursor is not pointer` });
    const lbl = (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || '').trim();
    if (!lbl && e.tagName !== 'INPUT') out.push({ kind: 'no-name', msg: `${name(e)} has no accessible name` });
  }
  const els = [...document.querySelectorAll('a,button,[role="button"],.node,.card')].filter(vis).slice(0, 400);
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    const a = els[i], b = els[j]; if (a.contains(b) || b.contains(a)) continue;
    if (getComputedStyle(a).position === 'fixed' || getComputedStyle(b).position === 'fixed') continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (w > 8 && h > 8 && (w * h) / Math.min(ra.width * ra.height, rb.width * rb.height) > 0.25) { out.push({ kind: 'overlap', msg: `${name(a)} overlaps ${name(b)}` }); if (out.length > 60) return out; }
  }
  return out;
}


// Scenario steps: {goto}, {click: selector|"text=Label"}, {fill: [selector, value]}, {press: key}, {reload: true}, {wait: ms}, {emulate: "dark"|"light"}
// Expectations: {attr: [selector, name, value]}, {visible: sel}, {hidden: sel}, {text: str}, {count: [sel, n]}, {storage: [key, value]}, {url: substring}, {noOverflow: true}
export async function runScenario(page, base, sc) {
  const fails = [];
  const loc = (s) => page.locator(s).first();
  await page.goto(base.replace(/\/$/, '') + (sc.route ?? '/'), { waitUntil: 'networkidle' });
  for (const st of sc.steps ?? []) {
    if (st.goto) await page.goto(base.replace(/\/$/, '') + st.goto, { waitUntil: 'networkidle' });
    else if (st.click) await loc(st.click).click({ timeout: 5000 });
    else if (st.fill) await loc(st.fill[0]).fill(st.fill[1]);
    else if (st.press) await page.keyboard.press(st.press);
    else if (st.reload) await page.reload({ waitUntil: 'networkidle' });
    else if (st.wait) await page.waitForTimeout(st.wait);
    else if (st.emulate) await page.emulateMedia({ colorScheme: st.emulate });
  }
  for (const ex of sc.expect ?? []) {
    let ok = false, got = '';
    if (ex.attr) { got = await loc(ex.attr[0]).getAttribute(ex.attr[1]); ok = got === ex.attr[2]; }
    else if (ex.visible) { ok = await loc(ex.visible).isVisible(); got = ok ? 'visible' : 'not visible'; }
    else if (ex.hidden) { ok = !(await loc(ex.hidden).isVisible()); got = ok ? 'hidden' : 'visible'; }
    else if (ex.text) { const t = await page.locator('body').innerText(); ok = t.includes(ex.text); got = ok ? 'found' : 'text not on page'; }
    else if (ex.count) { got = String(await page.locator(ex.count[0]).count()); ok = got === String(ex.count[1]); }
    else if (ex.storage) { got = await page.evaluate((k) => localStorage.getItem(k), ex.storage[0]); ok = got === ex.storage[1]; }
    else if (ex.url) { got = page.url(); ok = got.includes(ex.url); }
    else if (ex.noOverflow) { ok = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1); got = ok ? 'fits' : 'scrolls sideways'; }
    if (!ok) fails.push({ expect: ex, got });
  }
  return fails;
}

async function main() {
  let pw; try { pw = await import('playwright-core'); } catch { console.error('Missing playwright-core. Run: npm i -D playwright-core'); process.exit(2); }
  const out = resolve(args.out ?? 'verify-out'); mkdirSync(out, { recursive: true });
  const widths = (args.widths ?? '1280,360').split(',').map(Number), themes = (args.themes ?? 'light,dark').split(',');
  const routes = (args.routes ?? '/').split(',');
  const exe = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => { try { return existsSync(p); } catch { return false; } });
  const browser = await pw.chromium.launch(exe ? { executablePath: exe } : { channel: 'chrome' });
  const lines = []; let defects = 0; const consoleErr = [];
  for (const theme of themes) for (const width of widths) {
    const ctx = await browser.newContext({ viewport: { width, height: width > 600 ? 900 : 800 }, colorScheme: theme, httpCredentials: args.auth ? { username: args.auth.split(':')[0], password: args.auth.split(':').slice(1).join(':') } : undefined });
    const page = await ctx.newPage(); page.on('console', (m) => m.type() === 'error' && consoleErr.push(m.text())); page.on('pageerror', (e) => consoleErr.push(String(e)));
    for (const r of routes) {
      const slug = (r.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home');
      try { await page.goto(args.url.replace(/\/$/, '') + r, { waitUntil: 'networkidle', timeout: 20000 }); } catch (e) { lines.push(`- ${r} ${width} ${theme}: LOAD FAILED ${e.message}`); defects++; continue; }
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(out, `${slug}-${width}-${theme}.png`), fullPage: true });
      const found = await page.evaluate(inspect); defects += found.length;
      lines.push(`### ${r} · ${width}px · ${theme} · ${found.length ? found.length + ' findings' : 'clean'}`);
      for (const f of found.slice(0, 25)) lines.push(`- **${f.kind}**: ${f.msg}`);
    }
    await ctx.close();
  }
  const scLines = []; let scFail = 0;
  if (args.scenarios) {
    const list = JSON.parse(readFileSync(resolve(args.scenarios), 'utf8'));
    for (const sc of list) {
      const ctx = await browser.newContext({ viewport: { width: sc.width ?? 1280, height: 900 }, colorScheme: sc.scheme ?? 'light', httpCredentials: args.auth ? { username: args.auth.split(':')[0], password: args.auth.split(':').slice(1).join(':') } : undefined });
      const page = await ctx.newPage(); page.on('pageerror', (e) => consoleErr.push(String(e)));
      let fails; try { fails = await runScenario(page, args.url, sc); } catch (e) { fails = [{ expect: 'steps', got: e.message.split('\n')[0] }]; }
      await page.screenshot({ path: join(out, `scenario-${(sc.name || 'x').replace(/[^a-z0-9]+/gi, '-')}.png`) });
      scFail += fails.length;
      scLines.push(`- ${fails.length ? 'FAIL' : 'ok'} **${sc.name}**${fails.map((f) => `\n  - expected ${JSON.stringify(f.expect)}, got ${JSON.stringify(f.got)}`).join('')}`);
      await ctx.close();
    }
  }
  await browser.close();
  const uniq = [...new Set(consoleErr)];
  const md = `# Verify report\n\nURL ${args.url} · routes ${routes.join(', ')} · widths ${widths.join(', ')} · themes ${themes.join(', ')}\n\n${lines.join('\n')}\n\n## Scenarios\n${scLines.length ? scLines.join('\n') : 'none run'}\n\n## Console errors\n${uniq.length ? uniq.map((x) => '- ' + x.slice(0, 200)).join('\n') : 'none'}\n\n## Not covered\nContrast of text on images, motion, keyboard flow and whether it looks good. A person or the designing agent must look at the screenshots.\n`;
  writeFileSync(join(out, 'REPORT.md'), md);
  console.log(`${out}/REPORT.md: ${defects} findings, ${scFail} scenario failures, ${uniq.length} console errors`);
  process.exit(defects || scFail || uniq.length ? 1 : 0);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
