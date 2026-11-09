// Thin client for the Command Center API. State-changing calls carry the custom header and JSON.
async function call(path, opts = {}) {
  const r = await fetch(path, { headers: { 'x-requested-with': 'command-center', ...(opts.body ? { 'content-type': 'application/json' } : {}) }, ...opts });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Fehler ${r.status}`);
  return r.json();
}
const body = (o) => JSON.stringify(o);
export const api = {
  index: () => call('/api/index'),
  note: (path) => call(`/api/note?path=${encodeURIComponent(path)}`),
  patch: (path, field, value) => call('/api/note', { method: 'PATCH', body: body({ path, field, value }) }),
  putBody: (path, text) => call('/api/note', { method: 'PUT', body: body({ path, body: text }) }),
  archive: (path) => call('/api/note', { method: 'DELETE', body: body({ path }) }),
  create: (kind, payload) => call(`/api/${kind}`, { method: 'POST', body: body(payload) }),
};
