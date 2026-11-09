import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SeedView } from '@/app/seed/SeedView'
import { loadGroupings } from '@/storage/groupings'

import { open } from '../helpers'

const { seed } = open('normal.json')

function renderSeedView() {
  return render(<SeedView onFile={vi.fn()} onReset={vi.fn()} seed={seed} />)
}

async function groupBy(label: string) {
  await userEvent.click(screen.getByRole('combobox', { name: 'Group by' }))
  await userEvent.click(await screen.findByRole('option', { name: label }))
}

function headings() {
  return screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('starts on the default arrangement', () => {
  renderSeedView()
  expect(screen.getByRole('combobox', { name: 'Group by' })).toHaveTextContent(
    'Area',
  )
  expect(headings()).toContain('Kokiri Forest')
})

it('lists each arrangement in the dropdown', async () => {
  renderSeedView()
  await userEvent.click(screen.getByRole('combobox', { name: 'Group by' }))
  const options = await screen.findAllByRole('option')
  expect(options.map((o) => o.textContent)).toEqual([
    'Area',
    'Type',
    'Sphere',
    'Hinted',
  ])
})

it('regroups the rows when another arrangement is picked', async () => {
  renderSeedView()
  await groupBy('Sphere')
  expect(headings()).not.toContain('Kokiri Forest')
  expect(headings()).toContain('Not in the playthrough')
})

it('searches within the arrangement that is picked', async () => {
  renderSeedView()
  await groupBy('Hinted')
  await userEvent.type(screen.getByRole('searchbox'), 'KF Mido')
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent(/matches$/)
  })
  for (const title of headings()) expect(title).toMatch(/hinted/i)
})

it('keeps the choice when another section is opened and left', async () => {
  renderSeedView()
  await groupBy('Sphere')
  await userEvent.click(screen.getByRole('tab', { name: /Hints/ }))
  expect(
    screen.queryByRole('combobox', { name: 'Group by' }),
  ).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('tab', { name: /Checks/ }))
  expect(screen.getByRole('combobox', { name: 'Group by' })).toHaveTextContent(
    'Sphere',
  )
})

it('remembers the choice for the next log', async () => {
  const first = renderSeedView()
  await groupBy('Type')
  expect(loadGroupings()).toEqual({ checks: 'type' })
  first.unmount()

  renderSeedView()
  expect(screen.getByRole('combobox', { name: 'Group by' })).toHaveTextContent(
    'Type',
  )
})

it.each(['Sphere', 'Hinted'])(
  'opens the next log without the %s arrangement',
  async (label) => {
    const first = renderSeedView()
    await groupBy(label)
    expect(
      screen.getByRole('combobox', { name: 'Group by' }),
    ).toHaveTextContent(label)
    first.unmount()

    renderSeedView()
    expect(
      screen.getByRole('combobox', { name: 'Group by' }),
    ).toHaveTextContent('Area')
  },
)

it('keeps the remembered choice after trying the Sphere arrangement', async () => {
  const first = renderSeedView()
  await groupBy('Type')
  await groupBy('Sphere')
  first.unmount()

  renderSeedView()
  expect(screen.getByRole('combobox', { name: 'Group by' })).toHaveTextContent(
    'Type',
  )
})

it('ignores a saved choice that spoils the log', () => {
  localStorage.setItem('lens.groupings', '{"checks":"sphere"}')
  renderSeedView()
  expect(screen.getByRole('combobox', { name: 'Group by' })).toHaveTextContent(
    'Area',
  )
})

it('falls back to the default when the remembered choice is unknown', () => {
  localStorage.setItem('lens.groupings', '{"checks":"nonsense"}')
  renderSeedView()
  expect(screen.getByRole('combobox', { name: 'Group by' })).toHaveTextContent(
    'Area',
  )
})

it('ignores damaged remembered choices', () => {
  localStorage.setItem('lens.groupings', '[1,2')
  renderSeedView()
  expect(screen.getByRole('combobox', { name: 'Group by' })).toBeInTheDocument()
})

it('offers no dropdown on a section with one arrangement', async () => {
  renderSeedView()
  await userEvent.click(screen.getByRole('tab', { name: /Settings/ }))
  const panel = screen.getByRole('tabpanel')
  expect(within(panel).queryByRole('combobox')).not.toBeInTheDocument()
})

it('keeps working when browser storage is blocked', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  renderSeedView()
  await groupBy('Sphere')
  expect(screen.getByRole('combobox', { name: 'Group by' })).toHaveTextContent(
    'Sphere',
  )
})

async function showOnly(label: string) {
  await userEvent.click(screen.getByRole('combobox', { name: 'Show' }))
  await userEvent.click(await screen.findByRole('option', { name: label }))
}

it('shows every group until one is picked', () => {
  renderSeedView()
  expect(screen.getByRole('combobox', { name: 'Show' })).toHaveTextContent(
    'All',
  )
  expect(headings().length).toBeGreaterThan(1)
})

it('lists the groups of the arrangement in the Show list', async () => {
  renderSeedView()
  await groupBy('Sphere')
  await userEvent.click(screen.getByRole('combobox', { name: 'Show' }))
  const options = (await screen.findAllByRole('option')).map(
    (o) => o.textContent,
  )
  expect(options[0]).toBe('All')
  expect(options).toContain('Not in the playthrough')
  expect(options.some((o) => o.startsWith('Sphere '))).toBe(true)
  expect(options).not.toContain('Kokiri Forest')
})

it('shows only the group that is picked', async () => {
  renderSeedView()
  await showOnly('Kokiri Forest')
  expect(headings()).toEqual(['Kokiri Forest'])
  expect(screen.getByRole('combobox', { name: 'Show' })).toHaveTextContent(
    'Kokiri Forest',
  )
  expect(screen.getByText('KF Mido Top Right Chest')).toBeInTheDocument()
  expect(screen.queryByText(/^LH /)).not.toBeInTheDocument()
})

it('goes back to every group on All', async () => {
  renderSeedView()
  await showOnly('Kokiri Forest')
  await showOnly('All')
  expect(headings().length).toBeGreaterThan(1)
})

it('searches only within the group that is picked', async () => {
  renderSeedView()
  await showOnly('Kokiri Forest')
  await userEvent.type(screen.getByRole('searchbox'), 'chest')
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent(/matches$/)
  })
  expect(headings()).toEqual(['Kokiri Forest'])
})

it('drops the picked group when the arrangement changes', async () => {
  renderSeedView()
  await showOnly('Kokiri Forest')
  await groupBy('Sphere')
  expect(screen.getByRole('combobox', { name: 'Show' })).toHaveTextContent(
    'All',
  )
  expect(headings().length).toBeGreaterThan(1)
})

it('keeps the picked group when another section is opened and left', async () => {
  renderSeedView()
  await showOnly('Kokiri Forest')
  await userEvent.click(screen.getByRole('tab', { name: /Hints/ }))
  expect(screen.getByRole('combobox', { name: 'Show' })).toHaveTextContent(
    'All',
  )
  await userEvent.click(screen.getByRole('tab', { name: /Checks/ }))
  expect(headings()).toEqual(['Kokiri Forest'])
})

it('does not remember the picked group for the next log', async () => {
  const first = renderSeedView()
  await showOnly('Kokiri Forest')
  first.unmount()
  renderSeedView()
  expect(screen.getByRole('combobox', { name: 'Show' })).toHaveTextContent(
    'All',
  )
})
