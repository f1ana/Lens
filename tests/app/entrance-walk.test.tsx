import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SeedView } from '@/app/seed/SeedView'
import { entrancesSection } from '@/formats/ship/entrances'

import { lookups } from '../formats/ship/data-9.3.1'
import { open } from '../helpers'

const { seed } = open('entrances-9.3.1.json')

async function openEntrances() {
  const view = render(
    <SeedView key={seed.key} onFile={vi.fn()} onReset={vi.fn()} seed={seed} />,
  )
  await openEntrancesTab()
  return view
}

async function openEntrancesTab() {
  await userEvent.click(screen.getByRole('tab', { name: /Entrances/ }))
}

function search(text: string) {
  return userEvent.type(screen.getByLabelText('Search checks and items'), text)
}

const row = () => screen.getByRole('button', { name: /^Lost Woods South Exit/ })

describe('the list', () => {
  it('shows the door and where it ends up side by side', async () => {
    await openEntrances()
    expect(within(row()).getByText('Hyrule Market')).toBeInTheDocument()
    expect(within(row()).getByText('Outside the Mask Shop')).toBeInTheDocument()
  })

  it('gives the landing the same size as the door', async () => {
    await openEntrances()
    const door = within(row()).getByText('Lost Woods South Exit')
    const place = within(row()).getByText('Hyrule Market')
    expect(place.className).toBe(door.className)
  })

  it('still finds a row by its raw destination', async () => {
    await openEntrances()
    await search('MK Mask Shop Entry')
    expect(
      await screen.findByRole('button', { name: /^Lost Woods South Exit/ }),
    ).toBeInTheDocument()
  })

  it('finds a row by where it ends up', async () => {
    await openEntrances()
    await search('outside the mask shop')
    expect(
      await screen.findByRole('button', { name: /^Lost Woods South Exit/ }),
    ).toBeInTheDocument()
  })

  it('marks the clicked row', async () => {
    wide()
    await openEntrances()
    const clicked = row()
    await userEvent.click(clicked)
    expect(clicked).toHaveAttribute('aria-current', 'true')
  })
})

let isWide = false

function wide() {
  isWide = true
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  )
}

afterEach(() => {
  isWide = false
  vi.restoreAllMocks()
})

const panelRole = () => (isWide ? 'complementary' : 'dialog')
const findPanel = () => screen.findByRole(panelRole(), { name: 'Walk' })
const queryPanel = () => screen.queryByRole(panelRole(), { name: 'Walk' })
const inPanel = (name: RegExp | string) =>
  findPanel().then((panel) => within(panel).getByRole('button', { name }))

async function walkTo(first: string, ...doors: string[]) {
  await userEvent.click(
    screen.getByRole('button', { name: new RegExp(`^${first}`) }),
  )
  for (const door of doors)
    await userEvent.click(await inPanel(new RegExp(`^${door}`)))
}

async function expectHeading(name: string) {
  const panel = await findPanel()
  expect(within(panel).getByRole('heading', { name })).toBeInTheDocument()
}

async function walkSection(map: Record<string, string>, door: string) {
  const section = entrancesSection(
    { entrancesMap: { 'sphere 00': map } },
    lookups,
  )
  if (!section) throw new Error('No section')
  render(
    <SeedView
      onFile={vi.fn()}
      onReset={vi.fn()}
      seed={{
        ...seed,
        sections: [{ id: 'entrances', title: 'Entrances', ...section }],
      }}
    />,
  )
  await walkTo(door)
}

describe.each([
  ['narrow', () => undefined],
  ['wide', wide],
])('the panel on a %s screen', (_, layout) => {
  beforeEach(layout)

  it('opens where the door lands, with its doors', async () => {
    await openEntrances()
    await walkTo('Lost Woods South Exit')
    const panel = await findPanel()
    expect(within(panel).getByText("You're in")).toBeInTheDocument()
    await expectHeading('Hyrule Market')
    expect(
      within(panel).getAllByRole('button', { name: /leads to/ }),
    ).toHaveLength(11)
  })

  it('moves one step and moves focus with it', async () => {
    await openEntrances()
    await walkTo('Lost Woods South Exit', 'MK Mask Shop Entry')
    const panel = await findPanel()
    const heading = within(panel).getByRole('heading', { name: 'Water Temple' })
    expect(heading.closest('[tabindex="-1"]')).toHaveFocus()
  })

  it('closes with the close button and returns focus to the row', async () => {
    await openEntrances()
    await walkTo('Lost Woods South Exit')
    await userEvent.click(await inPanel('Close'))
    await waitFor(() => {
      expect(queryPanel()).not.toBeInTheDocument()
    })
    expect(row()).toHaveFocus()
    expect(row()).not.toHaveAttribute('aria-current')
  })

  it('keeps the close button out of what scrolls', async () => {
    await openEntrances()
    await walkTo('Lost Woods South Exit')
    const close = await inPanel('Close')
    expect(close.closest('.overflow-y-auto')).toBeNull()
  })

  it('closes on Escape', async () => {
    await openEntrances()
    await walkTo('Lost Woods South Exit')
    await findPanel()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => {
      expect(queryPanel()).not.toBeInTheDocument()
    })
  })
})

describe('what the walk shows', () => {
  // Both layouts wrap one panel, so its content is checked on one layout only
  beforeEach(wide)

  it('steps back from the trail', async () => {
    await openEntrances()
    await walkTo('Lost Woods South Exit', 'MK Mask Shop Entry')
    await userEvent.click(await inPanel('Hyrule Market'))
    await expectHeading('Hyrule Market')
  })

  it('shows the doors around the starting door from the first step', async () => {
    await openEntrances()
    await walkTo('Lost Woods South Exit')
    await userEvent.click(await inPanel('Lost Woods South Exit'))
    await expectHeading('Lost Woods')
  })

  it('marks the real loop and cuts the trail back', async () => {
    await openEntrances()
    await walkTo(
      'Lost Woods South Exit',
      'MK Bombchu Shop Entry',
      'GF Top of Lower Vines Across',
    )
    await userEvent.click(await inPanel(/^Exit.*Back on your trail/))
    await expectHeading('Hyrule Market')
    const panel = await findPanel()
    expect(within(panel).getByRole('navigation')).not.toHaveTextContent(
      'Gerudo Fortress',
    )
  })

  it('says when the log lists no doors here', async () => {
    await walkSection(
      { 'Kak Bazaar Entry': 'Market South Exit' },
      'Kak Bazaar Entry',
    )
    const panel = await findPanel()
    expect(
      within(panel).getByText("This log doesn't list any doors here"),
    ).toBeInTheDocument()
  })

  it('says when it does not know a landing', async () => {
    await walkSection({ Somewhere: 'Elsewhere' }, 'Somewhere')
    const panel = await findPanel()
    expect(
      within(panel).getByText("Lens doesn't know what's here"),
    ).toBeInTheDocument()
  })
})

describe('the panel beside the list', () => {
  beforeEach(wide)

  it('keeps the clicked row in place as the list narrows', async () => {
    await openEntrances()
    const clicked = row()
    const scrollBy = vi.spyOn(window, 'scrollBy').mockReturnValue()
    vi.spyOn(clicked, 'getBoundingClientRect')
      .mockReturnValueOnce({ top: 300 } as DOMRect)
      .mockReturnValue({ top: 120 } as DOMRect)
    await userEvent.click(clicked)
    expect(scrollBy).toHaveBeenCalledWith(0, -180)
  })

  it('keeps the row in place as the list widens again', async () => {
    await openEntrances()
    const clicked = row()
    await userEvent.click(clicked)
    const scrollBy = vi.spyOn(window, 'scrollBy').mockReturnValue()
    vi.spyOn(clicked, 'getBoundingClientRect')
      .mockReturnValueOnce({ top: 120 } as DOMRect)
      .mockReturnValue({ top: 300 } as DOMRect)
    await userEvent.click(await inPanel('Close'))
    expect(scrollBy).toHaveBeenCalledWith(0, 180)
  })

  it('leaves the panel open when Escape closes a dropdown', async () => {
    await openEntrances()
    await walkTo('Lost Woods South Exit')
    await userEvent.click(screen.getByLabelText('Group by'))
    await userEvent.keyboard('{Escape}')
    expect(queryPanel()).toBeInTheDocument()
  })

  it('leaves the panel open when Escape is pressed in search', async () => {
    await openEntrances()
    await walkTo('Lost Woods South Exit')
    await search('x{Escape}')
    expect(queryPanel()).toBeInTheDocument()
  })

  it('starts over when another row is clicked', async () => {
    await openEntrances()
    await walkTo('Lost Woods South Exit', 'MK Mask Shop Entry')
    await userEvent.click(
      screen.getByRole('button', { name: /^Market South Exit.*leads to/ }),
    )
    await expectHeading('Kokiri Forest')
    const panel = await findPanel()
    expect(within(panel).getByRole('navigation')).not.toHaveTextContent(
      'Water Temple',
    )
  })

  it('keeps the walk through a search that hides the row', async () => {
    await openEntrances()
    await walkTo('Lost Woods South Exit', 'MK Mask Shop Entry')
    await search('zzz')
    await expectHeading('Water Temple')
  })

  it('keeps the walk and highlight through a new arrangement', async () => {
    await openEntrances()
    await walkTo('Lost Woods South Exit')
    await userEvent.click(screen.getByLabelText('Group by'))
    await userEvent.click(await screen.findByRole('option', { name: 'Type' }))
    await expectHeading('Hyrule Market')
    expect(
      screen.getAllByRole('button', { name: /^Lost Woods South Exit/ })[0],
    ).toHaveAttribute('aria-current', 'true')
  })

  it('keeps the walk through a section switch', async () => {
    await openEntrances()
    await walkTo('Lost Woods South Exit')
    await userEvent.click(screen.getByRole('tab', { name: /Settings/ }))
    expect(queryPanel()).not.toBeInTheDocument()
    await openEntrancesTab()
    await expectHeading('Hyrule Market')
  })

  it('starts a new log with no walk', async () => {
    const { rerender } = await openEntrances()
    await walkTo('Lost Woods South Exit')
    const other = open('entrances-9.3.0.json').seed
    rerender(
      <SeedView
        key={other.key}
        onFile={vi.fn()}
        onReset={vi.fn()}
        seed={other}
      />,
    )
    await openEntrancesTab()
    expect(queryPanel()).not.toBeInTheDocument()
  })
})
