import {
  chooseRelease,
  DataLoadError,
  loadRelease,
} from '@/formats/shared/release-data'
import type { Version } from '@/formats/shared/version'

it('uses the exact release', () => {
  expect(chooseRelease('9.3.0', ['9.3.0', '9.3.1'])).toBe('9.3.0')
})

it('falls back to the newest for a newer version', () => {
  expect(chooseRelease('9.4.0', ['9.3.0', '9.3.1'])).toBe('9.3.1')
})

it('falls back to the newest for an unknown or null release', () => {
  expect(chooseRelease(null, ['9.3.0', '9.3.1'])).toBe('9.3.1')
})

it('compares numerically', () => {
  expect(chooseRelease(null, ['5.0.9', '5.0.10'])).toBe('5.0.10')
})

it('throws DataLoadError when nothing is held', () => {
  expect(() => chooseRelease('9.3.0', [])).toThrow(DataLoadError)
})

interface Files {
  areas: string
  items: string
}

const MINIMUM: Version = [9, 3, 0]

// Shaped like the result of `import.meta.glob`
function loaders(releases: string[], file: string) {
  return Object.fromEntries(
    releases.map((release) => [
      `./data/${release}/${file}.json`,
      () => Promise.resolve(`${file} ${release}`),
    ]),
  )
}

it('loads the exact release', async () => {
  const files = {
    areas: loaders(['9.3.0', '9.3.1'], 'areas'),
    items: loaders(['9.3.0', '9.3.1'], 'items'),
  }
  await expect(loadRelease<Files>('9.3.0', MINIMUM, files)).resolves.toEqual({
    areas: 'areas 9.3.0',
    items: 'items 9.3.0',
  })
})

it('never picks a folder below the minimum, even when wanted', async () => {
  const files = {
    areas: loaders(['9.2.0', '9.3.1'], 'areas'),
    items: loaders(['9.2.0', '9.3.1'], 'items'),
  }
  await expect(loadRelease<Files>('9.2.0', MINIMUM, files)).resolves.toEqual({
    areas: 'areas 9.3.1',
    items: 'items 9.3.1',
  })
})

it('falls back to the newest complete folder when one lacks a file', async () => {
  const files = {
    areas: loaders(['9.3.0', '9.3.1'], 'areas'),
    items: loaders(['9.3.0'], 'items'),
  }
  await expect(loadRelease<Files>('9.3.1', MINIMUM, files)).resolves.toEqual({
    areas: 'areas 9.3.0',
    items: 'items 9.3.0',
  })
})

it('wraps a failed import in DataLoadError', async () => {
  const files = {
    areas: loaders(['9.3.1'], 'areas'),
    items: {
      './data/9.3.1/items.json': () =>
        Promise.reject(new TypeError('Failed to fetch')),
    },
  }
  await expect(
    loadRelease<Files>('9.3.1', MINIMUM, files),
  ).rejects.toBeInstanceOf(DataLoadError)
})
