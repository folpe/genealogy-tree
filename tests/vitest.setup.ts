import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom n'a ni ResizeObserver ni matchMedia. Les composants qui les utilisent
// (caméra du canevas) sont testés en vrai navigateur par Playwright ; ici, il suffit
// qu'ils montent sans rien observer.
if (typeof window !== 'undefined') {
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia ??= (query: string) => ({
    matches: false,
    media: query,
    onchange: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}
