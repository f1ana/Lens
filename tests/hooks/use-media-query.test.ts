import { act, renderHook } from '@testing-library/react'

import { useMediaQuery } from '@/hooks/use-media-query'

function fakeMediaList(matches: boolean) {
  const list = new EventTarget() as EventTarget & { matches: boolean }
  list.matches = matches
  return list
}

afterEach(() => {
  vi.restoreAllMocks()
})

it('follows the media query as it changes', () => {
  const list = fakeMediaList(false)
  vi.spyOn(window, 'matchMedia').mockReturnValue(
    list as unknown as MediaQueryList,
  )
  const { result } = renderHook(() => useMediaQuery('(min-width: 48rem)'))
  expect(result.current).toBe(false)

  act(() => {
    list.matches = true
    list.dispatchEvent(new Event('change'))
  })
  expect(result.current).toBe(true)
})
