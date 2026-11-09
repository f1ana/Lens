import {
  clearLastLog,
  loadLastLog,
  loadTicks,
  saveLastLog,
  saveTicks,
} from '@/storage/last-log'
import { clearAllState } from '@/storage/local'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

it('round-trips the last log', () => {
  saveLastLog('{}')
  expect(loadLastLog()).toBe('{}')
})

it('returns ticks only for the matching seed', () => {
  saveTicks('a', ['x'])
  expect(loadTicks('a')).toEqual(['x'])
  expect(loadTicks('b')).toEqual([])
})

it('clearing the log also clears ticks', () => {
  saveLastLog('{}')
  saveTicks('a', ['x'])
  clearLastLog()
  expect(loadLastLog()).toBeNull()
  expect(loadTicks('a')).toEqual([])
})

it('clearing all state removes every lens key and nothing else', () => {
  saveLastLog('{}')
  saveTicks('a', ['x'])
  localStorage.setItem('lens.groupings', '{"checks":"area"}')
  localStorage.setItem('other.key', 'keep')
  clearAllState()
  expect(loadLastLog()).toBeNull()
  expect(loadTicks('a')).toEqual([])
  expect(localStorage.getItem('lens.groupings')).toBeNull()
  expect(localStorage.getItem('other.key')).toBe('keep')
})

it('ignores corrupted ticks', () => {
  localStorage.setItem('lens.ticks', 'not json')
  expect(loadTicks('a')).toEqual([])
  localStorage.setItem('lens.ticks', '{"seedKey":"a","checkIds":[1,null]}')
  expect(loadTicks('a')).toEqual([])
})

it('never throws when storage is unavailable or full', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full')
  })
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(() => {
    saveLastLog('{}')
    saveTicks('a', [])
    clearLastLog()
    clearAllState()
  }).not.toThrow()
  expect(loadLastLog()).toBeNull()
  expect(loadTicks('a')).toEqual([])
})
