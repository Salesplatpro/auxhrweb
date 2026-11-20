import React from 'react'
import { HiOutlineEnvelope, HiOutlineLockClosed } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'

import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'

import { usePeopleAccess } from '../hooks/usePeopleAccess'
import { useStaffActions } from '../hooks/useStaffActions'
import styles from './NoPeopleAccess.module.scss'

export const NoPeopleAccess = () => {
  const navigate = useNavigate()
  const { organizationId, hasPeopleAccess, ownerFirstName, accessRequested } =
    usePeopleAccess()
  const { requestAccess, isSaving } = useStaffActions(organizationId)

  if (hasPeopleAccess) {
    return (
      <PageShell>
        <EmptyState
          icon={<HiOutlineLockClosed />}
          title="You don't have access to this"
          description="Ask your company's creator."
        />
      </PageShell>
    )
  }

  const owner = ownerFirstName ?? 'the owner'

  return (
    <PageShell>
      <EmptyState
        icon={<HiOutlineLockClosed />}
        title="You don't have access to People"
        description={`Staff pay, contracts and performance are only for people the owner allows. Ask ${owner} if you need access.`}
        action={
          <div className={styles.actions}>
            <Button
              variant="outline"
              onClick={() => navigate('/recruiterDashboard/dashboard')}>
              Back to dashboard
            </Button>
            <Button
              variant="ink"
              icon={<HiOutlineEnvelope />}
              loading={isSaving}
              disabled={accessRequested}
              onClick={() => requestAccess(ownerFirstName)}>
              {accessRequested
                ? 'Request sent'
                : `Ask ${ownerFirstName ?? 'the owner'} for access`}
            </Button>
          </div>
        }
      />
    </PageShell>
  )
}
