import { vi } from 'vitest';

export function createMockApi() {
  return {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  };
}

export function resetMockApi(api) {
  api.get.mockReset().mockResolvedValue({});
  api.post.mockReset().mockResolvedValue({});
  api.put.mockReset().mockResolvedValue({});
  api.delete.mockReset().mockResolvedValue({});
}
