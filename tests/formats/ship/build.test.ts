import { shipFormat } from '@/formats/ship'
import { identifyBuild } from '@/formats/ship/build'
import releases from '@/formats/ship/data/releases.json'

import { fixture, open, seedOf } from '../../helpers'

const OFFICIAL_931 = { version: 'Dewey Bravo (9.3.1)', git_commit: 'f0599f9' }

it('knows the 9.3.0 and 9.3.1 releases by their tagged commits', () => {
  expect(releases).toContainEqual({
    version: '9.3.0',
    name: 'Dewey Alpha',
    commit: 'ecd889c2019b87e78b0a3d942a6a3fe98b7efaed',
  })
  expect(releases).toContainEqual({
    version: '9.3.1',
    name: 'Dewey Bravo',
    commit: 'f0599f96f8d442f26d0fa1c5cedafddacd56633f',
  })
})

describe('identifyBuild', () => {
  it('calls a release commit with its own version official', () => {
    expect(identifyBuild(OFFICIAL_931)).toEqual({
      kind: 'official',
      release: '9.3.1',
    })
    expect(
      identifyBuild({ version: 'Dewey Alfa (9.3.0)', git_commit: 'ecd889c' }),
    ).toEqual({ kind: 'official', release: '9.3.0' })
  })

  it('ignores the case of the commit', () => {
    expect(identifyBuild({ ...OFFICIAL_931, git_commit: 'F0599F9' }).kind).toBe(
      'official',
    )
  })

  it('calls a release commit under another version unofficial', () => {
    expect(
      identifyBuild({ ...OFFICIAL_931, version: 'Dewey Alfa (9.3.0)' }),
    ).toEqual({ kind: 'unofficial' })
    expect(identifyBuild({ ...OFFICIAL_931, version: 'nightly' })).toEqual({
      kind: 'unofficial',
    })
  })

  it('calls an unknown commit under a released version unofficial', () => {
    expect(
      identifyBuild({ version: 'Dewey Bravo (9.3.1)', git_commit: '9adbdf1' }),
    ).toEqual({ kind: 'unofficial' })
  })

  it('cannot judge a version newer than the newest known release', () => {
    expect(
      identifyBuild({
        version: 'Dewey Charlie (9.3.2)',
        git_commit: '1234567',
      }),
    ).toEqual({ kind: 'unverified' })
    expect(
      identifyBuild({ version: 'Eddie Alfa (10.0.0)', git_commit: '1234567' }),
    ).toEqual({ kind: 'unverified' })
  })

  it('cannot judge a log without a usable commit', () => {
    expect(identifyBuild({ version: 'Dewey Bravo (9.3.1)' })).toEqual({
      kind: 'unverified',
    })
    for (const git_commit of ['', 'f0599', 'not-a-hash', 7, null]) {
      expect(identifyBuild({ ...OFFICIAL_931, git_commit }).kind).toBe(
        'unverified',
      )
    }
  })

  it('cannot judge an unknown commit when the version is unreadable', () => {
    expect(
      identifyBuild({ version: 'nightly', git_commit: '1234567' }),
    ).toEqual({ kind: 'unverified' })
  })
})

describe('provenance on opened logs', () => {
  it('marks the stock 9.3.1 fixture as an official Ship release', () => {
    expect(open('normal.json').seed.provenance).toEqual({
      port: 'Ship of Harkinian',
      theme: 'ship',
      build: { kind: 'official', release: '9.3.1' },
    })
  })

  it('marks the develop-branch and feature-branch fixtures unofficial', () => {
    for (const name of ['hardcoded-no-logic.json', 'entrances-9.3.0.json']) {
      expect(open(name).seed.provenance.build).toEqual({ kind: 'unofficial' })
    }
  })

  it('cannot verify a log whose commit was removed', async () => {
    const rest = Object.fromEntries(
      Object.entries(fixture('normal.json')).filter(
        ([key]) => key !== 'git_commit',
      ),
    )
    const result = await shipFormat.read(rest)
    expect(seedOf(result).provenance.build).toEqual({ kind: 'unverified' })
  })
})
