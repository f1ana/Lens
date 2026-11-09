import { openLogText } from '@/formats'

import { fixture, open, seedOf } from '../../helpers'

const ALL = '2ship-5.0.1-all-shuffles.json'

it('opens a 2Ship log as an official release', () => {
  const { seed } = open(ALL)
  expect(seed.title).toBe('328751')
  expect(seed.subtitle).toBe('Battler Bravo (5.0.1)')
  expect(seed.provenance).toEqual({
    port: '2 Ship 2 Harkinian',
    theme: '2ship',
    build: { kind: 'official', release: '5.0.1' },
  })
  expect(seed.details).toEqual([
    { label: 'Commit', value: '8a24047' },
    { label: 'Final seed', value: '1648954987' },
  ])
})

it.each([
  ['5.0.0', 'd35196a'],
  ['4.0.2', 'acfd617'],
  ['3.0.0', '04cf7fb'],
])('rejects a log from %s', async (version, commitHash) => {
  expect(
    await openLogText(JSON.stringify({ ...fixture(ALL), commitHash })),
  ).toEqual({
    status: 'rejected',
    reason: 'unsupported-version',
    message: `This log is from 2 Ship 2 Harkinian version ${version}. Lens supports 5.0.1 and newer.`,
  })
})

it.each([
  ['an unknown commit', 'abcdef1'],
  ['a damaged commit', 42],
  ['a garbage commit', 'not a commit'],
  ['no commit', undefined],
])('opens a log with %s as unverified', async (_name, commitHash) => {
  const seed = seedOf(
    await openLogText(JSON.stringify({ ...fixture(ALL), commitHash })),
  )
  expect(seed.provenance.build).toEqual({ kind: 'unverified' })
  expect(seed.subtitle).toBe('Unknown version')
})

it('keeps seeds with one number apart by commit', async () => {
  const other = seedOf(
    await openLogText(
      JSON.stringify({ ...fixture(ALL), commitHash: 'abcdef1' }),
    ),
  )
  expect(other.key).not.toBe(open(ALL).seed.key)
})

it('keys a regenerated seed by its checks', async () => {
  const log = fixture(ALL)
  const regenerated = {
    ...log,
    checks: { ...(log.checks as object), RC_BOMB_SHOP_ITEM_01: 'RI_JUNK' },
  }
  const keyOf = async (value: unknown) =>
    seedOf(await openLogText(JSON.stringify(value))).key
  expect(await keyOf(regenerated)).not.toBe(await keyOf(log))
  expect(await keyOf(log)).toBe(await keyOf(log))
})
