import { commitOf, githubSource } from '../../scripts/lib/github-source'

const RELEASES = [
  { commit: 'a'.repeat(40), version: '9.2.0' },
  { commit: 'b'.repeat(40), version: '9.3.1' },
]

function stubFetch(response: Response): {
  calls: { init: RequestInit | undefined; url: string }[]
  fetchImpl: typeof fetch
} {
  const calls: { init: RequestInit | undefined; url: string }[] = []
  const fetchImpl = ((input: string, init?: RequestInit) => {
    calls.push({ init, url: input })
    return Promise.resolve(response)
  }) as typeof fetch
  return { calls, fetchImpl }
}

describe('commitOf', () => {
  it('returns the commit of a listed tag', () => {
    expect(commitOf(RELEASES, '9.3.1', 'generate:releases')).toBe(
      'b'.repeat(40),
    )
  })

  it.each(['generate:releases', 'generate:2ship-releases'])(
    'throws for a tag that is not listed, naming the tag and %s',
    (script) => {
      expect(() => commitOf(RELEASES, '1.0.0', script)).toThrow(
        `No release 1.0.0 in releases.json. Run bun run ${script} to refresh it.`,
      )
    },
  )
})

describe('githubSource', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads a file from raw.githubusercontent.com at the commit', async () => {
    const { calls, fetchImpl } = stubFetch(new Response('int main() {}'))
    const source = githubSource('owner/repo', 'c0ffee', fetchImpl)

    await expect(source.read('a/b.cpp')).resolves.toBe('int main() {}')
    expect(calls.map((call) => call.url)).toEqual([
      'https://raw.githubusercontent.com/owner/repo/c0ffee/a/b.cpp',
    ])
  })

  it('throws on a failed read, naming the path, repo, commit and status', async () => {
    const { fetchImpl } = stubFetch(new Response('nope', { status: 404 }))
    const source = githubSource('owner/repo', 'c0ffee', fetchImpl)

    await expect(source.read('a/missing.cpp')).rejects.toThrow(
      'Could not fetch a/missing.cpp from owner/repo@c0ffee: HTTP 404',
    )
  })

  it('lists only the files in a directory through the contents API', async () => {
    const { calls, fetchImpl } = stubFetch(
      Response.json([
        { name: 'one.cpp', type: 'file' },
        { name: 'nested', type: 'dir' },
        { name: 'two.cpp', type: 'file' },
      ]),
    )
    const source = githubSource('owner/repo', 'c0ffee', fetchImpl)

    await expect(source.list('a')).resolves.toEqual(['one.cpp', 'two.cpp'])
    expect(calls.map((call) => call.url)).toEqual([
      'https://api.github.com/repos/owner/repo/contents/a?ref=c0ffee',
    ])
  })

  it('throws on a failed list, naming the directory, repo, commit and status', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'secret')
    const { fetchImpl } = stubFetch(new Response('nope', { status: 403 }))
    const source = githubSource('owner/repo', 'c0ffee', fetchImpl)

    await expect(source.list('a')).rejects.toThrow(
      /^Could not fetch a from owner\/repo@c0ffee: HTTP 403$/,
    )
  })

  it.each([403, 429])(
    'hints at the rate limit on a %i without a token',
    async (status) => {
      vi.stubEnv('GITHUB_TOKEN', '')
      const { fetchImpl } = stubFetch(new Response('nope', { status }))
      const source = githubSource('owner/repo', 'c0ffee', fetchImpl)

      await expect(source.list('a')).rejects.toThrow(
        `Could not fetch a from owner/repo@c0ffee: HTTP ${status}. GitHub’s unauthenticated API limit may have been hit; setting GITHUB_TOKEN raises it.`,
      )
    },
  )

  it.each([
    { status: 403, token: 'secret' },
    { status: 429, token: 'secret' },
    { status: 404, token: '' },
  ])(
    'gives no rate-limit hint for a $status with token "$token"',
    async ({ status, token }) => {
      vi.stubEnv('GITHUB_TOKEN', token)
      const { fetchImpl } = stubFetch(new Response('nope', { status }))
      const source = githubSource('owner/repo', 'c0ffee', fetchImpl)

      const message = await source.list('a').then(
        () => '',
        (error: unknown) => (error as Error).message,
      )
      expect(message).toBe(
        `Could not fetch a from owner/repo@c0ffee: HTTP ${status}`,
      )
    },
  )

  it('sends the token as a bearer when GITHUB_TOKEN is set', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'secret')
    const { calls, fetchImpl } = stubFetch(new Response('body'))
    await githubSource('owner/repo', 'c0ffee', fetchImpl).read('a.cpp')

    expect(new Headers(calls[0]?.init?.headers).get('Authorization')).toBe(
      'Bearer secret',
    )
  })

  it('sends no Authorization header without a token', async () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    const { calls, fetchImpl } = stubFetch(new Response('body'))
    await githubSource('owner/repo', 'c0ffee', fetchImpl).read('a.cpp')

    expect(new Headers(calls[0]?.init?.headers).has('Authorization')).toBe(
      false,
    )
  })
})
