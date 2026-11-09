/* Command Center illustrations. Own drawing from the product's objects (routes, nodes, flags).
   Palette: ink, accent, accent-soft, spark, surface, bad. Flat fills, thick lines, no gradients, no glow.
   Every function returns an inline SVG string made of numbers and token colours only. No user text ever enters the markup.
   Browser: globalThis.CC_ART. Node: module.exports. */
(function () {
  var INK = 'var(--ink)'; var ACC = 'var(--accent)'; var SOFT = 'var(--accent-soft)'; var SPARK = 'var(--spark)';
  var PAPER = 'var(--surface)'; var PAPER2 = 'var(--surface-2)'; var BAD = 'var(--bad)'; var LINE = 'var(--line)';
  function svg(w, h, body, label) {
    return '<svg class="art" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + label + '" focusable="false">' + body + '</svg>';
  }
  var node = function (x, y, r, fill, ring) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + (ring ? ' stroke="' + ring + '" stroke-width="6"' : '') + '/>'; };
  var route = function (d, color, dash, w) { return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + (w || 8) + '" stroke-linecap="round" stroke-linejoin="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' pathLength="1"/>'; };

  var art = {
    // Empty list of flows: an open route, the middle step still missing.
    emptyFlows: function () {
      return svg(320, 240,
        '<rect x="34" y="40" width="252" height="168" rx="28" fill="' + SOFT + '"/>' +
        '<rect x="22" y="28" width="252" height="168" rx="28" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="6"/>' +
        route('M62 150C108 150 108 96 156 96S214 78 246 78', INK, null, 8) +
        node(62, 150, 15, ACC) +
        '<circle cx="156" cy="96" r="15" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="6" stroke-dasharray="7 7"/>' +
        node(246, 78, 15, SPARK) +
        '<path d="M246 62V40l26 8-26 8" fill="' + ACC + '" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>' +
        '<rect x="92" y="170" width="70" height="10" rx="5" fill="' + LINE + '"/><rect x="172" y="170" width="40" height="10" rx="5" fill="' + LINE + '"/>',
        'Ein Ablauf mit fehlendem Schritt');
    },
    // Nothing to fix: a lens with a check.
    emptyFindings: function () {
      return svg(320, 240,
        '<rect x="60" y="48" width="200" height="150" rx="28" fill="' + SOFT + '"/>' +
        '<circle cx="150" cy="112" r="56" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="10"/>' +
        '<path d="M192 154 236 198" stroke="' + INK + '" stroke-width="16" stroke-linecap="round"/>' +
        '<path d="M124 112 142 130 178 92" fill="none" stroke="' + ACC + '" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="250" cy="60" r="14" fill="' + SPARK + '"/><rect x="48" y="170" width="34" height="12" rx="6" fill="' + ACC + '"/>',
        'Keine offenen Befunde');
    },
    // No open decision: a fork with a question node.
    emptyDecisions: function () {
      return svg(320, 240,
        '<rect x="40" y="52" width="240" height="140" rx="28" fill="' + SOFT + '"/>' +
        route('M70 122H128', INK, null, 8) + route('M128 122C160 122 160 78 196 78H250', INK, null, 8) + route('M128 122C160 122 160 166 196 166H250', INK, null, 8) +
        node(70, 122, 14, ACC) +
        '<circle cx="128" cy="122" r="26" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="7"/>' +
        '<path d="M120 114a8 8 0 1 1 11 7c-3 2-3 4-3 6M128 137h.01" fill="none" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/>' +
        '<rect x="248" y="62" width="28" height="32" rx="9" fill="' + SPARK + '" stroke="' + INK + '" stroke-width="5"/><rect x="248" y="150" width="28" height="32" rx="9" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="5"/>',
        'Keine offene Entscheidung');
    },
    // Everything built: the route closed, nodes filled, a check badge.
    success: function () {
      return svg(320, 240,
        '<rect x="46" y="60" width="228" height="130" rx="28" fill="' + SOFT + '"/>' +
        route('M66 126C112 126 112 90 160 90S214 112 254 112', ACC, null, 10) +
        node(66, 126, 15, ACC, INK) + node(160, 90, 15, ACC, INK) + node(254, 112, 15, ACC, INK) +
        '<circle cx="236" cy="62" r="26" fill="' + SPARK + '" stroke="' + INK + '" stroke-width="6"/><path d="M224 62 233 71 249 53" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<rect x="62" y="156" width="46" height="10" rx="5" fill="' + ACC + '"/><rect x="118" y="156" width="26" height="10" rx="5" fill="' + LINE + '"/>',
        'Alles umgesetzt');
    },
    // Something broke: the route has a gap, the loose end is marked.
    error: function () {
      return svg(320, 240,
        '<rect x="46" y="60" width="228" height="130" rx="28" fill="' + SOFT + '"/>' +
        route('M66 134C94 134 98 108 124 108', INK, null, 9) + route('M196 108C222 108 232 134 256 134', INK, '0.05 0.06', 9) +
        node(66, 134, 15, ACC) + node(256, 134, 15, PAPER, INK) +
        '<circle cx="158" cy="108" r="20" fill="' + PAPER + '" stroke="' + BAD + '" stroke-width="7"/><path d="M158 98v12M158 118h.01" fill="none" stroke="' + BAD + '" stroke-width="7" stroke-linecap="round"/>' +
        '<rect x="84" y="156" width="60" height="10" rx="5" fill="' + LINE + '"/>',
        'Etwas ist schiefgelaufen');
    },
    // First app: a stack of cards with a plus.
    firstApp: function () {
      return svg(320, 240,
        '<rect x="70" y="58" width="190" height="130" rx="26" fill="' + SOFT + '"/>' +
        '<rect x="56" y="44" width="190" height="130" rx="26" fill="' + PAPER2 + '" stroke="' + INK + '" stroke-width="6"/>' +
        '<rect x="42" y="30" width="190" height="130" rx="26" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="6"/>' +
        '<circle cx="137" cy="95" r="30" fill="' + ACC + '"/><path d="M137 79v32M121 95h32" stroke="var(--on-accent)" stroke-width="9" stroke-linecap="round"/>' +
        '<circle cx="250" cy="52" r="13" fill="' + SPARK + '"/><rect x="64" y="132" width="52" height="10" rx="5" fill="' + LINE + '"/>',
        'Lege deine erste App an');
    },
  };

  // Deterministic generative portrait of an app: its flows as a bold constellation. Numbers only, no text from data.
  var STATUS_OK = { missing: 1, partial: 1, exists: 1, built: 1, na: 1 };
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function portrait(model, opts) {
    var o = opts || {}; var W = o.width || 960; var H = o.height || 280;
    var flows = (model && model.flows) || []; var r = rng(hash(model && model.seed));
    var areas = []; flows.forEach(function (f) { var a = String(f.area); if (areas.indexOf(a) < 0) areas.push(a); });
    var body = '';
    // big colour fields (real shapes, moderate opacity)
    var cx = Math.round(W * (0.62 + r() * 0.2)); var cy = Math.round(H * (0.1 + r() * 0.5)); var R = Math.round(H * (0.62 + r() * 0.25));
    body += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="' + SPARK + '" opacity="0.28"/>';
    body += '<circle cx="' + Math.round(W * (0.12 + r() * 0.2)) + '" cy="' + Math.round(H * (0.8 + r() * 0.3)) + '" r="' + Math.round(H * (0.7 + r() * 0.3)) + '" fill="' + ACC + '" opacity="0.2"/>';
    body += '<path d="M0 ' + Math.round(H * 0.78) + 'C' + Math.round(W * 0.25) + ' ' + Math.round(H * (0.55 + r() * 0.2)) + ' ' + Math.round(W * 0.55) + ' ' + Math.round(H * (0.95 + r() * 0.1)) + ' ' + W + ' ' + Math.round(H * 0.62) + 'V' + H + 'H0Z" fill="' + ACC + '" opacity="0.14"/>';
    var lanes = Math.max(1, areas.length); var pad = 56;
    areas.forEach(function (area, li) {
      var items = flows.filter(function (f) { return String(f.area) === area; });
      var y0 = pad + ((H - pad * 2) * (li + 0.5)) / lanes;
      var pts = items.map(function (f, i) { return { x: pad + 40 + ((W - pad * 2 - 80) * (i + 0.5 + r() * 0.2)) / Math.max(1, items.length), y: y0 + (r() - 0.5) * 34, f: f }; });
      if (pts.length > 1) { var d = 'M' + Math.round(pts[0].x) + ' ' + Math.round(pts[0].y); for (var k = 1; k < pts.length; k++) { var a = pts[k - 1]; var b = pts[k]; var mx = (a.x + b.x) / 2; d += 'C' + Math.round(mx) + ' ' + Math.round(a.y) + ' ' + Math.round(mx) + ' ' + Math.round(b.y) + ' ' + Math.round(b.x) + ' ' + Math.round(b.y); } body += route(d, INK, null, 6).replace(' pathLength="1"', ''); }
      pts.forEach(function (p) {
        var st = STATUS_OK[p.f.status] ? p.f.status : 'missing';
        var rad = p.f.prio === 'MVP' ? 17 : p.f.prio === 'V2' ? 9 : 13;
        var fill = st === 'built' ? ACC : st === 'exists' ? 'var(--ok)' : st === 'partial' ? SPARK : PAPER;
        body += '<circle cx="' + Math.round(p.x) + '" cy="' + Math.round(p.y) + '" r="' + rad + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="5"' + (st === 'missing' ? ' stroke-dasharray="6 5"' : st === 'na' ? ' stroke-dasharray="2 5" opacity="0.6"' : '') + '/>';
      });
    });
    return '<svg class="portrait" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + body + '</svg>';
  }
  var api = { art: art, portrait: portrait };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { globalThis.CC_ART = art; globalThis.CC_PORTRAIT = portrait; }
})();
