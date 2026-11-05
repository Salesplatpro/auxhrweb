import { describe, expect, it } from 'vitest'

import { MonthlyFeedback } from '../types'
import { ratingSeries } from './ratingSeries'

const row = (month: string, rating: number): MonthlyFeedback => ({
  id: month,
  month,
  rating,
  notes: `Notes for ${month}`,
  byName: 'Mo',
  version: 1,
  updatedAt: '',
})

describe('ratingSeries', () => {
  it('is empty with no feedback', () => {
    expect(ratingSeries([])).toEqual([])
  })

  it('leaves a gap for a skipped month and crosses a new year', () => {
    const points = ratingSeries([row('2026-11', 4), row('2027-02', 2)])
    expect(points.map((point) => point.month)).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ])
    expect(points.map((point) => point.rating)).toEqual([4, null, null, 2])
    expect(points[1]!.notes).toBe('')
  })

  it('handles one month', () => {
    expect(ratingSeries([row('2026-11', 5)])).toEqual([
      { month: '2026-11', rating: 5, notes: 'Notes for 2026-11' },
    ])
  })
})
