import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let api;
let originalFetch;

beforeEach(async () => {
  originalFetch = globalThis.fetch;
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => '0'),
    setItem: vi.fn(),
  });
  vi.resetModules();
  const mod = await import('../api');
  api = mod.default;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.unstubAllGlobals();
});

function mockFetch(status, body, { contentType = 'application/json', statusText = 'OK' } = {}) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: { get: (h) => (h === 'content-type' ? contentType : null) },
    json: () => Promise.resolve(body),
  });
}

describe('api', () => {
  it('GET returns parsed JSON', async () => {
    mockFetch(200, { ok: true });
    const data = await api.get('/test');
    expect(data).toEqual({ ok: true });
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ credentials: 'include' }));
  });

  it('POST sends JSON body', async () => {
    mockFetch(200, { id: 1 });
    const data = await api.post('/items', { name: 'A' });
    expect(data).toEqual({ id: 1 });
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/items', expect.objectContaining({ method: 'POST', body: '{"name":"A"}' }));
  });

  it('PUT sends JSON body', async () => {
    mockFetch(200, {});
    await api.put('/items/1', { name: 'B' });
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/items/1', expect.objectContaining({ method: 'PUT', body: '{"name":"B"}' }));
  });

  it('DELETE sends request', async () => {
    mockFetch(200, {});
    await api.delete('/items/1');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/items/1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('throws on non-ok response with error message', async () => {
    mockFetch(400, { error: 'Bad request', error_code: 'BAD' }, { statusText: 'Bad Request' });
    await expect(api.get('/fail')).rejects.toThrow('Bad request');
  });

  it('throws with "Request failed" when no error in body', async () => {
    mockFetch(500, {}, { statusText: 'Server Error' });
    await expect(api.get('/fail')).rejects.toThrow('Request failed');
  });

  it('handles null content-type (line 29 || fallback)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      json: () => Promise.resolve({ data: 'test' }),
    });
    const data = await api.get('/null-ct');
    expect(data).toEqual({});
  });

  it('handles JSON parse failure (line 33 catch block)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: { get: () => 'application/json' },
      json: () => Promise.reject(new Error('invalid json')),
    });
    await expect(api.get('/broken-json')).rejects.toThrow('Internal Server Error');
  });

  it('uses "Invalid response" when statusText is also empty in catch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: '',
      headers: { get: () => 'application/json' },
      json: () => Promise.reject(new Error('bad')),
    });
    await expect(api.get('/broken')).rejects.toThrow('Invalid response');
  });

  it('attaches error_code and details from response', async () => {
    mockFetch(422, { error: 'Validation failed', error_code: 'VALIDATION', details: ['field required'] }, { statusText: 'Unprocessable' });
    try {
      await api.get('/validate');
    } catch (err) {
      expect(err.message).toBe('Validation failed');
      expect(err.code).toBe('VALIDATION');
      expect(err.details).toEqual(['field required']);
    }
  });

  it('logs to console when debugApi is enabled', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => '1'),
      setItem: vi.fn(),
    });
    vi.resetModules();
    const mod = await import('../api');
    const debugApi = mod.default;

    const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

    mockFetch(200, { ok: true });
    await debugApi.post('/test', { a: 1 });

    expect(groupSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
    expect(groupEndSpy).toHaveBeenCalled();

    groupSpy.mockRestore();
    logSpy.mockRestore();
    groupEndSpy.mockRestore();
  });
});
