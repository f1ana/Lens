import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import App from '@/app/App'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { SAVED_LOG_MESSAGE } from '@/app/open-log/hooks/use-log-opener'
import { SupportedFormats } from '@/app/open-log/SupportedFormats'
import { formats, MAX_LOG_LENGTH, MESSAGES } from '@/formats'
import { loadLastLog, saveLastLog } from '@/storage/last-log'

import { fixtureFile, fixtureText, upload } from '../helpers'

const TITLE = 'GetYourHalloweenCostume'
const LOADING = 'Opening your log'

function Bomb(): never {
  throw new Error('boom')
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('shows the open screen with no saved log', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Lens' })).toBeInTheDocument()
  expect(screen.getByLabelText('Open a spoiler log')).toBeInTheDocument()
  expect(
    screen.getByText('Open the spoiler log from your randomizer seed.'),
  ).toBeInTheDocument()
  for (const { name, supported } of formats) {
    expect(screen.getByText(name)).toBeInTheDocument()
    expect(supported).toBeDefined()
    expect(screen.getByText(supported!)).toBeInTheDocument()
  }
  expect(screen.queryByText(/read in this browser/)).not.toBeInTheDocument()
})

it('opens on the landing theme', () => {
  render(<App />)
  expect(document.documentElement.dataset.game).toBe('landing')
})

it.each([
  ['normal.json', 'ship'],
  ['2ship-5.0.1-all-shuffles.json', '2ship'],
  ['lighthouse-1.2.2-all-shuffles.json', 'lighthouse'],
])('opens %s in the %s theme', async (name, theme) => {
  render(<App />)
  await upload(fixtureFile(name))
  await screen.findByRole('heading', { level: 1 })
  await waitFor(() => {
    expect(document.documentElement.dataset.game).toBe(theme)
  })
})

it('gives every format its own theme', () => {
  const themes = formats.map((format) => format.theme)
  expect(new Set(themes).size).toBe(formats.length)
})

it('shows a format without a supported range by name only', () => {
  render(<SupportedFormats formats={[{ name: 'Some Port' }]} />)
  expect(screen.getByText('Some Port')).toBeInTheDocument()
  expect(screen.queryByText(/\d+\.\d+\.\d+/)).not.toBeInTheDocument()
})

it.each([
  ['normal.json', 'Official release'],
  ['hardcoded-no-logic.json', 'Unofficial build'],
])('labels %s as "%s" under the title', async (name, label) => {
  render(<App />)
  await upload(fixtureFile(name))
  await screen.findByRole('heading', { level: 1 })
  expect(screen.getByText('Ship of Harkinian')).toBeInTheDocument()
  expect(screen.getByText(label)).toBeInTheDocument()
})

it('opens a file and shows its header and sections', async () => {
  render(<App />)
  await upload(fixtureFile('normal.json'))
  expect(
    await screen.findByRole('heading', { name: TITLE }),
  ).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /Hints/ })).toBeInTheDocument()
  expect(
    screen.queryByRole('tab', { name: /Entrances/ }),
  ).not.toBeInTheDocument()
})

it('shows a plain message for a bad file and can still open another', async () => {
  render(<App />)
  await upload(new File(['nope'], 'x.json'))
  expect(await screen.findByText(MESSAGES.notJson)).toBeInTheDocument()
  await upload(fixtureFile('normal.json'))
  expect(
    await screen.findByRole('heading', { name: TITLE }),
  ).toBeInTheDocument()
})

it('turns away an oversized file without reading it', async () => {
  const file = new File(['{}'], 'huge.json')
  Object.defineProperty(file, 'size', { value: MAX_LOG_LENGTH + 1 })
  const read = vi.spyOn(file, 'text')
  render(<App />)
  await upload(file)
  expect(await screen.findByText(MESSAGES.tooLarge)).toBeInTheDocument()
  expect(read).not.toHaveBeenCalled()
})

it('keeps the current seed when a bad file is opened over it', async () => {
  render(<App />)
  await upload(fixtureFile('normal.json'))
  await screen.findByRole('heading', { name: TITLE })
  await upload(new File(['nope'], 'x.json'))
  expect(await screen.findByText(MESSAGES.notJson)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument()
})

it('saves the log it opened', async () => {
  render(<App />)
  await upload(fixtureFile('normal.json'))
  await screen.findByRole('heading', { name: TITLE })
  expect(loadLastLog()).toBe(fixtureText('normal.json'))
})

it('restores the last log', async () => {
  saveLastLog(fixtureText('normal.json'))
  render(<App />)
  expect(
    await screen.findByRole('heading', { name: TITLE }),
  ).toBeInTheDocument()
})

it('discards a saved log it cannot read', async () => {
  saveLastLog('nope')
  render(<App />)
  expect(await screen.findByText(SAVED_LOG_MESSAGE)).toBeInTheDocument()
  expect(loadLastLog()).toBeNull()
})

it('opens a file dropped on the page', async () => {
  render(<App />)
  fireEvent.drop(document.body, {
    dataTransfer: { files: [fixtureFile('normal.json')] },
  })
  expect(
    await screen.findByRole('heading', { name: TITLE }),
  ).toBeInTheDocument()
})

it('handles a file that cannot be read', async () => {
  render(<App />)
  const file = new File(['x'], 'x.json')
  vi.spyOn(file, 'text').mockRejectedValue(new Error('denied'))
  await upload(file)
  expect(await screen.findByText(MESSAGES.readFailed)).toBeInTheDocument()
})

it('clears search when a second log replaces the first', async () => {
  render(<App />)
  await upload(fixtureFile('normal.json'))
  await userEvent.type(await screen.findByRole('searchbox'), 'bow')
  expect(screen.getByRole('searchbox')).toHaveValue('bow')
  await upload(fixtureFile('hardcoded-no-logic.json'))
  await screen.findByRole('heading', { name: '6724149933' })
  expect(screen.getByRole('searchbox')).toHaveValue('')
})

it('keeps the page working when browser storage is blocked', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  render(<App />)
  await upload(fixtureFile('normal.json'))
  expect(
    await screen.findByRole('heading', { name: TITLE }),
  ).toBeInTheDocument()
})

it('contains a render failure in its boundary', () => {
  vi.spyOn(console, 'error').mockImplementation(vi.fn())
  render(
    <ErrorBoundary fallback={<p>Sorry</p>}>
      <Bomb />
    </ErrorBoundary>,
  )
  expect(screen.getByText('Sorry')).toBeInTheDocument()
})

it('resets everything and returns to the open screen after confirming', async () => {
  const user = userEvent.setup()
  localStorage.setItem('lens.groupings', '{"checks":"area"}')
  render(<App />)
  await upload(fixtureFile('normal.json'))
  await screen.findByRole('heading', { name: TITLE })

  await user.click(screen.getByRole('button', { name: 'Reset' }))
  await user.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', {
      name: 'Reset',
    }),
  )

  expect(screen.getByLabelText('Open a spoiler log')).toBeInTheDocument()
  expect(loadLastLog()).toBeNull()
  expect(localStorage.getItem('lens.groupings')).toBeNull()
})

it('keeps the log when the reset is cancelled', async () => {
  const user = userEvent.setup()
  render(<App />)
  await upload(fixtureFile('normal.json'))
  await screen.findByRole('heading', { name: TITLE })

  await user.click(screen.getByRole('button', { name: 'Reset' }))
  await user.click(screen.getByRole('button', { name: 'Cancel' }))

  expect(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument()
  expect(loadLastLog()).not.toBeNull()
})

it('shows a loading status while a log is being opened', async () => {
  render(<App />)
  const file = fixtureFile('normal.json')
  let release: (text: string) => void = () => undefined
  vi.spyOn(file, 'text').mockReturnValue(
    new Promise<string>((resolve) => {
      release = resolve
    }),
  )
  await upload(file)
  expect(await screen.findByText(LOADING)).toBeInTheDocument()
  release(fixtureText('normal.json'))
  await screen.findByRole('heading', { name: TITLE })
  expect(screen.queryByText(LOADING)).not.toBeInTheDocument()
})

it('keeps the open log out of reach while another one loads', async () => {
  render(<App />)
  await upload(fixtureFile('normal.json'))
  const main = (await screen.findByRole('heading', { name: TITLE })).closest(
    'main',
  )
  expect(main?.closest('[inert]')).toBeNull()

  const file = fixtureFile('normal.json')
  let release: (text: string) => void = () => undefined
  vi.spyOn(file, 'text').mockReturnValue(
    new Promise<string>((resolve) => {
      release = resolve
    }),
  )
  await upload(file)
  await screen.findByText(LOADING)
  expect(main?.closest('[inert]')).not.toBeNull()

  release(fixtureText('normal.json'))
  await waitFor(() => {
    expect(screen.queryByText(LOADING)).not.toBeInTheDocument()
  })
  expect(main?.closest('[inert]')).toBeNull()
})

it('shows a loading status while restoring the last log', async () => {
  saveLastLog(fixtureText('normal.json'))
  render(<App />)
  expect(screen.getByText(LOADING)).toBeInTheDocument()
  await screen.findByRole('heading', { name: TITLE })
  expect(screen.queryByText(LOADING)).not.toBeInTheDocument()
})

it('clears the loading status when a file is rejected', async () => {
  render(<App />)
  await upload(new File(['nope'], 'x.json'))
  expect(await screen.findByText(MESSAGES.notJson)).toBeInTheDocument()
  expect(screen.queryByText(LOADING)).not.toBeInTheDocument()
})

it('offers no tab for what a 2Ship log can’t show', async () => {
  render(<App />)
  await upload(fixtureFile('2ship-5.0.1-all-shuffles.json'))
  await screen.findByRole('heading', { level: 1 })
  expect(screen.getByRole('tab', { name: /Checks/ })).toBeInTheDocument()
  expect(
    screen.queryByRole('tab', { name: /Spheres|Entrances|Tricks|Other data/ }),
  ).not.toBeInTheDocument()
})
