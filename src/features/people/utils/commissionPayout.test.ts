import { describe, expect, it } from 'vitest'

import { commissionPayout } from './commissionPayout'

const bands = [
  { fromAmount: 0, toAmount: 5_000_000, ratePercent: 5 },
  { fromAmount: 5_000_000, toAmount: 10_000_000, ratePercent: 7.5 },
  { fromAmount: 10_000_000, toAmount: null, ratePercent: 10 },
]

describe('commissionPayout', () => {
  it('pays each band its rate on the sales inside it', () => {
    expect(commissionPayout(bands, 8_000_000)).toEqual({
      lines: [
        { inside: 5_000_000, ratePercent: 5, amount: 250_000 },
        { inside: 3_000_000, ratePercent: 7.5, amount: 225_000 },
      ],
      total: 475_000,
    })
  })

  it('pays on everything above the last limit at the last rate', () => {
    expect(commissionPayout(bands, 12_000_000).total).toBe(825_000)
  })

  it('pays nothing when there are no sales', () => {
    expect(commissionPayout(bands, 0)).toEqual({ lines: [], total: 0 })
  })

  it('rounds to the kobo', () => {
    expect(commissionPayout(bands, 3.33).total).toBe(0.17)
  })
})
