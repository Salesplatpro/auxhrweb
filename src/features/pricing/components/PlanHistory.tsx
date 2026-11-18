import React from 'react'

import { Button } from '@/components/ui/Button'
import { ColumnDef, DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useProfile } from '@/features/profile/hooks/useProfile'

import { usePlanHistory } from '../hooks/usePlanHistory'
import { usePricingCatalog } from '../hooks/usePricingCatalog'
import { PlanChangeReason, PlanHistoryEntry, PricingCatalog } from '../types'
import { getPlanDisplayName } from '../utils/getPlanDisplayName'
import styles from './PlanHistory.module.scss'

const REASON_LABELS: Record<PlanChangeReason, string> = {
  purchase: 'Plan purchased',
  expired: 'Paid period ended',
  subscription_disabled: 'Subscription cancelled',
  subscription_enabled: 'Subscription activated',
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-NG', { dateStyle: 'medium' })

const formatInterval = (interval: PlanHistoryEntry['billingInterval']) => {
  if (interval === 'annually') return 'Yearly'
  if (interval === 'monthly') return 'Monthly'
  return '—'
}

const buildColumns = (
  catalog?: PricingCatalog,
): ColumnDef<PlanHistoryEntry>[] => [
  {
    key: 'date',
    header: 'Date',
    render: (row) => formatDate(row.createdAt),
  },
  {
    key: 'change',
    header: 'Change',
    render: (row) => (
      <span className={styles.change}>
        <span className={styles.from}>
          {getPlanDisplayName(row.fromPlan, catalog)}
        </span>
        <span aria-hidden className={styles.arrow}>
          →
        </span>
        <span className={styles.visuallyHidden}>to</span>
        <span className={styles.to}>
          {getPlanDisplayName(row.toPlan, catalog)}
        </span>
      </span>
    ),
  },
  {
    key: 'billing',
    header: 'Billing',
    hideBelow: 600,
    render: (row) => formatInterval(row.billingInterval),
  },
  {
    key: 'reason',
    header: 'Reason',
    render: (row) => REASON_LABELS[row.reason] ?? row.reason,
  },
]

export const PlanHistory: React.FC = () => {
  const { profile } = useProfile()
  const { history, isLoading, error, refresh } = usePlanHistory(
    profile?.activeOrganizationId,
  )
  const { catalog } = usePricingCatalog()

  return (
    <section className={styles.section} aria-labelledby="plan-history-title">
      <h2 id="plan-history-title" className={styles.title}>
        Plan history
      </h2>
      <p className={styles.lead}>
        Every change to your company&apos;s plan, newest first.
      </p>

      {error ? (
        <EmptyState
          title="We couldn't load your plan history"
          description="Check your connection and try again."
          action={
            <Button variant="outline" size="sm" onClick={() => refresh()}>
              Try again
            </Button>
          }
        />
      ) : (
        <DataTable
          ariaLabel="Plan history"
          columns={buildColumns(catalog)}
          data={history}
          pageSize={10}
          isLoading={isLoading}
          loadingSkeleton={
            <div className={styles.loading}>
              <Spinner />
            </div>
          }
          getRowKey={(row) => row.id}
          showRowNumber={false}
          emptyState={
            <EmptyState
              title="No plan changes yet"
              description="Upgrades, renewals that lapse and cancellations will show up here."
            />
          }
        />
      )}
    </section>
  )
}
