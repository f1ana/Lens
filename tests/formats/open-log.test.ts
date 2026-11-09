import { MAX_LOG_LENGTH, MESSAGES, openLogText, openLogWith } from '@/formats'
import { DataLoadError } from '@/formats/shared/release-data'
import { loadShipLookups } from '@/formats/ship/data-loader'
import type { LogFormat } from '@/model/seed'

import { fixture } from '../helpers'

vi.mock('@/formats/ship/data-loader', { spy: true })

afterEach(() => {
  vi.clearAllMocks()
})

it('rejects text that is not JSON', async () => {
  expect(await openLogText('nope')).toMatchObject({
    status: 'rejected',
    reason: 'not-json',
  })
})

it('rejects JSON no format recognizes', async () => {
  expect(await openLogText('{"a":1}')).toMatchObject({
    status: 'rejected',
    reason: 'not-a-log',
  })
})

it('rejects oversized text without parsing it', async () => {
  expect(await openLogText(' '.repeat(MAX_LOG_LENGTH + 1))).toMatchObject({
    reason: 'too-large',
  })
})

it('ignores a byte order mark', async () => {
  const text = '\uFEFF' + JSON.stringify({ a: 1 })
  expect(await openLogText(text)).toMatchObject({ reason: 'not-a-log' })
})

it('returns a rejection if a format throws', async () => {
  const broken: LogFormat = {
    name: 'Broken',
    theme: 'ship',
    recognizes: () => true,
    read: () => {
      throw new Error('boom')
    },
  }
  expect(await openLogWith([broken], '{}')).toMatchObject({
    status: 'rejected',
    reason: 'not-a-log',
    message: MESSAGES.readFailed,
  })
})

it('a Ship log with no version still opens', async () => {
  const log = fixture('normal.json')
  delete log.version
  const result = await openLogText(JSON.stringify(log))
  expect(result.status).toBe('opened')
  expect(loadShipLookups).toHaveBeenCalledWith(null)
})

it('a Ship log below 9.3.0 is rejected as unsupported', async () => {
  const log = { ...fixture('normal.json'), version: 'Dewey Alfa (9.2.9)' }
  expect(await openLogText(JSON.stringify(log))).toMatchObject({
    status: 'rejected',
    reason: 'unsupported-version',
    message:
      'This log is from Ship version 9.2.9. Lens supports 9.3.0 and newer.',
  })
  expect(loadShipLookups).not.toHaveBeenCalled()
})

it('a failed data load is rejected as data-unavailable', async () => {
  vi.mocked(loadShipLookups).mockRejectedValueOnce(new DataLoadError('offline'))
  expect(await openLogText(JSON.stringify(fixture('normal.json')))).toEqual({
    status: 'rejected',
    reason: 'data-unavailable',
    message:
      'Lens couldn’t load the reference data for this log. Check your connection and try again.',
  })
})
