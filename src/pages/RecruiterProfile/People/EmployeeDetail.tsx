import React, { useState } from 'react'
import { HiOutlineUserMinus } from 'react-icons/hi2'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { HeroGhost, PageHero } from '@/components/layout/PageHero'
import { PageShell } from '@/components/layout/PageShell'
import { Avatar, Button, EmptyState, Tabs } from '@/components/ui'
import { Spinner } from '@/components/ui/Spinner'
import { NoPeopleAccess } from '@/features/people/components/NoPeopleAccess'
import { StaffStatusBadge } from '@/features/people/components/StaffStatusBadge'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useStaffMember } from '@/features/people/hooks/useStaffData'
import { peoplePaths } from '@/features/people/paths'
import { formatDateOnly } from '@/features/people/utils/formatDate'
import { nameParts } from '@/features/people/utils/nameParts'

import styles from './EmployeeDetail.module.scss'
import { EMPLOYEE_TABS } from './employeeTabs'
import { EndEmploymentDialog } from './EndEmploymentDialog'
import { InviteBanner } from './InviteBanner'

export const EmployeeDetail = () => {
  const { staffId } = useParams<{ staffId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { organizationId } = usePeopleAccess()
  const { staff, isLoading, hasError, isForbidden } = useStaffMember(
    organizationId,
    staffId,
  )
  const { sendInvite, isSaving } = useStaffActions(organizationId)
  const [endOpen, setEndOpen] = useState(false)

  if (isForbidden) return <NoPeopleAccess />
  if (isLoading) return <Spinner fullPage />
  if (hasError || !staff || !organizationId) {
    return (
      <PageShell>
        <EmptyState
          title="We couldn't find this employee"
          description="They may have been added to a different company, or the link is wrong."
          action={
            <Link to={peoplePaths.employees}>
              <Button variant="outline">Back to employees</Button>
            </Link>
          }
        />
      </PageShell>
    )
  }

  const activeTab =
    EMPLOYEE_TABS.find((tab) => tab.key === searchParams.get('tab')) ??
    EMPLOYEE_TABS[0]!
  const isEnded = staff.status === 'ended'

  const meta = [
    { label: 'Manager', value: staff.managerName ?? '—' },
    { label: 'Start date', value: formatDateOnly(staff.startDate) },
    ...(isEnded
      ? [{ label: 'Last day', value: formatDateOnly(staff.endDate) }]
      : []),
    {
      label: 'Hired through',
      value: staff.hiredThroughAuxhr ? 'AuxHR' : 'Outside',
    },
    ...(staff.invite.invitedByName
      ? [{ label: 'Invited by', value: staff.invite.invitedByName }]
      : []),
  ]

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker={
          <Link to={peoplePaths.employees} className={styles.back}>
            ← Employees
          </Link>
        }
        identity={<Avatar {...nameParts(staff.fullName)} size="lg" />}
        title={staff.fullName}
        lead={[staff.jobTitle, staff.department].filter(Boolean).join(' · ')}
        pills={<StaffStatusBadge status={staff.status} />}
        meta={meta}
        actions={
          !isEnded && (
            <HeroGhost onClick={() => setEndOpen(true)}>
              <HiOutlineUserMinus aria-hidden /> End employment
            </HeroGhost>
          )
        }
      />

      <InviteBanner
        staff={staff}
        isSaving={isSaving}
        onInvite={() => void sendInvite(staff.id)}
      />

      <Tabs
        tabs={EMPLOYEE_TABS.map(({ key, label }) => ({ key, label }))}
        activeKey={activeTab.key}
        onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
      />

      <activeTab.Component staff={staff} organizationId={organizationId} />

      <EndEmploymentDialog
        staff={endOpen ? staff : null}
        organizationId={organizationId}
        onClose={() => setEndOpen(false)}
      />
    </PageShell>
  )
}
