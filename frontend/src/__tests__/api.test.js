import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from '../api';

describe('api module', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.localStorage.getItem.mockReturnValue('0');
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  it('GET request builds correct URL and uses credentials', async () => {
    fetch.mockResolvedValueOnce({
      ok: true, headers: { get: () => 'application/json' },
      json: async () => ({ ok: true }),
    });
    const data = await api.get('/member/profile');
    expect(fetch).toHaveBeenCalledWith('/api/member/profile', expect.objectContaining({ credentials: 'include' }));
    expect(data).toEqual({ ok: true });
  });

  it('POST sends JSON body with Content-Type header', async () => {
    fetch.mockResolvedValueOnce({
      ok: true, headers: { get: () => 'application/json' },
      json: async () => ({ created: true }),
    });
    await api.post('/login', { email: 'a@b.com', password: '123' });
    const call = fetch.mock.calls[0];
    expect(call[1].method).toBe('POST');
    expect(call[1].body).toBe(JSON.stringify({ email: 'a@b.com', password: '123' }));
  });

  it('GET does not set Content-Type header', async () => {
    fetch.mockResolvedValueOnce({
      ok: true, headers: { get: () => 'application/json' },
      json: async () => ({}),
    });
    await api.get('/test');
    expect(fetch.mock.calls[0][1].headers['Content-Type']).toBeUndefined();
  });

  it('PUT sends correct method', async () => {
    fetch.mockResolvedValueOnce({
      ok: true, headers: { get: () => 'application/json' },
      json: async () => ({}),
    });
    await api.put('/member/profile', { name: 'Test' });
    expect(fetch.mock.calls[0][1].method).toBe('PUT');
  });

  it('DELETE sends correct method', async () => {
    fetch.mockResolvedValueOnce({
      ok: true, headers: { get: () => 'application/json' },
      json: async () => ({}),
    });
    await api.delete('/member/goals/1');
    expect(fetch.mock.calls[0][1].method).toBe('DELETE');
  });

  it('throws error with code and details on non-ok response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false, status: 400, statusText: 'Bad Request',
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'Invalid input', error_code: 'VAL_001', details: ['Name required'] }),
    });
    try {
      await api.get('/test');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err.message).toBe('Invalid input');
      expect(err.code).toBe('VAL_001');
      expect(err.details).toEqual(['Name required']);
    }
  });

  it('handles non-JSON response gracefully', async () => {
    fetch.mockResolvedValueOnce({ ok: true, headers: { get: () => 'text/html' } });
    const data = await api.get('/test');
    expect(data).toEqual({});
  });

  it('handles JSON parse failure on error', async () => {
    fetch.mockResolvedValueOnce({
      ok: false, status: 500, statusText: 'Internal Server Error',
      headers: { get: () => 'application/json' },
      json: async () => { throw new Error('bad json'); },
    });
    await expect(api.get('/test')).rejects.toThrow('Internal Server Error');
  });

  it('logs request and response when debugApi is enabled', async () => {
    window.localStorage.getItem.mockReturnValue('1');
    fetch.mockResolvedValueOnce({
      ok: true, status: 200, statusText: 'OK',
      headers: { get: () => 'application/json' },
      json: async () => ({ result: 42 }),
    });
    await api.get('/debug-test');
    expect(console.group).toHaveBeenCalledWith(
      expect.stringContaining('[API]'),
      expect.any(String),
      expect.any(String),
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[API]'),
      expect.any(String),
      expect.any(String),
    );
    expect(console.log).toHaveBeenCalledWith('<<< BODY:', { result: 42 });
    expect(console.groupEnd).toHaveBeenCalled();
  });

  it('logs POST body when debugApi is enabled', async () => {
    window.localStorage.getItem.mockReturnValue('1');
    fetch.mockResolvedValueOnce({
      ok: true, status: 200, statusText: 'OK',
      headers: { get: () => 'application/json' },
      json: async () => ({}),
    });
    await api.post('/debug-body', { key: 'val' });
    expect(console.log).toHaveBeenCalledWith('>>> BODY:', { key: 'val' });
  });

  it('logs debug output even for failed requests', async () => {
    window.localStorage.getItem.mockReturnValue('1');
    fetch.mockResolvedValueOnce({
      ok: false, status: 500, statusText: 'Server Error',
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'fail' }),
    });
    await expect(api.get('/fail')).rejects.toThrow('fail');
    expect(console.group).toHaveBeenCalled();
    expect(console.groupEnd).toHaveBeenCalled();
  });

  it('defaults to debug on when localStorage returns null and env not set', async () => {
    window.localStorage.getItem.mockReturnValue(null);
    fetch.mockResolvedValueOnce({
      ok: true, status: 200, statusText: 'OK',
      headers: { get: () => 'application/json' },
      json: async () => ({}),
    });
    await api.get('/default-debug');
    expect(console.group).toHaveBeenCalled();
  });

  it('throws "Request failed" when error field is empty', async () => {
    fetch.mockResolvedValueOnce({
      ok: false, status: 400, statusText: 'Bad Request',
      headers: { get: () => 'application/json' },
      json: async () => ({}),
    });
    await expect(api.get('/test')).rejects.toThrow('Request failed');
  });
});
