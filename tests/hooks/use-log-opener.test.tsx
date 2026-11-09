import { act, renderHook, waitFor } from '@testing-library/react'

import {
  SAVED_LOG_MESSAGE,
  useLogOpener,
} from '@/app/open-log/hooks/use-log-opener'
import { MESSAGES } from '@/formats'
import { DataLoadError } from '@/formats/shared/release-data'
import { loadShipLookups } from '@/formats/ship/data-loader'
import { loadLastLog, saveLastLog } from '@/storage/last-log'

import { fixtureFile, fixtureText } from '../helpers'

vi.mock('@/formats/ship/data-loader', { spy: true })

afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

it('a data-unavailable result shows its message and stops loading', async () => {
  vi.mocked(loadShipLookups).mockRejectedValueOnce(new DataLoadError('offline'))
  const { result } = renderHook(() => useLogOpener())

  act(() => {
    result.current.openFile(fixtureFile('normal.json'))
  })

  await waitFor(() => {
    expect(result.current.message).toBe(MESSAGES.dataUnavailable)
  })
  expect(result.current.loading).toBe(false)
  expect(result.current.seed).toBeNull()
  expect(loadLastLog()).toBeNull()
})

it('a data-unavailable result on startup restore keeps the saved log', async () => {
  const text = fixtureText('normal.json')
  saveLastLog(text)
  vi.mocked(loadShipLookups).mockRejectedValueOnce(new DataLoadError('offline'))

  const { result } = renderHook(() => useLogOpener())

  await waitFor(() => {
    expect(result.current.message).toBe(MESSAGES.dataUnavailable)
  })
  expect(result.current.message).not.toBe(SAVED_LOG_MESSAGE)
  expect(result.current.loading).toBe(false)
  expect(loadLastLog()).toBe(text)
})

it('any other rejection on startup restore removes the saved log', async () => {
  saveLastLog('{"a":1}')

  const { result } = renderHook(() => useLogOpener())

  await waitFor(() => {
    expect(result.current.message).toBe(SAVED_LOG_MESSAGE)
  })
  expect(loadLastLog()).toBeNull()
})

it('a restore that finishes after unmount does not clear the saved log', async () => {
  const text = fixtureText('normal.json')
  saveLastLog(text)
  let fail: (error: Error) => void = () => undefined
  vi.mocked(loadShipLookups).mockReturnValueOnce(
    new Promise((_, reject) => {
      fail = reject
    }),
  )
  const { unmount } = renderHook(() => useLogOpener())
  await waitFor(() => {
    expect(loadShipLookups).toHaveBeenCalled()
  })

  unmount()
  // A live restore would remove the saved log on this rejection
  fail(new Error('boom'))
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(loadLastLog()).toBe(text)
})
