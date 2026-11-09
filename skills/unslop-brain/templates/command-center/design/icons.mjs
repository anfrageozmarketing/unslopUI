/* Command Center icon set (ES module). Own drawing, 24px grid, one stroke weight (2.6), round caps and joins, duotone:
   a soft shape offset by 1.6px behind the line, like a slightly off-register print. Colours come from tokens only.
   l = line path (stroked with currentColor), f = soft shape path (filled with --icon-soft). */
export const ICONS = {
    key:       { l: 'M12 15a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM11 12 20 3M16.5 6.5 19 9M13.5 9.5 15.5 11.5', f: 'M12 15a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z' },
    flag:      { l: 'M6 21V3M6 4h12l-2.6 4.2L18 12H6', f: 'M6 4h12l-2.6 4.2L18 12H6Z' },
    route:     { l: 'M7.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7.5M7.5 19a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM21.5 5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z', f: 'M7.5 19a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM21.5 5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z' },
    sliders:   { l: 'M3 6h8.5M16.5 6H21M3 12h2.5M10.5 12H21M3 18h9.5M17.5 18H21M11.5 6a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0ZM5.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0ZM12.5 18a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0Z', f: 'M11.5 6a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0ZM5.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0ZM12.5 18a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0Z' },
    server:    { l: 'M5 4h14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM5 14h14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2ZM7.5 7h.01M7.5 17h.01', f: 'M5 4h14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z' },
    search:    { l: 'M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM15.5 15.5 20.5 20.5', f: 'M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z' },
    refresh:   { l: 'M20 11a8 8 0 0 0-14.5-4.2M4 5v4h4M4 13a8 8 0 0 0 14.5 4.2M20 19v-4h-4', f: 'M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z' },
    plus:      { l: 'M12 5v14M5 12h14', f: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z' },
    edit:      { l: 'M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1ZM14.5 6.5l3 3', f: 'M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z' },
    archive:   { l: 'M3 6h18v4H3ZM5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9M10 14h4', f: 'M3 6h18v4H3Z' },
    undo:      { l: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11', f: 'M20.5 14.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z' },
    check:     { l: 'M4.5 12.5 9.5 17.5 19.5 6.5', f: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
    close:     { l: 'M6 6l12 12M18 6 6 18', f: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z' },
    alert:     { l: 'M12 4 3 20h18ZM12 10v4M12 17h.01', f: 'M12 4 3 20h18Z' },
    question:  { l: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01', f: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
    bolt:      { l: 'M13 3 5 13.5h6L10 21l8-10.5h-6Z', f: 'M13 3 5 13.5h6L10 21l8-10.5h-6Z' },
    'zoom-in': { l: 'M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM15.5 15.5 20.5 20.5M10.5 8v5M8 10.5h5', f: 'M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z' },
    'zoom-out':{ l: 'M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM15.5 15.5 20.5 20.5M8 10.5h5', f: 'M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z' },
    fit:       { l: 'M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4', f: 'M8 8h8v8H8Z' },
    grid:      { l: 'M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4ZM14 14h6v6h-6Z', f: 'M14 14h6v6h-6Z' },
    'link-out':{ l: 'M14 4h6v6M20 4 11 13M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4', f: 'M4 8a2 2 0 0 1 2-2h5v14H6a2 2 0 0 1-2-2Z' },
    chevron:   { l: 'M9 5l7 7-7 7', f: 'M9 5l7 7-7 7Z' },
    contrast:  { l: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 3v18', f: 'M12 3a9 9 0 0 1 0 18Z' },
  command:   { l: 'M9 9h6v6H9ZM9 9V6.5A2.5 2.5 0 1 0 6.5 9H9ZM15 9V6.5A2.5 2.5 0 1 1 17.5 9H15ZM9 15v2.5A2.5 2.5 0 1 1 6.5 15H9ZM15 15v2.5a2.5 2.5 0 1 0 2.5-2.5H15Z', f: 'M9 9h6v6H9Z' },
};
// aliases for areas and tabs
ICONS.flows = ICONS.route; ICONS.attention = ICONS.bolt; ICONS.findings = ICONS.alert; ICONS.decisions = ICONS.question;
ICONS.access = ICONS.key; ICONS.onboarding = ICONS.flag; ICONS.settings = ICONS.sliders; ICONS.system = ICONS.server;

export function icon(name, opts = {}) {
  const d = ICONS[name]; if (!d) return '';
  const size = Number(opts.size) > 0 ? Number(opts.size) : 24;
  const label = opts.label ? ` role="img" aria-label="${String(opts.label).replace(/[&<>"]/g, '')}"` : ' aria-hidden="true"';
  return `<svg class="ic" viewBox="0 0 24 24" width="${size}" height="${size}"${label} focusable="false"><path class="ic-soft" d="${d.f}" transform="translate(1.6 1.6)"/><path class="ic-line" d="${d.l}"/></svg>`;
}
