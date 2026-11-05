import { describe, expect, it } from 'vitest'

import { currentQuarter, nearbyQuarters } from './quarters'

describe('quarters', () => {
  it('uses Lagos time at the edge of a quarter', () => {
    expect(currentQuarter(new Date('2026-12-31T22:59:00Z'))).toBe('2026-Q4')
    expect(currentQuarter(new Date('2026-12-31T23:00:00Z'))).toBe('2027-Q1')
  })

  it('offers nearby quarters across a year end', () => {
    expect(nearbyQuarters('2027-Q1')).toEqual([
      '2026-Q3',
      '2026-Q4',
      '2027-Q1',
      '2027-Q2',
      '2027-Q3',
    ])
  })
})
