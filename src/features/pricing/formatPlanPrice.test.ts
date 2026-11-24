import { describe, expect, it } from 'vitest'

import { formatPlanPrice } from './formatPlanPrice'
import type { PricingPlan } from './types'

const plan = {
  key: 'sme_basic',
  monthlyAmountNgn: 150000,
  yearlyAmountNgn: 1440000,
  monthlyAmountUsd: 98,
  yearlyAmountUsd: 941,
} as PricingPlan

const payPerUse = {
  key: 'pay_per_use',
  monthlyAmountNgn: 75000,
  yearlyAmountNgn: null,
  monthlyAmountUsd: 50,
  yearlyAmountUsd: null,
} as PricingPlan

describe('formatPlanPrice', () => {
  it('shows naira in Nigeria and dollars elsewhere, monthly or yearly', () => {
    expect(formatPlanPrice(plan, 'monthly', 'NGN', '₦')).toEqual({
      amount: '₦150,000',
      yearly: false,
    })
    expect(formatPlanPrice(plan, 'annually', 'NGN', '₦')).toEqual({
      amount: '₦1,440,000',
      yearly: true,
    })
    expect(formatPlanPrice(plan, 'monthly', 'USD', '₦')).toEqual({
      amount: '$98',
      yearly: false,
    })
    expect(formatPlanPrice(plan, 'annually', 'USD', '₦')).toEqual({
      amount: '$941',
      yearly: true,
    })
  })

  it('falls back to the one-off price for pay per use, which has no yearly price', () => {
    expect(formatPlanPrice(payPerUse, 'annually', 'USD', '₦')).toEqual({
      amount: '$50',
      yearly: false,
    })
  })
})
