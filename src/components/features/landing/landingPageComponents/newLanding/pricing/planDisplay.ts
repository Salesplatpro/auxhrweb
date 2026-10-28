import {
  BillingInterval,
  DEFAULT_BILLING_PLAN_KEY,
  PricingFeature,
  PricingPlan,
} from '@/features/pricing/types'

const formatUsd = (amount: number) => `$${amount.toLocaleString('en-US')}`

const formatNgn = (amount: number, symbol: string) =>
  `${symbol}${amount.toLocaleString('en-NG')}`

export type PlanPrice = { amount: string; suffix: string; caption: string }

export const planPrice = (
  plan: PricingPlan,
  interval: BillingInterval,
  currencySymbol: string,
): PlanPrice => {
  if (plan.key === DEFAULT_BILLING_PLAN_KEY) {
    return {
      amount: formatUsd(plan.monthlyAmountUsd),
      suffix: '/job listing',
      caption: `${formatNgn(
        plan.monthlyAmountNgn,
        currencySymbol,
      )} per listing, no subscription`,
    }
  }

  const useYearly =
    interval === 'annually' &&
    plan.yearlyAmountUsd != null &&
    plan.yearlyAmountNgn != null
  const ngn = useYearly
    ? `${formatNgn(plan.yearlyAmountNgn ?? 0, currencySymbol)} billed annually`
    : `${formatNgn(plan.monthlyAmountNgn, currencySymbol)} billed monthly`

  return {
    amount: formatUsd(
      useYearly ? plan.yearlyAmountUsd ?? 0 : plan.monthlyAmountUsd,
    ),
    suffix: useYearly ? '/year' : '/month',
    caption: [ngn, plan.priceCaption].filter(Boolean).join(' · '),
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
