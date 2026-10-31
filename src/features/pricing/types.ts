export interface PricingFeature {
  text?: string
  label?: string
  included?: boolean
  key?: string
  kind?: 'metered' | 'flag'
  limit?: number | null
  period?: 'concurrent' | 'monthly'
}

export type SubscriptionPlanKey = 'sme_basic' | 'pro' | 'advance' | 'enterprise'

export type PricingPlanKey =
  | 'free'
  | 'paid'
  | 'pay_per_use'
  | SubscriptionPlanKey
  | string

export interface PricingPlan {
  key: PricingPlanKey
  name: string
  description: string
  priceCaption?: string
  badge?: string
  badgeTone?: 'success'
  cta: string
  secondaryCta?: string
  highlighted: boolean
  visible?: boolean
  purchasable?: boolean
  monthlyAmountNgn: number
  /** Null when the plan has no annual price (e.g. pay_per_use). */
  yearlyAmountNgn: number | null
  /** Display-only USD; checkout still bills in NGN. */
  monthlyAmountUsd: number
  yearlyAmountUsd: number | null
  featuresIntro?: string | null
  features: PricingFeature[]
  inherits?: PricingPlanKey
}

export interface ComparisonRow {
  id: string
  label: string
  hint: string | null
  free: string | boolean
  paid: string | boolean
}

export interface PricingCatalog {
  currency: string
  currencySymbol: string
  yearlyDiscountPercent: number
  guarantee: string
  cancelAnytime: string
  hero: { kicker: string; title: string; subtitle: string }
  plans: PricingPlan[]
  comparison?: { columns: string[]; rows: ComparisonRow[] }
  valueProps: {
    badge: string
    title: string
    body: string
    items: Array<{ title: string; body: string; icon: string }>
  }
  contact: { prompt: string; cta: string; href: string }
}

export interface PricingApiResponse {
  status: boolean
  message: string
  data: PricingCatalog
}

export type BillingInterval = 'monthly' | 'annually'
export type BillingPlan = PricingPlanKey
export type BillingStatus = 'active' | 'past_due' | 'cancelled'

export type PlanChangeReason =
  | 'purchase'
  | 'expired'
  | 'subscription_disabled'
  | 'subscription_enabled'

export interface PlanHistoryEntry {
  id: string
  fromPlan: string | null
  toPlan: string
  billingInterval: BillingInterval | null
  reason: PlanChangeReason
  paymentId: string | null
  createdAt: string
}

export interface PlanHistoryApiResponse {
  status: boolean
  message: string
  data: { history: PlanHistoryEntry[] }
}

/** Default for every new organization — pay when activating a job. */
export const DEFAULT_BILLING_PLAN_KEY = 'pay_per_use'

export const isPayPerUsePlan = (billingPlan?: string | null): boolean =>
  !billingPlan || billingPlan === DEFAULT_BILLING_PLAN_KEY

/** Subscription checkout via `/payments` — excludes pay_per_use and hidden/legacy. */
export const isSubscriptionPlan = (plan: PricingPlan): boolean =>
  plan.key !== DEFAULT_BILLING_PLAN_KEY &&
  plan.visible !== false &&
  plan.purchasable !== false

export const isSubscriptionPlanKey = (
  key: string,
  plans?: PricingPlan[],
): boolean => {
  if (plans?.length) {
    const plan = plans.find((p) => p.key === key)
    return plan ? isSubscriptionPlan(plan) : false
  }
  return Boolean(key) && key !== DEFAULT_BILLING_PLAN_KEY && key !== 'paid'
}
