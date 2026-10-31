import React, { useState } from 'react'
import { HiOutlineBanknotes } from 'react-icons/hi2'

import { Alert } from '@/components/feedback/Alert'
import { PagePanel, StatCard, StatGrid } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useBenefits, usePay } from '@/features/people/hooks/useStaffData'
import { PayPackage } from '@/features/people/types'
import { formatDateOnly } from '@/features/people/utils/formatDate'
import { formatMoney } from '@/features/people/utils/formatMoney'

import type { EmployeeTabProps } from './employeeTabs'
import { PayPackageForm } from './PayPackageForm'
import styles from './PayTab.module.scss'
import { ShareOptionsCard } from './ShareOptionsCard'

const PER_PERIOD = { monthly: 'per month', yearly: 'per year' } as const

const yearly = (pkg: PayPackage, amount: number) =>
  pkg.period === 'monthly' ? amount * 12 : amount

const PaySummary: React.FC<{
  current: PayPackage
  history: PayPackage[]
}> = ({ current, history }) => (
  <>
    <StatGrid>
      <StatCard
        label="Yearly pay"
        value={formatMoney(
          current.currency,
          yearly(current, current.baseSalary + current.bonus),
        )}
        caption="Base salary and bonus"
      />
      <StatCard
        label="Commission target"
        value={
          current.commissionTarget
            ? `${formatMoney(current.currency, current.commissionTarget)} ${
                PER_PERIOD[current.period]
              }`
            : 'None'
        }
      />
      <StatCard label="Starts on" value={formatDateOnly(current.startsOn)} />
    </StatGrid>
    <blockquote className={styles.paragraph}>{current.paragraph}</blockquote>
    {current.benefits.length > 0 && (
      <ul className={styles.pills} aria-label="Benefits">
        {current.benefits.map((benefit) => (
          <li key={benefit.id}>{benefit.name}</li>
        ))}
      </ul>
    )}
    {history.length > 1 && (
      <div className={styles.history}>
        <h4>All packages</h4>
        <ul>
          {history.map((pkg) => (
            <li key={pkg.id} aria-current={pkg.id === current.id || undefined}>
              <span>{formatDateOnly(pkg.startsOn)}</span>
              <span>
                {formatMoney(pkg.currency, pkg.baseSalary)}{' '}
                {PER_PERIOD[pkg.period]}
              </span>
              {pkg.id === current.id && (
                <span className={styles.currentTag}>Current</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    )}
  </>
)

export const PayTab: React.FC<EmployeeTabProps> = ({
  staff,
  organizationId,
}) => {
  const { pay, isLoading, hasError } = usePay(organizationId, staff.id)
  const { benefits } = useBenefits(organizationId)
  const [isEditing, setIsEditing] = useState(false)
  const isEnded = staff.status === 'ended'

  if (isLoading) return <Spinner />
  if (hasError || !pay) {
    return (
      <PagePanel title="Pay">
        <p>Couldn&apos;t load pay. Refresh the page to try again.</p>
      </PagePanel>
    )
  }

  const current =
    pay.packages.find((pkg) => pkg.id === pay.currentPackageId) ?? null

  return (
    <div className={styles.stack}>
      {isEditing ? (
        <PagePanel
          title={current ? 'Change pay' : 'Set up pay'}
          hint="Saved pay is recorded in the Activity tab.">
          <PayPackageForm
            organizationId={organizationId}
            staffId={staff.id}
            current={current}
            benefits={benefits}
            onDone={() => setIsEditing(false)}
          />
        </PagePanel>
      ) : current ? (
        <PagePanel
          title="Pay"
          action={
            !isEnded && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )
          }>
          <PaySummary current={current} history={pay.packages} />
        </PagePanel>
      ) : isEnded ? (
        <Alert variant="info">No pay was set up for this person.</Alert>
      ) : (
        <PagePanel title="Pay">
          <EmptyState
            icon={<HiOutlineBanknotes size={28} />}
            title="No pay set up yet"
            description={`Set ${staff.fullName}'s salary, bonus and benefits. The pay paragraph goes into their contracts.`}
            action={
              <Button onClick={() => setIsEditing(true)}>Set up pay</Button>
            }
          />
        </PagePanel>
      )}
      <ShareOptionsCard
        organizationId={organizationId}
        staff={staff}
        grants={pay.grants}
      />
    </div>
  )
}
