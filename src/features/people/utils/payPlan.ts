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

const formatRate = (rate: number) => `${rate}%`

/** "3 tiers · 5% → 7.5% → 10%" for a plan's bands. */
export const tierSummary = (plan: CommissionPlan) => {
  const bands = plan.bands ?? []
  if (bands.length === 0) return 'Needs tiers'
  return `${bands.length} ${bands.length === 1 ? 'tier' : 'tiers'} · ${bands
    .map((band) => formatRate(band.ratePercent))
    .join(' → ')}`
}

/** "3 tiers · 5% → 10% · 4 people" for the commission plan picker. */
export const planSummary = (plan: CommissionPlan) =>
  [
    tierSummary(plan),
    plan.peopleCount === undefined
      ? null
      : `${plan.peopleCount} ${plan.peopleCount === 1 ? 'person' : 'people'}`,
  ]
    .filter(Boolean)
    .join(' · ')
