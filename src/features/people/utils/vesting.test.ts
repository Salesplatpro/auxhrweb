import { describe, expect, it } from 'vitest'

import { vestedSharesOn, vestingDates } from './vesting'

const grant = {
  shares: 4800,
  grantedOn: '2026-01-31',
  cliffMonths: 12,
  vestingMonths: 48,
}

describe('vestedSharesOn', () => {
  it('owns nothing before the cliff', () => {
    expect(vestedSharesOn(grant, '2026-01-31')).toBe(0)
    expect(vestedSharesOn(grant, '2027-01-30')).toBe(0)
  })

  it('owns the cliff share on the cliff day', () => {
    expect(vestedSharesOn(grant, '2027-01-31')).toBe(1200)
  })

  it('adds one month of shares on each monthly date', () => {
    expect(vestedSharesOn(grant, '2027-02-27')).toBe(1200)
    expect(vestedSharesOn(grant, '2027-02-28')).toBe(1300)
    expect(vestedSharesOn(grant, '2027-03-31')).toBe(1400)
  })

  it('vests on the last day of shorter months', () => {
    const monthly = { ...grant, cliffMonths: 0 }
    expect(vestedSharesOn(monthly, '2028-02-28')).toBe(2400)
    expect(vestedSharesOn(monthly, '2028-02-29')).toBe(2500)
  })

  it('owns everything from the last vesting date', () => {
    expect(vestedSharesOn(grant, '2030-01-30')).toBe(4700)
    expect(vestedSharesOn(grant, '2030-01-31')).toBe(4800)
    expect(vestedSharesOn(grant, '2040-01-01')).toBe(4800)
  })

  it('rounds down part shares', () => {
    expect(vestedSharesOn({ ...grant, shares: 10 }, '2027-02-28')).toBe(2)
  })
})

describe('vestingDates', () => {
  it('gives the cliff and fully vested dates', () => {
    expect(vestingDates(grant)).toEqual({
      cliffDate: '2027-01-31',
      fullyVestedDate: '2030-01-31',
    })
  })
})
