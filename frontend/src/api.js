const BASE = import.meta.env.VITE_API_URL || '/api';

let _accessToken = null;

export function setAccessToken(token) {
  _accessToken = token;
}

export function getAccessToken() {
  return _accessToken;
}

function isDebugApiOn() {
  const v = localStorage.getItem('debugApi') ?? import.meta.env.VITE_DEBUG_API ?? '0';
  return v === '1';
}

let _refreshPromise = null;

async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE}/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        _accessToken = null;
        return false;
      }
      const data = await res.json();
      _accessToken = data.access_token;
      return true;
    } catch {
      _accessToken = null;
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

async function request(path, opts = {}, _retry = true) {
  const method = opts.method || 'GET';
  const url = `${BASE}${path}`;
  const log = isDebugApiOn();

  if (log) {
    console.group(`%c[API] >>> REQUEST: %c${method} ${url}`, 'color:#8b5cf6;font-weight:bold', 'color:#6b7280');
    if (opts.body) {
      try { console.log('>>> BODY:', JSON.parse(opts.body)); } catch { console.log('>>> BODY:', opts.body); }
    }
  }

  const headers = { ...opts.headers };
  if (opts.body) headers['Content-Type'] = 'application/json';
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers,
    ...opts,
  });

  let data;
  const contentType = res.headers.get('content-type') || '';
  try {
    data = contentType.includes('application/json') ? await res.json() : {};
  } catch {
    data = { error: res.statusText || 'Invalid response' };
  }

  if (log) {
    console.log(
      `%c[API] <<< RESPONSE: %c${res.status} ${res.statusText}`,
      'color:#059669;font-weight:bold',
      res.ok ? 'color:#059669' : 'color:#dc2626;font-weight:bold',
    );
    console.log('<<< BODY:', data);
    console.groupEnd();
  }

  if (res.status === 401 && _retry && path !== '/refresh' && path !== '/login') {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request(path, opts, false);
    }
  }

  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.code = data.error_code ?? null;
    err.details = data.details ?? null;
    throw err;
  }
  return data;
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export default api;
