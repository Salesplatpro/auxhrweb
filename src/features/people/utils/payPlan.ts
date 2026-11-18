import type { CommissionPlan, PayCurrency, PayPeriod } from '../types'

const SYMBOLS: Record<PayCurrency, string> = { NGN: '₦', USD: '$' }

export const currencySymbol = (currency: PayCurrency) => SYMBOLS[currency]

export const formatAmount = (currency: PayCurrency, amount: number) =>
  `${SYMBOLS[currency]}${amount.toLocaleString('en-NG', {
    maximumFractionDigits: 2,
  })}`

export const perPeriod = (period: PayPeriod) =>
  period === 'monthly' ? 'per month' : 'per year'

export const yearlyTotal = (
  period: PayPeriod,
  baseSalary: number,
  bonusPerYear: number,
  commissionTargetPerYear: number,
) =>
  Math.round(
    (baseSalary * (period === 'monthly' ? 12 : 1) +
      bonusPerYear +
      commissionTargetPerYear) *
      100,
  ) / 100

/** "3 tiers · 5% to 10% · 4 people" for the commission plan picker. */
export const planSummary = (plan: CommissionPlan) => {
  const rates = plan.tiers.map((tier) => tier.ratePercent)
  const min = Math.min(...rates)
  const max = Math.max(...rates)
  const parts = [
    `${plan.tiers.length} ${plan.tiers.length === 1 ? 'tier' : 'tiers'}`,
    rates.length === 0 ? null : min === max ? `${min}%` : `${min}% to ${max}%`,
    plan.peopleCount === undefined
      ? null
      : `${plan.peopleCount} ${plan.peopleCount === 1 ? 'person' : 'people'}`,
  ]
  return parts.filter(Boolean).join(' · ')
}
