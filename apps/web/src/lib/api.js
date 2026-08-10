async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || res.statusText);
    err.code = data?.code;
    err.sql = data?.sql;
    throw err;
  }
  return data;
}

export const api = {
  listSources: () => request('/api/data-sources'),
  createSource: (body) =>
    request('/api/data-sources', { method: 'POST', body: JSON.stringify(body) }),
  deleteSource: (id) => request(`/api/data-sources/${id}`, { method: 'DELETE' }),
  introspect: (id) => request(`/api/data-sources/${id}/introspect`, { method: 'POST' }),
  getSchema: (id) => request(`/api/data-sources/${id}/schema`),
  ask: (body) => request('/api/ask', { method: 'POST', body: JSON.stringify(body) }),
  run: (body) => request('/api/run', { method: 'POST', body: JSON.stringify(body) }),
};
