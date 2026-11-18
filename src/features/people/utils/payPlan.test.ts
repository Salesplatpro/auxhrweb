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
  const tier = (ratePercent: number) => ({
    fromPercent: 0,
    toPercent: null,
    ratePercent,
    boost: null,
  })

  it('names tiers, the rate range and the people on it', () => {
    expect(
      planSummary({
        id: 'p',
        name: 'Sales',
        tiers: [tier(5), tier(7), tier(10)],
        peopleCount: 4,
      }),
    ).toBe('3 tiers · 5% to 10% · 4 people')
    expect(
      planSummary({ id: 'p', name: 'Flat', tiers: [tier(3)], peopleCount: 1 }),
    ).toBe('1 tier · 3% · 1 person')
    expect(planSummary({ id: 'p', name: 'New', tiers: [tier(3)] })).toBe(
      '1 tier · 3%',
    )
  })
})
