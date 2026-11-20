import React, { useState } from 'react'
import { HiOutlineBanknotes } from 'react-icons/hi2'
import { LuCheck, LuPencil } from 'react-icons/lu'

import { Alert } from '@/components/feedback/Alert'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { ColumnDef, DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { usePay } from '@/features/people/hooks/useStaffData'
import { PayPackage } from '@/features/people/types'
import { formatDateOnly } from '@/features/people/utils/formatDate'
import { firstNameOf } from '@/features/people/utils/nameParts'
import { formatAmount, perPeriod } from '@/features/people/utils/payPlan'

import type { EmployeeTabProps } from './employeeTabs'
import { PayPackageForm } from './PayPackageForm'
import styles from './PayTab.module.scss'
import { ShareOptionsCard } from './ShareOptionsCard'

const dayBefore = (dateOnly: string) => {
  const date = new Date(`${dateOnly}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

interface PastRow {
  pkg: PayPackage
  endsOn: string
}

/** Packages that started before the current one, each ending the day before the next began. */
export const pastPackages = (
  packages: PayPackage[],
  current: PayPackage,
): PastRow[] => {
  const byStart = [...packages].sort((a, b) =>
    a.startsOn.localeCompare(b.startsOn),
  )
  return byStart
    .map((pkg, index) => ({ pkg, next: byStart[index + 1] }))
    .filter(({ pkg, next }) => pkg.startsOn < current.startsOn && next)
    .map(({ pkg, next }) => ({ pkg, endsOn: dayBefore(next!.startsOn) }))
    .reverse()
}

const PAST_COLUMNS: ColumnDef<PastRow>[] = [
  {
    key: 'dates',
    header: 'Dates',
    render: ({ pkg, endsOn }) =>
      `${formatDateOnly(pkg.startsOn)} – ${formatDateOnly(endsOn)}`,
  },
  {
    key: 'base',
    header: 'Base salary',
    render: ({ pkg }) =>
      `${formatAmount(pkg.currency, pkg.baseSalary)} / ${
        pkg.period === 'monthly' ? 'month' : 'year'
      }`,
  },
  {
    key: 'bonus',
    header: 'Bonus',
    render: ({ pkg }) => formatAmount(pkg.currency, pkg.bonus),
  },
  {
    key: 'total',
    header: 'Total yearly',
    render: ({ pkg }) => formatAmount(pkg.currency, pkg.totalYearly),
  },
]

const CurrentPackage: React.FC<{ current: PayPackage }> = ({ current }) => (
  <>
    <div className={styles.tiles}>
      <div className={`${styles.tile} ${styles.totalTile}`}>
        <span className={styles.tileLabel}>Total yearly pay</span>
        <span className={styles.tileValue}>
          {formatAmount(current.currency, current.totalYearly)}
        </span>
        <span className={styles.tileCaption}>
          Base + bonus + commission target
        </span>
      </div>
      <div className={styles.tile}>
        <span className={styles.tileLabel}>Base salary</span>
        <span className={styles.tileValue}>
          {formatAmount(current.currency, current.baseSalary)}
        </span>
        <span className={styles.tileCaption}>{perPeriod(current.period)}</span>
      </div>
      <div className={styles.tile}>
        <span className={styles.tileLabel}>Bonus</span>
        <span className={styles.tileValue}>
          {formatAmount(current.currency, current.bonus)}
        </span>
        <span className={styles.tileCaption}>per year</span>
      </div>
      <div className={styles.tile}>
        <span className={styles.tileLabel}>Commission target</span>
        <span className={styles.tileValue}>
          {formatAmount(current.currency, current.commissionTarget)}
        </span>
        <span className={styles.tileCaption}>per year</span>
      </div>
    </div>
    {current.benefits.length > 0 && (
      <div className={styles.benefitRow}>
        <span className={styles.benefitLabel}>Benefits</span>
        <ul className={styles.chips} aria-label="Benefits">
          {current.benefits.map((benefit) => (
            <li key={benefit.id}>
              <LuCheck aria-hidden /> {benefit.name}
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
  isOwner,
}) => {
  const { pay, isLoading, hasError } = usePay(organizationId, staff.id)
  const [isEditing, setIsEditing] = useState(false)
  const isEnded = staff.status === 'ended'
  const canChange = !!isOwner && !isEnded
  const firstName = firstNameOf(staff.fullName)

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
  const past = current ? pastPackages(pay.packages, current) : []
  const upcoming = current
    ? pay.packages
        .filter((pkg) => pkg.startsOn > current.startsOn)
        .sort((a, b) => a.startsOn.localeCompare(b.startsOn))[0]
    : undefined

  return (
    <div className={styles.stack}>
      {isEditing ? (
        <PagePanel
          title={current ? 'Change pay' : 'Set up pay'}
          hint={`For ${staff.fullName} · ${staff.jobTitle}`}>
          <PayPackageForm
            organizationId={organizationId}
            staffId={staff.id}
            staffName={staff.fullName}
            current={current}
            onDone={() => setIsEditing(false)}
          />
        </PagePanel>
      ) : current ? (
        <PagePanel
          title="Current package"
          hint={`Since ${formatDateOnly(current.startsOn)} · ${
            current.period === 'monthly' ? 'Monthly' : 'Yearly'
          } · ${current.currency}`}
          action={
            canChange && (
              <Button
                size="sm"
                variant="outline"
                icon={<LuPencil aria-hidden />}
                onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )
          }>
          <CurrentPackage current={current} />
          {upcoming && (
            <Alert variant="info">
              A new package starts on {formatDateOnly(upcoming.startsOn)}.
            </Alert>
          )}
        </PagePanel>
      ) : isEnded ? (
        <Alert variant="info">No pay was set up for this person.</Alert>
      ) : (
        <PagePanel title="Pay">
          <EmptyState
            icon={<HiOutlineBanknotes size={28} />}
            title={`No pay set up for ${firstName} yet`}
            description={
              isOwner
                ? `Add ${firstName}'s salary, bonus and benefits. Only you and people with “Can manage people” can see it. ${firstName} sees it read-only in My work.`
                : `The company's creator hasn't set up ${firstName}'s pay yet.`
            }
            action={
              isOwner && (
                <Button onClick={() => setIsEditing(true)}>Set up pay</Button>
              )
            }
          />
        </PagePanel>
      )}
      <ShareOptionsCard
        organizationId={organizationId}
        staff={staff}
        grants={pay.grants}
        canEdit={canChange}
      />
      {past.length > 0 && !isEditing && (
        <PagePanel title="Past packages" hint="Kept when pay changes">
          <DataTable
            variant="plain"
            columns={PAST_COLUMNS}
            data={past}
            getRowKey={(row) => row.pkg.id}
            ariaLabel="Past packages"
          />
        </PagePanel>
      )}
    </div>
  )
}
