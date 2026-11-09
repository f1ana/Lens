import { readableName } from '../../scripts/lib/readable-name'

const ABBREVIATIONS = [
  'MM',
  'TTC',
  'CC',
  'BGS',
  'FP',
  'GL',
  'GV',
  'CCW',
  'RBB',
  'MMM',
  'SM',
]

it('drops the prefix and the first matching world abbreviation', () => {
  expect(readableName('RC_BGS_JIGGY_CROCTUS', 'RC_', ABBREVIATIONS)).toBe(
    'Jiggy Croctus',
  )
  expect(
    readableName('RC_MMM_JIGGY_INSIDE_THE_WELLS_BUCKET', 'RC_', ABBREVIATIONS),
  ).toBe('Jiggy Inside The Wells Bucket')
  expect(
    readableName('RC_CCW_NOTE_SPRING_LOWER_TREE_LEDGE_3', 'RC_', ABBREVIATIONS),
  ).toBe('Note Spring Lower Tree Ledge 3')
  expect(readableName('RC_SM_MOLEHILL_ATTACK', 'RC_', ABBREVIATIONS)).toBe(
    'Molehill Attack',
  )
})

it('keeps 2Ship behavior without abbreviations', () => {
  expect(readableName('RO_HP_SHUFFLE', 'RO_')).toBe('HP Shuffle')
})
