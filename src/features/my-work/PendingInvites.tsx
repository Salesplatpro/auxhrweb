import React, { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import {
  acceptMyStaffInvite,
  fetchMyStaffInvites,
  MY_STAFF_INVITES_KEY,
  MY_WORK_KEY,
} from '@/features/people/services/peopleService'
import { getErrorCode, getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './MyWork.module.scss'

export const PendingInvites = () => {
  const { data: invites = [], mutate } = useSWR(
    MY_STAFF_INVITES_KEY,
    fetchMyStaffInvites,
  )
  const { mutate: revalidate } = useSWRConfig()
  const [accepting, setAccepting] = useState<string | null>(null)

  if (invites.length === 0) return null

  const accept = async (staffId: string) => {
    setAccepting(staffId)
    try {
      const joined = await acceptMyStaffInvite(staffId)
      notify('success', `You've joined ${joined.organizationName}`)
      await Promise.all([mutate(), revalidate(MY_WORK_KEY)])
    } catch (error) {
      notify(
        'error',
        getErrorCode(error) === 'PROFILE_INCOMPLETE'
          ? 'Complete your profile before joining this company.'
          : getErrorMessage(error, 'We could not add you to this company'),
      )
    } finally {
      setAccepting(null)
    }
  }

  return (
    <PagePanel title="Invites waiting for you">
      <ul className={styles.invites}>
        {invites.map((invite) => (
          <li key={invite.id} className={styles.invite}>
            <span>
              <span className={styles.inviteTitle}>
                {invite.organizationName} added you as staff
              </span>
              <span className={styles.muted}>
                {[
                  invite.jobTitle,
                  invite.invitedByName && `Invited by ${invite.invitedByName}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <Button
              variant="gradient"
              loading={accepting === invite.id}
              disabled={!!accepting}
              onClick={() => void accept(invite.id)}>
              Accept
            </Button>
          </li>
        ))}
      </ul>
    </PagePanel>
  )
}
