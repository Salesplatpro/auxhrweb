import React, { useState } from 'react'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { HiOutlinePlus, HiOutlineReceiptPercent } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import { ColumnDef, DataTable, TableActions } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { Pill } from '@/components/ui/Pill'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useCommissionPlans } from '@/features/people/hooks/useStaffData'
import { peoplePaths } from '@/features/people/paths'
import { CommissionPlan } from '@/features/people/types'
import { PAID_ON_LABELS } from '@/features/people/utils/commissionLabels'
import { formatCount } from '@/features/people/utils/formatMoney'
import { tierSummary } from '@/features/people/utils/payPlan'

import styles from './CommissionPlans.module.scss'

const peopleOnIt = (plan: CommissionPlan) => {
  const count = plan.peopleCount ?? 0
  const names = plan.people ?? []
  const extra = count - names.length
  return {
    heading: `${formatCount(count)} ${count === 1 ? 'person' : 'people'}`,
    names:
      count === 0
        ? 'Nobody yet'
        : `${names.join(', ')}${extra > 0 ? ` +${extra}` : ''}`,
  }
}

export const CommissionPlans = () => {
  const navigate = useNavigate()
  const { organizationId } = usePeopleAccess()
  const { plans, isLoading, hasError } = useCommissionPlans(organizationId)
  const { removeCommissionPlan, isSaving } = useStaffActions(organizationId)
  const [planToDelete, setPlanToDelete] = useState<CommissionPlan | null>(null)

  const newPlan = () => navigate(peoplePaths.newCommissionPlan)

  const columns: ColumnDef<CommissionPlan>[] = [
    {
      key: 'name',
      header: 'Plan',
      render: (plan) => (
        <span className={styles.cell}>
          <strong>{plan.name}</strong>
          {plan.needsBands ? (
            <span>
              <Pill tone="warning" size="sm">
                Needs tiers
              </Pill>
            </span>
          ) : (
            <span className={styles.muted}>{tierSummary(plan)}</span>
          )}
        </span>
      ),
    },
    {
      key: 'paidOn',
      header: 'Paid on',
      hideBelow: 768,
      render: (plan) => (plan.paidOn ? PAID_ON_LABELS[plan.paidOn] : '—'),
    },
    {
      key: 'people',
      header: 'People on it',
      render: (plan) => {
        const people = peopleOnIt(plan)
        return (
          <span className={styles.cell}>
            <span>{people.heading}</span>
            <span className={styles.muted}>{people.names}</span>
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (plan) => (
        <TableActions>
          <Dropdown
            trigger={<BsThreeDotsVertical aria-label="Plan actions" />}
            items={[
              {
                label: 'Edit',
                onClick: () => navigate(peoplePaths.commissionPlan(plan.id)),
              },
              {
                label: 'Delete',
                danger: true,
                onClick: () => setPlanToDelete(plan),
              },
            ]}
          />
        </TableActions>
      ),
    },
  ]

  const handleDelete = async () => {
    if (planToDelete && (await removeCommissionPlan(planToDelete))) {
      setPlanToDelete(null)
    }
  }

  return (
    <PageShell wide>
      <PageHeaderTitle
        breadcrumbs={[
          { label: 'People', to: peoplePaths.employees },
          { label: 'Commission plans' },
        ]}
        title="Commission plans"
        description="How much people earn on what they sell. Pick a plan on each person's Pay tab."
      />

      {hasError ? (
        <EmptyState
          title="Couldn't load commission plans"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : (
        <PagePanel
          flush
          title="All plans"
          hint={`${formatCount(plans.length)} ${
            plans.length === 1 ? 'plan' : 'plans'
          }`}
          action={
            plans.length > 0 ? (
              <Button icon={<HiOutlinePlus />} onClick={newPlan}>
                New plan
              </Button>
            ) : undefined
          }>
          <DataTable
            columns={columns}
            data={plans}
            isLoading={isLoading}
            getRowKey={(plan) => plan.id}
            ariaLabel="Commission plans"
            showRowNumber={false}
            emptyState={
              <EmptyState
                icon={<HiOutlineReceiptPercent />}
                title="No commission plans yet"
                description="Create a plan once, then pick it on anyone's Pay tab."
                action={
                  <Button icon={<HiOutlinePlus />} onClick={newPlan}>
                    New plan
                  </Button>
                }
              />
            }
          />
        </PagePanel>
      )}

      <ConfirmDialog
        open={!!planToDelete}
        title={`Delete ${planToDelete?.name ?? 'this plan'}?`}
        message="Plans given to someone can't be deleted. Remove the plan from their pay first."
        confirmLabel="Delete plan"
        variant="danger"
        isConfirming={isSaving}
        onConfirm={handleDelete}
        onCancel={() => setPlanToDelete(null)}
      />
    </PageShell>
  )
}
