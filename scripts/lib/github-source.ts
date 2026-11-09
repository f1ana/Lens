export interface Source {
  // File names only, not directories
  list(dir: string): Promise<string[]>
  read(path: string): Promise<string>
}

interface ContentsEntry {
  name: string
  type: string
}

export function commitOf(
  releases: readonly { commit: string; version: string }[],
  tag: string,
  releasesScript: string,
): string {
  const release = releases.find(({ version }) => version === tag)
  if (!release) {
    throw new Error(
      `No release ${tag} in releases.json. Run bun run ${releasesScript} to refresh it.`,
    )
  }
  return release.commit
}

export function githubSource(
  repo: string,
  commit: string,
  fetchImpl: typeof fetch = fetch,
): Source {
  async function get(url: string, what: string): Promise<Response> {
    const token = process.env.GITHUB_TOKEN
    const response = await fetchImpl(
      url,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    )
    if (!response.ok) {
      const limited = response.status === 403 || response.status === 429
      const hint =
        limited && !token
          ? '. GitHub’s unauthenticated API limit may have been hit; setting GITHUB_TOKEN raises it.'
          : ''
      throw new Error(
        `Could not fetch ${what} from ${repo}@${commit}: HTTP ${response.status}${hint}`,
      )
    }
    return response
  }

  return {
    async list(dir) {
      const response = await get(
        `https://api.github.com/repos/${repo}/contents/${dir}?ref=${commit}`,
        dir,
      )
      const entries = (await response.json()) as ContentsEntry[]
      return entries
        .filter((entry) => entry.type === 'file')
        .map((entry) => entry.name)
    },
    async read(path) {
      const response = await get(
        `https://raw.githubusercontent.com/${repo}/${commit}/${path}`,
        path,
      )
      return response.text()
    },
  }
}
