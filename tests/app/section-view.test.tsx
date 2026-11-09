import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'

import App from '@/app/App'
import { SectionView } from '@/app/sections/SectionView'
import { SeedView } from '@/app/seed/SeedView'
import { SeedViewProvider } from '@/app/seed/SeedViewProvider'
import type { Check, Section, Seed } from '@/model/seed'
import { FAILED_MESSAGE } from '@/model/seed'
import { loadTicks } from '@/storage/last-log'

import { checkNamed, fixtureFile, open, upload } from '../helpers'

const { seed } = open('normal.json')
const SHADOW = 'Shadow Temple Invisible Blades Visible Chest'
const HARDCODED_TITLE = '6724149933'

function sectionOf(checks: Check[]): Section {
  return {
    id: 'checks',
    title: 'Checks',
    content: {
      kind: 'rows',
      groupings: [
        {
          id: 'all',
          label: 'All',
          groups: [
            {
              title: 'Somewhere',
              rows: checks.map((c) => ({
                kind: 'check',
                id: c.id,
                primary: c.name,
                checkId: c.id,
              })),
            },
          ],
        },
      ],
    },
  }
}

function view(
  section: Section,
  checks: Check[],
  ticked: Set<string>,
  query = '',
): ReactElement {
  return (
    <SeedViewProvider
      checks={new Map(checks.map((c) => [c.id, c]))}
      choices={{
        groupings: {},
        groupTitles: {},
        onGroupingChange: vi.fn(),
        onGroupTitleChange: vi.fn(),
      }}
      onToggle={vi.fn()}
      query={query}
      ticked={ticked}
    >
      <SectionView section={section} />
    </SeedViewProvider>
  )
}

function section({ ticked }: { ticked: Set<string> }): ReactElement {
  const checks = [checkNamed(seed, SHADOW)]
  return view(sectionOf(checks), checks, ticked)
}

function renderSection(options: { ticked: Set<string> }) {
  return render(section(options))
}

function renderTrap({ ticked }: { ticked: Set<string> }) {
  const trap: Check = {
    id: 'GC Chest',
    name: 'GC Chest',
    item: 'Ice Trap',
    disguise: 'Fairy Bow',
    price: '40 rupees',
    tags: [],
    hints: [],
    searchText: 'gc chest ice trap fairy bow',
  }
  return render(view(sectionOf([trap]), [trap], ticked))
}

function renderFailed() {
  return render(
    view(
      {
        id: 'x',
        title: 'X',
        content: { kind: 'failed', message: FAILED_MESSAGE },
      },
      [],
      new Set(),
    ),
  )
}

function renderText(text: string) {
  return render(
    view(
      { id: 'x', title: 'X', content: { kind: 'text', text } },
      [],
      new Set(),
    ),
  )
}

function renderSeedView(options: { seed?: Seed } = {}) {
  return render(
    <SeedView onFile={vi.fn()} onReset={vi.fn()} seed={options.seed ?? seed} />,
  )
}

async function confirmAll(name: 'Hide all' | 'Reveal all') {
  await userEvent.click(screen.getByRole('button', { name }))
  await userEvent.click(
    within(screen.getByRole('alertdialog')).getByRole('button', { name }),
  )
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('hides the item until the check is ticked', () => {
  const { rerender } = renderSection({ ticked: new Set() })
  expect(screen.queryByText('Light Arrows')).not.toBeInTheDocument()
  expect(
    screen.getByRole('checkbox', { name: `Reveal ${SHADOW}` }),
  ).not.toBeChecked()
  rerender(section({ ticked: new Set([SHADOW]) }))
  expect(screen.getByText('Light Arrows')).toBeInTheDocument()
  expect(
    screen.getByRole('checkbox', { name: `Reveal ${SHADOW}` }),
  ).toBeChecked()
})

it('shows hint text only after the check is revealed', async () => {
  const { rerender } = renderSection({ ticked: new Set() })
  expect(
    screen.queryByRole('button', { name: /Shadow Temple Invisible Blades/ }),
  ).not.toBeInTheDocument()
  expect(screen.queryByText('Ganondorf Hint')).not.toBeInTheDocument()
  expect(screen.queryByText(/hints? point/)).not.toBeInTheDocument()
  rerender(section({ ticked: new Set([SHADOW]) }))
  await userEvent.click(
    screen.getByRole('button', { name: /Shadow Temple Invisible Blades/ }),
  )
  expect(screen.getByText('Ganondorf Hint')).toBeInTheDocument()
  expect(screen.getByText(/reflecting my lightning bolts/)).toBeInTheDocument()
})

it('shows the sphere and hinted tags only once the check is revealed', () => {
  const { rerender } = renderSection({ ticked: new Set() })
  expect(screen.queryByText('Sphere 11')).not.toBeInTheDocument()
  expect(screen.queryByText('hinted')).not.toBeInTheDocument()
  rerender(section({ ticked: new Set([SHADOW]) }))
  expect(screen.getByText('Sphere 11')).toBeInTheDocument()
  expect(screen.getByText('hinted')).toBeInTheDocument()
})

it('shows price and ice trap details once revealed', () => {
  const { unmount } = renderTrap({ ticked: new Set() })
  expect(screen.getByText('40 rupees')).toBeInTheDocument()
  expect(screen.queryByText('Ice Trap')).not.toBeInTheDocument()
  expect(screen.queryByText(/Looks like/)).not.toBeInTheDocument()
  unmount()
  renderTrap({ ticked: new Set(['GC Chest']) })
  expect(screen.getByText('Ice Trap')).toBeInTheDocument()
  expect(screen.getByText(/Looks like Fairy Bow/)).toBeInTheDocument()
})

it('shows the notice for a failed section', () => {
  renderFailed()
  expect(screen.getByRole('alert')).toHaveTextContent(
    'This section couldn’t be read.',
  )
})

it('renders text sections as preformatted text', () => {
  renderText('{ "a": 1 }')
  expect(screen.getByText('{ "a": 1 }').tagName).toBe('PRE')
})

it('reveals and hides every item at once', async () => {
  renderSeedView()
  await confirmAll('Reveal all')
  expect(screen.getByText('Light Arrows')).toBeInTheDocument()
  await confirmAll('Hide all')
  expect(screen.queryByText('Light Arrows')).not.toBeInTheDocument()
})

it('asks before revealing everything', async () => {
  renderSeedView()
  await userEvent.click(screen.getByRole('button', { name: 'Reveal all' }))
  await userEvent.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Cancel',
    }),
  )
  expect(screen.queryByText('Light Arrows')).not.toBeInTheDocument()
})

it('asks before clearing every tick', async () => {
  renderSeedView()
  await confirmAll('Reveal all')
  await userEvent.click(screen.getByRole('button', { name: 'Hide all' }))
  await userEvent.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Cancel',
    }),
  )
  expect(screen.getByText('Light Arrows')).toBeInTheDocument()
})

it('shows hidden matches when searching for an item', async () => {
  renderSeedView()
  await userEvent.type(screen.getByRole('searchbox'), 'light arrows')
  expect(await screen.findByText(SHADOW)).toBeInTheDocument()
  expect(screen.queryByText('Light Arrows')).not.toBeInTheDocument()
})

it('announces how many rows a search leaves', async () => {
  renderSeedView()
  const status = screen.getByRole('status')
  expect(status).toBeEmptyDOMElement()
  await userEvent.type(screen.getByRole('searchbox'), 'KF Mido Top Right')
  await waitFor(() => {
    expect(status).toHaveTextContent(/^1 match$/)
  })
  await userEvent.type(screen.getByRole('searchbox'), 'zzzzzz')
  await waitFor(() => {
    expect(status).toHaveTextContent(/^0 matches$/)
  })
  expect(await screen.findByText('No matches')).toBeInTheDocument()
})

it('counts rows, not groups, when announcing a search', async () => {
  renderSeedView()
  await userEvent.type(screen.getByRole('searchbox'), 'KF Mido')
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent(/^4 matches$/)
  })
})

it('announces a search of a text section', () => {
  const text: Section = {
    id: 'x',
    title: 'X',
    content: { kind: 'text', text: 'hello' },
  }
  const { rerender } = render(view(text, [], new Set(), 'hello'))
  expect(screen.getByRole('status')).toHaveTextContent(/^1 match$/)
  rerender(view(text, [], new Set(), 'zzz'))
  expect(screen.getByRole('status')).toHaveTextContent(/^0 matches$/)
})

it('shares ticks between Checks and Spheres, and saves them', async () => {
  renderSeedView()
  await userEvent.click(
    screen.getByRole('checkbox', { name: /Reveal KF Mido Top Right Chest/ }),
  )
  await userEvent.click(screen.getByRole('tab', { name: /Spheres/ }))
  expect(screen.getByText('Empty Bottle')).toBeInTheDocument()
  expect(loadTicks(seed.key)).toContain('KF Mido Top Right Chest')
})

it('reveals a check shared by several areas under each of them', async () => {
  renderSeedView({ seed: open('2ship-5.0.1-all-shuffles.json').seed })
  // The whole log is too long to mount at once; the search leaves a few rows
  await userEvent.type(screen.getByRole('searchbox'), 'keaton quiz')
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent(/^\d{1,2} matches$/)
  })
  const KEATON = { name: 'Reveal Keaton Quiz' }
  expect(screen.getAllByRole('checkbox', KEATON)).toHaveLength(3)
  await userEvent.click(screen.getAllByRole('checkbox', KEATON)[0]!)
  expect(screen.getAllByText('Junk')).toHaveLength(3)
  expect(
    screen.getAllByRole('checkbox', { ...KEATON, checked: true }),
  ).toHaveLength(3)
})

it('does not carry ticks to a different log', async () => {
  render(<App />)
  await upload(fixtureFile('normal.json'))
  await userEvent.click(
    await screen.findByRole('checkbox', {
      name: /Reveal KF Mido Top Right Chest/,
    }),
  )
  expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(1)
  await upload(fixtureFile('hardcoded-no-logic.json'))
  await screen.findByRole('heading', { name: HARDCODED_TITLE })
  // The same check exists in the second log, and it must start hidden
  expect(
    screen.getByRole('checkbox', { name: /Reveal KF Mido Top Right Chest/ }),
  ).not.toBeChecked()
  expect(screen.queryAllByRole('checkbox', { checked: true })).toHaveLength(0)
})

const MIDO_CHECKBOX = { name: /Reveal KF Mido Top Right Chest/ }

async function tickInFreshApp() {
  const { unmount } = render(<App />)
  await upload(fixtureFile('normal.json'))
  await userEvent.click(await screen.findByRole('checkbox', MIDO_CHECKBOX))
  return unmount
}

it('restores ticks after a reload', async () => {
  const reload = await tickInFreshApp()
  reload()
  render(<App />)
  expect(await screen.findByRole('checkbox', MIDO_CHECKBOX)).toBeChecked()
  expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(1)
})

it('keeps ticks when the same log is opened again', async () => {
  const reload = await tickInFreshApp()
  reload()
  render(<App />)
  // The saved log restores asynchronously; wait for it before opening again
  await screen.findByRole('checkbox', MIDO_CHECKBOX)
  await upload(fixtureFile('normal.json'))
  expect(await screen.findByRole('checkbox', MIDO_CHECKBOX)).toBeChecked()
})

describe('hints', () => {
  const GANON = 'Ganondorf Hint'
  const hintBox = () =>
    screen.getByRole('checkbox', { name: /^Reveal hint 1 in Static hints$/ })

  async function openHints() {
    renderSeedView()
    await userEvent.click(screen.getByRole('tab', { name: /Hints/ }))
  }

  it('hides where a hint is told and what it says until it is ticked', async () => {
    await openHints()
    expect(screen.queryByText(GANON)).not.toBeInTheDocument()
    expect(screen.queryByText(/Look/)).not.toBeInTheDocument()
    await userEvent.click(hintBox())
    expect(hintBox()).toBeChecked()
    expect(screen.getAllByText('Hidden').length).toBeGreaterThan(0)
  })

  it('reveals one hint at a time and keeps the count hidden', async () => {
    await openHints()
    const hidden = screen.getAllByText('Hidden').length
    await userEvent.click(hintBox())
    expect(screen.getAllByText('Hidden')).toHaveLength(hidden - 1)
    expect(screen.getByRole('tab', { name: /^Hints/ })).toHaveTextContent(
      /^Hints\?\?$/,
    )
  })

  it('reveals every hint with Reveal all', async () => {
    await openHints()
    await confirmAll('Reveal all')
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
    expect(screen.getByText(GANON)).toBeInTheDocument()
  })

  it('does not search the text of a hint that is still hidden', async () => {
    await openHints()
    await userEvent.type(screen.getByRole('searchbox'), 'ganondorf')
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('0 matches')
    })
  })

  it('remembers revealed hints after a reload', async () => {
    const first = renderSeedView()
    await userEvent.click(screen.getByRole('tab', { name: /Hints/ }))
    await userEvent.click(hintBox())
    first.unmount()
    renderSeedView()
    await userEvent.click(screen.getByRole('tab', { name: /Hints/ }))
    expect(hintBox()).toBeChecked()
  })
})

describe('spheres', () => {
  const SPHERE_ONE = /^Reveal check 1 in Sphere/

  async function openSpheres() {
    renderSeedView()
    await userEvent.click(screen.getByRole('tab', { name: /Spheres/ }))
    return within(screen.getByRole('tabpanel'))
  }

  it('hides the checks of a sphere until they are ticked', async () => {
    const panel = await openSpheres()
    expect(panel.queryByText(/^KF /)).not.toBeInTheDocument()
    expect(panel.getAllByText('Hidden').length).toBeGreaterThan(0)
    expect(panel.queryAllByRole('checkbox', { checked: true })).toEqual([])
  })

  it('reveals the check, and its item, with one tick', async () => {
    const panel = await openSpheres()
    const hidden = panel.getAllByText('Hidden').length
    await userEvent.click(
      panel.getAllByRole('checkbox', { name: SPHERE_ONE })[0]!,
    )
    expect(panel.getAllByText('Hidden')).toHaveLength(hidden - 1)
    expect(panel.getAllByRole('checkbox', { checked: true })).toHaveLength(1)
  })

  it('shares the tick with the Checks section', async () => {
    const panel = await openSpheres()
    await userEvent.click(
      panel.getAllByRole('checkbox', { name: SPHERE_ONE })[0]!,
    )
    const [ticked] = panel.getAllByRole('checkbox', { checked: true })
    const name = /^Reveal (.+)$/.exec(
      ticked!.getAttribute('aria-label') ?? '',
    )![1]!
    await userEvent.click(screen.getByRole('tab', { name: /Checks/ }))
    expect(
      screen.getByRole('checkbox', { name: `Reveal ${name}` }),
    ).toBeChecked()
  })

  it('reveals every check with Reveal all', async () => {
    const panel = await openSpheres()
    await confirmAll('Reveal all')
    expect(panel.queryByText('Hidden')).not.toBeInTheDocument()
  })
})

describe('sidebar counts', () => {
  const sidebarTab = (name: RegExp) => screen.getByRole('tab', { name })

  it('hides the hint and sphere counts until everything is revealed', async () => {
    renderSeedView()
    expect(sidebarTab(/^Hints/)).toHaveTextContent(/^Hints\?\?$/)
    expect(sidebarTab(/^Spheres/)).toHaveTextContent(/^Spheres\?\?$/)
    await confirmAll('Reveal all')
    expect(sidebarTab(/^Hints/)).toHaveTextContent(/^Hints47$/)
    expect(sidebarTab(/^Spheres/)).toHaveTextContent(/^Spheres13$/)
  })

  it('hides them again once a check is hidden again', async () => {
    renderSeedView()
    await confirmAll('Reveal all')
    await userEvent.click(screen.getByRole('checkbox', MIDO_CHECKBOX))
    expect(sidebarTab(/^Spheres/)).toHaveTextContent(/^Spheres\?\?$/)
  })

  it('shows the real count when there is no Reveal all to press', () => {
    // Sphere rows are tickable, so only an open one leaves nothing to reveal
    const open = (section: Section): Section =>
      section.content.kind === 'rows'
        ? {
            ...section,
            content: {
              ...section.content,
              groupings: [
                {
                  ...section.content.groupings[0],
                  groups: section.content.groupings[0].groups.map((group) => ({
                    ...group,
                    rows: group.rows.map((row) => ({ ...row, kind: 'plain' })),
                  })),
                },
              ],
            },
          }
        : section
    const noChecks: Seed = {
      ...seed,
      checks: [],
      sections: seed.sections
        .filter((s) => s.id !== 'hints')
        .map((s) => (s.id === 'spheres' ? open(s) : s)),
    }
    renderSeedView({ seed: noChecks })
    expect(sidebarTab(/^Spheres/)).toHaveTextContent(/^Spheres13$/)
  })
})

describe('section tabs', () => {
  function atDesktopWidth() {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)
  }

  it('leaves Hints closed until a keyboard user chooses it', async () => {
    renderSeedView()
    await userEvent.click(screen.getByRole('tab', { name: /Songs/ }))
    await userEvent.keyboard('{ArrowRight}')
    const hints = screen.getByRole('tab', { name: /Hints/ })
    expect(hints).toHaveFocus()
    expect(hints).toHaveAttribute('aria-selected', 'false')
    await userEvent.keyboard('{Enter}')
    expect(hints).toHaveAttribute('aria-selected', 'true')
  })

  it('falls back to the first section when a reopened log lost the open one', async () => {
    const onFile = vi.fn()
    const { rerender } = render(
      <SeedView onFile={onFile} onReset={vi.fn()} seed={seed} />,
    )
    await userEvent.click(screen.getByRole('tab', { name: /Spheres/ }))
    const sections = seed.sections.filter((s) => s.title !== 'Spheres')
    rerender(
      <SeedView
        onFile={onFile}
        onReset={vi.fn()}
        seed={{ ...seed, sections }}
      />,
    )
    expect(screen.getByRole('tab', { name: /Checks/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      within(screen.getByRole('tabpanel')).getByRole('heading', {
        name: 'Checks',
      }),
    ).toBeInTheDocument()
  })

  it('runs across on a narrow screen', () => {
    renderSeedView()
    expect(screen.getByRole('tablist')).toHaveAttribute(
      'aria-orientation',
      'horizontal',
    )
  })

  it('runs down the side on a wide screen', () => {
    atDesktopWidth()
    renderSeedView()
    expect(screen.getByRole('tablist')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    )
  })
})

describe('changing section', () => {
  const BAR_HEIGHT = 60

  function layOut(contentTop: number) {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(
      BAR_HEIGHT,
    )
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: contentTop,
    } as DOMRect)
    return vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined)
  }

  it('brings a section that starts above the bar back into view', async () => {
    renderSeedView()
    const scrollBy = layOut(-3000)
    await userEvent.click(screen.getByRole('tab', { name: /Spheres/ }))
    expect(scrollBy).toHaveBeenCalledExactlyOnceWith(0, -3060)
  })

  it('leaves the page alone when the section is already in view', async () => {
    renderSeedView()
    const scrollBy = layOut(BAR_HEIGHT + 100)
    await userEvent.click(screen.getByRole('tab', { name: /Spheres/ }))
    expect(scrollBy).not.toHaveBeenCalled()
  })
})

it('stays usable with a broken saved tick list', () => {
  localStorage.setItem('lens.ticks', '{bad')
  expect(() => renderSeedView()).not.toThrow()
})
