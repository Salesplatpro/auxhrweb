import { describe, expect, it } from 'vitest'

import {
  nextVest,
  vestedSharesOn,
  vestingDates,
  vestingPreview,
  vestingStage,
} from './vesting'

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

describe('nextVest', () => {
  const ada = {
    shares: 10000,
    grantedOn: '2026-05-01',
    cliffMonths: 6,
    vestingMonths: 48,
  }

  it('points at the cliff before it, then at each month after', () => {
    expect(nextVest(ada, '2026-10-01')).toEqual({
      date: '2026-11-01',
      shares: 1250,
    })
    expect(nextVest(ada, '2026-11-18')).toEqual({
      date: '2026-12-01',
      shares: 208,
    })
  })

  it('gives the remainder on the last month and nothing once all are owned', () => {
    const last = nextVest(ada, '2030-04-15')
    expect(last?.date).toBe('2030-05-01')
    expect(vestedSharesOn(ada, '2030-05-01')).toBe(10000)
    expect(nextVest(ada, '2030-05-01')).toBeNull()
  })

  it('handles a grant dated in the future and a grant on the 31st', () => {
    expect(nextVest(ada, '2026-01-01')?.date).toBe('2026-11-01')
    const noCliff = { ...grant, cliffMonths: 0 }
    expect(nextVest(noCliff, '2026-02-01')).toEqual({
      date: '2026-02-28',
      shares: 100,
    })
  })

  it('vests everything at once when the cliff equals the vesting period', () => {
    const allAtOnce = { ...ada, cliffMonths: 12, vestingMonths: 12 }
    expect(nextVest(allAtOnce, '2026-06-01')).toEqual({
      date: '2027-05-01',
      shares: 10000,
    })
  })
})

describe('vestingStage', () => {
  it('moves from before the cliff to vesting to fully owned', () => {
    expect(vestingStage(grant, '2026-06-01')).toBe('before-cliff')
    expect(vestingStage(grant, '2027-06-01')).toBe('vesting')
    expect(vestingStage(grant, '2030-01-31')).toBe('fully-owned')
  })
})

describe('vestingPreview', () => {
  it('describes the cliff lot, the monthly lot and the end date', () => {
    expect(
      vestingPreview({
        shares: 10000,
        grantedOn: '2026-05-01',
        cliffMonths: 6,
        vestingMonths: 48,
      }),
    ).toEqual({
      firstDate: '2026-11-01',
      firstShares: 1250,
      afterCliff: true,
      monthlyShares: 208,
      fullyOwnedDate: '2030-05-01',
    })
  })

  it('has no monthly lot when everything vests at the cliff, and starts monthly with no cliff', () => {
    expect(
      vestingPreview({
        shares: 900,
        grantedOn: '2026-01-15',
        cliffMonths: 12,
        vestingMonths: 12,
      }).monthlyShares,
    ).toBe(0)
    expect(
      vestingPreview({
        shares: 1200,
        grantedOn: '2026-01-15',
        cliffMonths: 0,
        vestingMonths: 12,
      }),
    ).toMatchObject({
      firstDate: '2026-02-15',
      firstShares: 100,
      afterCliff: false,
    })
  })
})
