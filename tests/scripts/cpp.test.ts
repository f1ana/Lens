import { enumValues } from '../../scripts/lib/cpp'

it('reads explicit and implicit enum values', () => {
  const h = [
    'enum level_e',
    '{',
    '    LEVEL_1_MUMBOS_MOUNTAIN = 0x1,',
    '    LEVEL_2_TREASURE_TROVE_COVE, // a comment',
    '    LEVEL_B_SPIRAL_MOUNTAIN = 0xB,',
    '    LEVEL_C_BOSS = 12,',
    '    LEVEL_D_CUTSCENE',
    '};',
  ].join('\n')
  expect(enumValues(h, 'level_e', 'enums.h')).toEqual(
    new Map([
      ['LEVEL_1_MUMBOS_MOUNTAIN', 1],
      ['LEVEL_2_TREASURE_TROVE_COVE', 2],
      ['LEVEL_B_SPIRAL_MOUNTAIN', 11],
      ['LEVEL_C_BOSS', 12],
      ['LEVEL_D_CUTSCENE', 13],
    ]),
  )
})

it('starts an enum at zero', () => {
  expect(
    enumValues('enum ability_e {\n  A,\n  B,\n};', 'ability_e', 'a.h'),
  ).toEqual(
    new Map([
      ['A', 0],
      ['B', 1],
    ]),
  )
})

it('names the file when the enum is missing', () => {
  expect(() => enumValues('', 'item_e', 'include/enums.h')).toThrow(
    /include\/enums\.h/,
  )
})
