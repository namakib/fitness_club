const BASE = '/api';

async function request(path, opts = {}) {
  const method = opts.method || 'GET';
  const url = `${BASE}${path}`;

  console.group(`%c${method} %c${url}`, 'color:#8b5cf6;font-weight:bold', 'color:#6b7280');

  if (opts.body) {
    console.log('%cRequest Body', 'color:#2563eb;font-weight:bold');
    try { console.log(JSON.parse(opts.body)); } catch { console.log(opts.body); }
  }

  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });

  const data = await res.json();

  console.log(
    `%cResponse %c${res.status} ${res.statusText}`,
    'color:#059669;font-weight:bold',
    res.ok ? 'color:#059669' : 'color:#dc2626;font-weight:bold',
  );

  console.log('%cHeaders', 'color:#9ca3af;font-weight:bold');
  const headers = {};
  res.headers.forEach((v, k) => { headers[k] = v; });
  console.table(headers);

  console.log('%cBody', 'color:#059669;font-weight:bold');
  console.log(data);

  console.groupEnd();

  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export default api;
