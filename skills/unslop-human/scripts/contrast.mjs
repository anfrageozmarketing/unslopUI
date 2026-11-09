#!/usr/bin/env node
// Usage: node contrast.mjs "#ffffff" "#777777"   -> prints the WCAG ratio and verdicts. Exit 1 if normal text fails.
import { contrast, hexToRgb } from '../../unslop-foundation/scripts/palette.mjs';
const [a, b] = process.argv.slice(2).map((x) => (x && !x.startsWith('#') ? `#${x}` : x));
if (!a || !b || !hexToRgb(a) || !hexToRgb(b)) { console.error('Usage: node contrast.mjs "#rrggbb" "#rrggbb"'); process.exit(1); }
const r = contrast(a, b);
const f = (min) => (r >= min ? 'PASS' : 'FAIL');
console.log(`${a} on ${b}: ${r.toFixed(2)}:1`);
console.log(`  normal text (4.5): ${f(4.5)}\n  large text and non-text parts (3.0): ${f(3)}`);
process.exit(r >= 4.5 ? 0 : 1);
