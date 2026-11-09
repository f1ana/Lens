import { readSections } from '@/formats/shared/sections'
import { FAILED_MESSAGE } from '@/model/seed'

const body = { content: { kind: 'text' as const, text: 'hello' } }

it('gives each section that reads its id, title and body', () => {
  expect(readSections([{ id: 'a', title: 'A', read: () => body }])).toEqual([
    { id: 'a', title: 'A', ...body },
  ])
})

it('leaves out a section with nothing to show', () => {
  expect(readSections([{ id: 'a', title: 'A', read: () => null }])).toEqual([])
})

it('replaces a section that throws with a notice and keeps the others', () => {
  const sections = readSections([
    {
      id: 'a',
      title: 'A',
      read: () => {
        throw new Error('boom')
      },
    },
    { id: 'b', title: 'B', read: () => body },
  ])
  expect(sections).toEqual([
    {
      id: 'a',
      title: 'A',
      content: { kind: 'failed', message: FAILED_MESSAGE },
    },
    { id: 'b', title: 'B', ...body },
  ])
})
