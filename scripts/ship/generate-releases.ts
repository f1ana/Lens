// For spotting official builds

import { isBelowMinimum } from '../../src/formats/ship/version.ts'
import { writeReleaseList } from '../lib/github-releases.ts'

writeReleaseList(
  'HarbourMasters/Shipwright',
  'ship',
  (version) => !isBelowMinimum(version),
)
