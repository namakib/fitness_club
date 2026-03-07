import '@testing-library/jest-dom';

const store = {};
const localStorageMock = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, val) => { store[key] = String(val); }),
  removeItem: vi.fn((key) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class IntersectionObserverStub {
  constructor() { this.observe = vi.fn(); this.unobserve = vi.fn(); this.disconnect = vi.fn(); }
}
window.IntersectionObserver = IntersectionObserverStub;

class ResizeObserverStub {
  constructor() { this.observe = vi.fn(); this.unobserve = vi.fn(); this.disconnect = vi.fn(); }
}
window.ResizeObserver = ResizeObserverStub;

window.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));
window.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  measureText: vi.fn(() => ({ width: 0 })),
  fillText: vi.fn(),
  fillRect: vi.fn(),
  clearRect: vi.fn(),
}));
