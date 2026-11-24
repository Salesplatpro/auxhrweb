import type { DisplayCurrency } from './hooks/useDisplayCurrency'
import type { BillingInterval, PricingPlan } from './types'

/** A plan's price in the visitor's currency, yearly when asked for and the plan has one. */
export const formatPlanPrice = (
  plan: PricingPlan,
  interval: BillingInterval,
  currency: DisplayCurrency,
  ngnSymbol: string,
): { amount: string | null; yearly: boolean } => {
  const yearly =
    interval === 'annually' &&
    plan.yearlyAmountNgn != null &&
    plan.yearlyAmountUsd != null
  const value =
    currency === 'NGN'
      ? yearly
        ? plan.yearlyAmountNgn
        : plan.monthlyAmountNgn
      : yearly
      ? plan.yearlyAmountUsd
      : plan.monthlyAmountUsd
  if (value == null || Number.isNaN(value)) return { amount: null, yearly }
  return {
    amount:
      currency === 'NGN'
        ? `${ngnSymbol}${value.toLocaleString('en-NG')}`
        : `$${value.toLocaleString('en-US')}`,
    yearly,
  }
}
