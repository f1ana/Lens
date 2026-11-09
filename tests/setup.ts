import '@testing-library/jest-dom/vitest'

import { configure } from '@testing-library/react'

// The log view's first load can outlast the default second in a busy run
configure({ asyncUtilTimeout: 5000 })

// jsdom has no matchMedia; tests get the narrow layout unless they mock it
window.matchMedia = (query) =>
  ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as MediaQueryList

// jsdom lacks what Radix Select uses to open and scroll its list
Element.prototype.hasPointerCapture = () => false
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()
Element.prototype.scrollIntoView = vi.fn()

// jsdom has no window.scrollTo, which a long list calls to hold its place
window.scrollTo = vi.fn()

// jsdom has no ResizeObserver; tests that care about resizes replace this
globalThis.ResizeObserver = class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
