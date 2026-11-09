// Replace the text under one "## title" heading (or the text before the first heading when title is null).
export function replaceSection(body, title, md) {
  const lines = body.split('\n'); const isH = (l) => /^##\s+/.test(l);
  if (title == null) {
    const i = lines.findIndex(isH); const head = (i < 0 ? lines : lines.slice(0, i)).join('\n'); const tail = i < 0 ? '' : lines.slice(i).join('\n');
    const m = head.match(/```mermaid[\s\S]*?```/); const diagram = m ? m[0] + '\n\n' : '';
    return diagram + (md.trim() ? md.trim() + '\n\n' : '') + tail;
  }
  const start = lines.findIndex((l) => isH(l) && l.replace(/^##\s+/, '').trim() === title.trim()); if (start < 0) return body;
  let end = lines.findIndex((l, i) => i > start && isH(l)); if (end < 0) end = lines.length;
  return [...lines.slice(0, start + 1), '', md.trim(), '', ...lines.slice(end)].join('\n');
}
