import { formatPlanPrice } from '@/features/pricing/formatPlanPrice'
import type { DisplayCurrency } from '@/features/pricing/hooks/useDisplayCurrency'
import {
  BillingInterval,
  DEFAULT_BILLING_PLAN_KEY,
  PricingFeature,
  PricingPlan,
} from '@/features/pricing/types'

export type PlanPrice = { amount: string; suffix: string; caption: string }

export const planPrice = (
  plan: PricingPlan,
  interval: BillingInterval,
  currency: DisplayCurrency,
  currencySymbol: string,
): PlanPrice => {
  if (plan.key === DEFAULT_BILLING_PLAN_KEY) {
    return {
      amount:
        formatPlanPrice(plan, 'monthly', currency, currencySymbol).amount ??
        '—',
      suffix: '/job listing',
      caption: 'Per listing, no subscription',
    }
  }

  const { amount, yearly } = formatPlanPrice(
    plan,
    interval,
    currency,
    currencySymbol,
  )
  return {
    amount: amount ?? '—',
    suffix: yearly ? '/year' : '/month',
    caption: [yearly ? 'Billed annually' : 'Billed monthly', plan.priceCaption]
      .filter(Boolean)
      .join(' · '),
  }
}

export const planFeatureLabels = (plan: PricingPlan) =>
  plan.features
    .filter((feature) => feature.included !== false)
    .map((feature) => feature.text ?? feature.label ?? '')
    .filter(Boolean)

const resolveFeature = (
  plan: PricingPlan,
  key: string,
  plans: PricingPlan[],
): PricingFeature | undefined => {
  const own = plan.features.find((feature) => feature.key === key)
  if (own || !plan.inherits) return own
  const parent = plans.find((candidate) => candidate.key === plan.inherits)
  return parent ? resolveFeature(parent, key, plans) : undefined
}

export type ComparisonCell =
  | { kind: 'text'; value: string }
  | { kind: 'check' }
  | { kind: 'none' }

export const comparisonCell = (
  plan: PricingPlan,
  key: string,
  plans: PricingPlan[],
): ComparisonCell => {
  const feature = resolveFeature(plan, key, plans)
  if (!feature || feature.included === false) return { kind: 'none' }
  if (feature.kind !== 'metered') return { kind: 'check' }
  if (plan.key === DEFAULT_BILLING_PLAN_KEY && key === 'job_listings') {
    return { kind: 'text', value: 'Per listing' }
  }
  if (feature.limit == null) return { kind: 'text', value: 'Unlimited' }
  return { kind: 'text', value: feature.limit.toLocaleString('en-US') }
}
