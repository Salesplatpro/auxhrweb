import React from 'react'

import { Spinner } from '@/components/ui/Spinner'
import { useOrganizationUsage } from '@/features/organizations/hooks/useOrganizationUsage'
import { useProfile } from '@/features/profile/hooks/useProfile'

import { usePricingCatalog } from '../hooks/usePricingCatalog'
import { DEFAULT_BILLING_PLAN_KEY, isPayPerUsePlan } from '../types'
import { getBillingPlanBadge } from '../utils/getBillingPlanBadge'
import { getPlanDisplayName } from '../utils/getPlanDisplayName'
import styles from './PlanUsage.module.scss'

type PlanUsageProps = {
  interval?: string | null
  planKey?: string | null
  billingStatus?: string | null
  billingPeriodEnd?: string | null
}

const formatLimit = (limit: number | null) =>
  limit == null ? 'Unlimited' : limit.toLocaleString()

const meterPct = (used: number, limit: number | null) => {
  if (limit == null || limit <= 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

export const PlanUsage: React.FC<PlanUsageProps> = ({
  interval,
  planKey,
  billingStatus,
  billingPeriodEnd,
}) => {
  const { profile } = useProfile()
  const orgId = profile?.activeOrganizationId
  const { usage, isLoading } = useOrganizationUsage(orgId)
  const { catalog } = usePricingCatalog()

  const effectivePlan =
    usage?.billingPlan ?? planKey ?? DEFAULT_BILLING_PLAN_KEY
  const name = getPlanDisplayName(effectivePlan, catalog)
  const period =
    (usage?.billingInterval ?? interval) === 'annually' ? 'yearly' : 'monthly'
  const payPerUse = isPayPerUsePlan(effectivePlan)
  const badge = getBillingPlanBadge(effectivePlan)
  const meters = usage?.meters ?? []
  const flags = (usage?.flags ?? []).filter((f) => f.included)
  const periodEnd = usage?.billingPeriodEnd ?? billingPeriodEnd
  const status = usage?.billingStatus ?? billingStatus

  if (isLoading && !usage) {
    return (
      <div className={styles.page}>
        <Spinner />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Current plan</p>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>You&apos;re on {name}</h2>
          <span
            className={styles.badge}
            style={{
              backgroundColor: badge.backgroundColor,
              color: badge.color,
            }}>
            {badge.status}
          </span>
        </div>
        <p className={styles.subtitle}>
          {payPerUse
            ? 'Pay when you activate a job listing — no monthly subscription.'
            : `Hiring tools on the ${period} plan${
                status ? ` · ${status.replace(/_/g, ' ')}` : ''
              }.`}
        </p>
        {periodEnd && !payPerUse && (
          <p className={styles.periodEnd}>
            Renews or ends{' '}
            {new Date(periodEnd).toLocaleDateString('en-NG', {
              dateStyle: 'medium',
            })}
          </p>
        )}
      </header>

      {meters.length > 0 && (
        <div className={styles.grid}>
          {meters.map((item) => {
            const pct = meterPct(item.used, item.limit)
            const atLimit = item.limit != null && item.used >= item.limit
            return (
              <article key={item.key} className={styles.card}>
                <p className={styles.label}>{item.label}</p>
                <p className={styles.value}>
                  {item.used.toLocaleString()}
                  <span className={styles.valueSuffix}>
                    {' '}
                    / {formatLimit(item.limit)}
                  </span>
                </p>
                <div className={styles.barTrack} aria-hidden>
                  <div
                    className={atLimit ? styles.barFillWarn : styles.barFill}
                    style={{ width: `${item.limit == null ? 8 : pct}%` }}
                  />
                </div>
                <p className={styles.limit}>
                  {item.period === 'monthly' ? 'This month' : 'Active now'}
                </p>
              </article>
            )
          })}
        </div>
      )}

      {flags.length > 0 && (
        <div className={styles.flags}>
          <p className={styles.flagsTitle}>Included tools</p>
          <ul className={styles.flagList}>
            {flags.map((flag) => (
              <li key={flag.key}>{flag.label}</li>
            ))}
          </ul>
        </div>
      )}

      {payPerUse && (
        <p className={styles.note}>
          Activating a job moves it to pending payment. Complete checkout to go
          live. Upgrade below for concurrent listings and team seats without
          per-job charges.
        </p>
      )}
    </div>
  )
}
