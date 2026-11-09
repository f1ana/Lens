import { loadGroupings, saveGroupings } from '@/storage/groupings'

afterEach(() => {
  localStorage.clear()
})

it('round-trips the arrangement picked in each section', () => {
  saveGroupings({ checks: 'type' })
  expect(loadGroupings()).toEqual({ checks: 'type' })
})

it('starts empty when nothing was saved', () => {
  expect(loadGroupings()).toEqual({})
})

it.each([
  ['text that is not JSON', '[1,2'],
  ['a list', '["type"]'],
  ['a number', '5'],
  ['a choice that is not a string', '{"checks":5}'],
  ['a null choice', '{"checks":null}'],
])('ignores %s', (_name, raw) => {
  localStorage.setItem('lens.groupings', raw)
  expect(loadGroupings()).toEqual({})
})
