import { render } from '@testing-library/react'
import { useRef } from 'react'

import { useHeightVar } from '@/hooks/use-height-var'

function Bar() {
  const ref = useRef<HTMLDivElement>(null)
  useHeightVar(ref, '--bar-height')
  return <div ref={ref} />
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('publishes the height on the parent, follows resizes and cleans up', () => {
  let notify: () => void = vi.fn()
  const disconnect = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        notify = callback
      }
      observe = vi.fn()
      disconnect = disconnect
    },
  )
  const height = vi
    .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
    .mockReturnValue(64)

  const { container, unmount } = render(<Bar />)
  expect(container.style.getPropertyValue('--bar-height')).toBe('64px')

  height.mockReturnValue(96)
  notify()
  expect(container.style.getPropertyValue('--bar-height')).toBe('96px')

  unmount()
  expect(disconnect).toHaveBeenCalled()
  expect(container.style.getPropertyValue('--bar-height')).toBe('')
})
