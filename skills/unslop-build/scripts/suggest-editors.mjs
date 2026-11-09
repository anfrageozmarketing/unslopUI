#!/usr/bin/env node
// Suggests where an interactive editor (node editor, canvas, board, timeline, tree, ...) fits, from signals in code, schemas and notes.
// Usage: node suggest-editors.mjs <dir-or-file> [--json]
// Heuristic: it counts field/word signals per editor type and lists evidence (file:line). Treat it as a prompt for a decision, not a verdict.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

export const EDITORS = {
  'Node editor': { re: /\b(next_?step|nextStep|edges?|nodes?|from_?node|to_?node|source_?id|target_?id|workflow|pipeline|automation|branch|condition|trigger|steps?)\b|flowchart|-->/i, need: 3, why: 'steps, branches or connections between things' },
  'Canvas / whiteboard': { re: /\b(pos_?x|pos_?y|x_?pos|y_?pos|canvas|whiteboard|mind-?map|floor-?plan|layers?|z_?index)\b|\bposition\s*[:=]\s*\{/i, need: 3, why: 'objects with free 2D positions' },
  Board: { re: /\b(kanban|swimlane|columns?|stages?|status|state)\b.*\b(todo|doing|done|open|closed|backlog|lead|won|lost|fixed)\b|\bboard\b/i, need: 2, why: 'items that move between states' },
  'Timeline / calendar': { re: /\b(start_?(at|date|time)|end_?(at|date|time)|due_?(at|date)|deadline|duration|milestone|schedule[sd]?|calendar|recurr\w*|gantt)\b/i, need: 3, why: 'things planned over time' },
  'Tree / outline': { re: /\b(parent_?id|children|child|tree|outline|folder|hierarchy|nested|sub_?categor\w*|depth)\b/i, need: 3, why: 'a hierarchy that people restructure' },
  'Reorderable list': { re: /\b(order|rank|sort_?order|ordinal|sequence|priority)\b\s*[:=,)]|\bdrag\b|\breorder\b/i, need: 2, why: 'a manually ordered list' },
  'Proportional editor': { re: /\b(percent\w*|budget|allocation|weight|share|quota|split)\b/i, need: 3, why: 'parts of a whole that must add up' },
  'Rule builder': { re: /\b(rule[sd]?|if_?then|segment|filter_?rule|conditions?|predicate|criteria|trigger)\b/i, need: 3, why: 'rules with conditions and actions' },
  'Compare view': { re: /\b(option[s]?|variants?|plans?|alternatives?|pros|cons|decision|trade-?off)\b/i, need: 3, why: 'choices with trade-offs' },
  'Matrix / relation map': { re: /\b(tags?|many_?to_?many|relations?|members?|links?|permission[s]?|roles?|access)\b/i, need: 4, why: 'many-to-many relations or permissions' },
  'Map editor': { re: /\b(lat(itude)?|lng|lon(gitude)?|geo|geojson|polygon|zone|route|coordinates?)\b/i, need: 2, why: 'places and areas' },
  'Layout builder': { re: /\b(blocks?|sections?|templates?|layout|widgets?|grid_?area|page_?builder)\b/i, need: 4, why: 'pages or dashboards assembled from parts' },
  'Inline-editable table': { re: /\b(import|export|csv|bulk|columns?|rows?|spreadsheet|table)\b/i, need: 4, why: 'many records of the same shape edited in bulk' },
  'Triage view': { re: /\b(inbox|queue|review|approve|reject|moderat\w*|triage|backlog)\b/i, need: 3, why: 'a queue where each item needs a verdict' },
};

const EXT = ['.js', '.jsx', '.ts', '.tsx', '.py', '.sql', '.prisma', '.json', '.yaml', '.yml', '.md', '.graphql', '.rb', '.go', '.php', '.vue', '.svelte'];
function walk(p, out = []) {
  const s = statSync(p);
  if (s.isFile()) { if (EXT.includes(extname(p))) out.push(p); return out; }
  for (const n of readdirSync(p)) { if (['node_modules', 'dist', 'build', '.git', '.next', 'venv', '__pycache__'].includes(n) || n.startsWith('.')) continue; walk(join(p, n), out); }
  return out;
}

export function suggest(target) {
  const files = walk(resolve(target)); const res = {};
  for (const [name, d] of Object.entries(EDITORS)) res[name] = { count: 0, decl: 0, files: new Set(), evidence: [], ...d };
  const isDecl = (l) => /^\s*(class\s|interface\s|type\s|model\s|CREATE\s+TABLE|@dataclass|[A-Za-z_]+\s*[:=]\s*(Column|Field|models\.|str\b|int\b|float\b|bool\b|List|Optional|string\b|number\b))|^\s*\w+\s+(TEXT|INTEGER|REAL|VARCHAR|BOOLEAN|TIMESTAMP)\b/i.test(l);
  for (const f of files) {
    let text; try { text = readFileSync(f, 'utf8'); } catch { continue; } if (text.length > 400000) continue;
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) for (const [name, d] of Object.entries(EDITORS)) {
      if (d.re.test(lines[i])) { const r = res[name]; r.count++; r.files.add(f); if (isDecl(lines[i])) r.decl++; if (r.evidence.length < 4 && (isDecl(lines[i]) || r.evidence.length < 2)) r.evidence.push(`${f.replace(resolve(target) + '/', '')}:${i + 1}${isDecl(lines[i]) ? ' (declared)' : ''}`); }
    }
  }
  return Object.entries(res).map(([name, r]) => ({ name, count: r.count, why: r.why, evidence: r.evidence, declared: r.decl, files: r.files.size, fit: r.decl >= r.need && r.files.size >= 2 ? 'strong' : r.decl >= 1 || r.count >= r.need * 8 ? 'possible' : 'no' })).filter((x) => x.fit !== 'no').sort((a, b) => b.count - a.count);
}

export function toMd(list) {
  if (!list.length) return '# Interactive editors\n\nNo strong signals. Lists with click-to-edit rows are enough for now.\n';
  return `# Interactive editors: where one could fit\n\nHeuristic over names and words in the code. For each: answer the three questions in \`references/interactive-patterns.md\` (is the structure the value, edited often, risk of being wrong).\n\n${list.map((x) => `## ${x.name} (${x.fit})\n- Why: ${x.why}\n- Signals: ${x.count} in ${x.files} files, ${x.declared} in declarations (fields, columns, types)\n- Evidence: ${x.evidence.join(', ')}\n`).join('\n')}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = process.argv[2]; if (!t) { console.error('usage: node suggest-editors.mjs <dir-or-file> [--json]'); process.exit(2); }
  const r = suggest(t); console.log(process.argv.includes('--json') ? JSON.stringify(r, null, 2) : toMd(r));
}
