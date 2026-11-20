import { describe, expect, it } from 'vitest'

import { planSummary, yearlyTotal } from './payPlan'

describe('yearlyTotal', () => {
  it('counts salary for a year and adds yearly bonus and target once', () => {
    expect(yearlyTotal('monthly', 350000, 600000, 600000)).toBe(5400000)
    expect(yearlyTotal('yearly', 6000000, 0, 0)).toBe(6000000)
    expect(yearlyTotal('monthly', 0.1, 0.2, 0)).toBe(1.4)
  })
})

describe('planSummary', () => {
  const band = (ratePercent: number) => ({
    fromAmount: 0,
    toAmount: null,
    ratePercent,
  })
  const plan = (rates: number[], peopleCount?: number) => ({
    id: 'p',
    name: 'Sales',
    paidOn: 'yearly_sales' as const,
    frequency: 'quarterly' as const,
    bands: rates.map(band),
    needsBands: false,
    peopleCount,
  })

  it('names tiers, the rates and the people on it', () => {
    expect(planSummary(plan([5, 7.5, 10], 4))).toBe(
      '3 tiers · 5% → 7.5% → 10% · 4 people',
    )
    expect(planSummary(plan([3], 1))).toBe('1 tier · 3% · 1 person')
    expect(planSummary(plan([3]))).toBe('1 tier · 3%')
  })

  it('says when a plan still needs its tiers', () => {
    expect(
      planSummary({
        ...plan([]),
        bands: null,
        needsBands: true,
        peopleCount: 2,
      }),
    ).toBe('Needs tiers · 2 people')
  })
})
