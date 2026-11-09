import { render, screen } from '@testing-library/react'

import { SeedHeader } from '@/app/seed/SeedHeader'
import type { Seed } from '@/model/seed'

const seed: Seed = {
  checks: [],
  details: [],
  facts: [],
  key: 'k',
  provenance: {
    build: { kind: 'unrecorded' },
    port: 'Lighthouse',
    theme: 'lighthouse',
  },
  sections: [],
  subtitle: 'Read as 1.2.2',
  title: '1104971053',
}

it('says a log records no version', () => {
  render(<SeedHeader seed={seed} />)
  expect(screen.getByText('Version not found in log')).toBeInTheDocument()
  expect(screen.queryByText('Build not verified')).not.toBeInTheDocument()
})
