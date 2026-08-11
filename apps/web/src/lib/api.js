let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

async function rawRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const res = await fetch(path, { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || res.statusText);
    err.status = res.status;
    err.code = data?.code;
    err.sql = data?.sql;
    throw err;
  }
  return data;
}

/**
 * Wraps rawRequest with one silent retry: on a 401, attempt a refresh
 * (the httpOnly cookie carries the refresh token) and replay the request.
 */
async function request(path, options = {}) {
  try {
    return await rawRequest(path, options);
  } catch (err) {
    if (err.status !== 401 || path.startsWith('/api/auth/')) throw err;
    const refreshed = await tryRefresh();
    if (!refreshed) {
      window.dispatchEvent(new Event('ql:logout'));
      throw err;
    }
    return rawRequest(path, options);
  }
}

export async function tryRefresh() {
  try {
    const data = await rawRequest('/api/auth/refresh', { method: 'POST' });
    setAccessToken(data.accessToken);
    return data.user;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export const api = {
  register: (body) => rawRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => rawRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => rawRequest('/api/auth/logout', { method: 'POST' }),

  listSources: () => request('/api/data-sources'),
  createSource: (body) =>
    request('/api/data-sources', { method: 'POST', body: JSON.stringify(body) }),
  deleteSource: (id) => request(`/api/data-sources/${id}`, { method: 'DELETE' }),
  introspect: (id) => request(`/api/data-sources/${id}/introspect`, { method: 'POST' }),
  getSchema: (id) => request(`/api/data-sources/${id}/schema`),
  ask: (body) => request('/api/ask', { method: 'POST', body: JSON.stringify(body) }),
  run: (body) => request('/api/run', { method: 'POST', body: JSON.stringify(body) }),
};
