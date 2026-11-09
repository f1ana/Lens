import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  GROUP_GAP,
  HEADING_HEIGHT,
  ROW_HEIGHT,
} from '@/app/rows/utils/virtual-sizes'
import { SeedView } from '@/app/seed/SeedView'
import type { Check, Seed } from '@/model/seed'

// jsdom has no layout, so each bar above the list is given this height
const BAR_HEIGHT = 56

interface GroupSpec {
  count: number
  title: string
}

function seedOf(specs: GroupSpec[]): Seed {
  const checks: Check[] = specs.flatMap(({ title, count }) =>
    Array.from({ length: count }, (_, i) => ({
      id: `${title} ${String(i)}`,
      name: `${title} ${String(i)}`,
      item: `Item ${title} ${String(i)}`,
      tags: [],
      hints: [],
      searchText:
        `${title} ${String(i)} item ${title} ${String(i)}`.toLowerCase(),
    })),
  )
  return {
    key: 'virtual',
    title: 'Virtual',
    subtitle: '',
    provenance: { port: 'Test', theme: 'ship', build: { kind: 'unverified' } },
    facts: [],
    details: [],
    checks,
    sections: [
      {
        id: 'checks',
        title: 'Checks',
        count: checks.length,
        content: {
          kind: 'rows',
          groupings: [
            {
              id: 'all',
              label: 'All',
              groups: specs.map(({ title }) => ({
                title,
                rows: checks
                  .filter((c) => c.name.startsWith(`${title} `))
                  .map((c) => ({
                    kind: 'check' as const,
                    id: c.id,
                    primary: c.name,
                    checkId: c.id,
                  })),
              })),
            },
          ],
        },
      },
    ],
  }
}

const LONG: GroupSpec[] = [
  { title: 'Alpha', count: 1000 },
  { title: 'Beta', count: 1000 },
]

function renderSeed(seed: Seed) {
  return render(<SeedView onFile={vi.fn()} onReset={vi.fn()} seed={seed} />)
}

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  fireEvent.scroll(window)
}

// The list is the Alpha heading, its rows, then the Beta heading and its rows.
const BETA_HEADING = 1 + (LONG[0]?.count ?? 0)

function heightOfItem(index: number): number {
  if (index === 0) return HEADING_HEIGHT
  if (index === BETA_HEADING) return HEADING_HEIGHT + GROUP_GAP
  return ROW_HEIGHT
}

function offsetOfItem(index: number): number {
  let offset = 0
  for (let i = 0; i < index; i++) offset += heightOfItem(i)
  return offset
}

function offsetOfRow(groupIndex: number, row: number): number {
  return offsetOfItem((groupIndex === 0 ? 0 : BETA_HEADING) + 1 + row)
}

const box = (name: string) => ({ name: `Reveal ${name}` })

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.dataset.index === undefined
        ? BAR_HEIGHT
        : heightOfItem(Number(this.dataset.index))
    },
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
})

it('mounts only the rows near the top of a long list', () => {
  renderSeed(seedOf(LONG))
  expect(screen.getByRole('checkbox', box('Alpha 0'))).toBeInTheDocument()
  expect(
    screen.queryByRole('checkbox', box('Alpha 999')),
  ).not.toBeInTheDocument()
  expect(screen.queryByRole('checkbox', box('Beta 0'))).not.toBeInTheDocument()
  expect(screen.getAllByRole('checkbox').length).toBeLessThan(60)
})

it('mounts the rows the reader has scrolled to, and drops the ones left behind', () => {
  renderSeed(seedOf(LONG))
  scrollTo(offsetOfRow(0, 500))
  expect(screen.getByRole('checkbox', box('Alpha 500'))).toBeInTheDocument()
  expect(screen.queryByRole('checkbox', box('Alpha 0'))).not.toBeInTheDocument()
  expect(screen.getAllByRole('checkbox').length).toBeLessThan(60)
})

it('keeps the heading of the group on screen while its rows scroll past', () => {
  renderSeed(seedOf(LONG))
  scrollTo(offsetOfRow(0, 500))
  expect(screen.getByRole('heading', { name: 'Alpha' })).toBeInTheDocument()
  scrollTo(offsetOfRow(1, 10))
  expect(screen.getByRole('heading', { name: 'Beta' })).toBeInTheDocument()
})

function pinnedGroup(): string | undefined {
  return screen
    .getAllByRole('heading')
    .map((heading) => heading.closest<HTMLElement>('[data-index]'))
    .find((item) => item && item.style.top !== '')?.textContent
}

it('pins the next group heading once it reaches the bars, not before', () => {
  const bars = 2 * BAR_HEIGHT
  // Unlike the default stub, this reports a size, so the list reads the bars
  vi.stubGlobal(
    'ResizeObserver',
    class {
      onResize: ResizeObserverCallback
      constructor(onResize: ResizeObserverCallback) {
        this.onResize = onResize
      }
      observe = () => {
        this.onResize([], this)
      }
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )
  renderSeed(seedOf(LONG))
  const betaHeading = offsetOfItem(BETA_HEADING)

  // A heading pins when its text reaches the bars, not the gap above it
  const textAtBars = betaHeading + GROUP_GAP - bars
  scrollTo(textAtBars - 13)
  expect(pinnedGroup()).toBe('Alpha')
  scrollTo(textAtBars + 7)
  expect(pinnedGroup()).toBe('Beta')
})

it('keeps a tick after its row has scrolled out of the list and back', async () => {
  renderSeed(seedOf(LONG))
  await userEvent.click(screen.getByRole('checkbox', box('Alpha 3')))
  expect(screen.getByText('Item Alpha 3')).toBeInTheDocument()
  scrollTo(offsetOfRow(1, 500))
  expect(screen.queryByRole('checkbox', box('Alpha 3'))).not.toBeInTheDocument()
  scrollTo(0)
  expect(screen.getByRole('checkbox', box('Alpha 3'))).toBeChecked()
  expect(screen.getByText('Item Alpha 3')).toBeInTheDocument()
})

it('counts every match of a search, not just the rows mounted', async () => {
  renderSeed(seedOf(LONG))
  await userEvent.type(screen.getByRole('searchbox'), 'beta')
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent('1000 matches')
  })
  expect(screen.getAllByRole('checkbox').length).toBeLessThan(60)
})

it('keeps the estimated size of a row that has no layout', () => {
  // As when the list is measured while hidden, or in a browser-less test.
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(0)
  renderSeed(seedOf(LONG))
  expect(screen.getByRole('checkbox', box('Alpha 0'))).toBeInTheDocument()
  expect(
    screen.queryByRole('checkbox', box('Alpha 999')),
  ).not.toBeInTheDocument()
  expect(screen.getAllByRole('checkbox').length).toBeLessThan(60)
})

it('mounts every row of a short list', () => {
  renderSeed(seedOf([{ title: 'Alpha', count: 100 }]))
  expect(screen.getAllByRole('checkbox')).toHaveLength(100)
})
