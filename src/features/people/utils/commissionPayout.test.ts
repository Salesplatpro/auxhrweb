import { describe, expect, it } from 'vitest'

import { commissionPayout } from './commissionPayout'

const tiers = [
  { fromPercent: 0, toPercent: 80, ratePercent: 5, boost: null },
  { fromPercent: 80, toPercent: 100, ratePercent: 8, boost: null },
  { fromPercent: 100, toPercent: null, ratePercent: 12, boost: 1.5 },
]

const TARGET = 1_000_000

describe('commissionPayout', () => {
  it.each([
    [0, 0, null],
    [799_900, 39_995, 0],
    [800_000, 64_000, 1],
    [999_900, 79_992, 1],
    [1_000_000, 180_000, 2],
    [1_200_000, 216_000, 2],
  ])('pays %d of target at the reached tier', (actual, payout, tierIndex) => {
    expect(commissionPayout(tiers, TARGET, actual)).toEqual({
      attainmentPercent: (actual / TARGET) * 100,
      tierIndex,
      payout,
    })
  })

  it('pays nothing without a target', () => {
    expect(commissionPayout(tiers, 0, 500_000)).toEqual({
      attainmentPercent: null,
      tierIndex: null,
      payout: 0,
    })
  })
})
