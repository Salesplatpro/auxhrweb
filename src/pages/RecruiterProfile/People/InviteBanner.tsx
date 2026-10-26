import React from 'react'

import { Button } from '@/components/ui/Button'
import { StaffMember } from '@/features/people/types'
import { formatDateOnly } from '@/features/people/utils/formatDate'
import {
  canSendInvite,
  inviteActionLabel,
} from '@/features/people/utils/staffInvite'

import styles from './InviteBanner.module.scss'

interface InviteBannerProps {
  staff: StaffMember
  isSaving: boolean
  onInvite: () => void
}

type Tone = 'info' | 'warning' | 'success'

const describe = (staff: StaffMember): { tone: Tone; text: string } => {
  const { invite } = staff
  const by = invite.invitedByName ?? 'someone on your team'

  switch (invite.state) {
    case 'accepted':
      return {
        tone: 'success',
        text: `Joined AuxHR on ${formatDateOnly(
          invite.joinedAt,
        )}. Invited by ${by}.`,
      }
    case 'pending':
      return {
        tone: 'info',
        text: `Invited by ${by} on ${formatDateOnly(
          invite.invitedAt,
        )}. The invite expires on ${formatDateOnly(invite.expiresAt)}.`,
      }
    case 'expired':
      return {
        tone: 'warning',
        text: `The invite sent by ${by} expired on ${formatDateOnly(
          invite.expiresAt,
        )}.`,
      }
    default:
      return {
        tone: 'info',
        text: 'Not on AuxHR yet. Send an invite so they can see their contracts, pay and first-week tasks.',
      }
  }
}

export const InviteBanner: React.FC<InviteBannerProps> = ({
  staff,
  isSaving,
  onInvite,
}) => {
  if (staff.status === 'ended') return null
  const { tone, text } = describe(staff)

  return (
    <div className={`${styles.banner} ${styles[tone]}`} role="status">
      <p className={styles.text}>{text}</p>
      {canSendInvite(staff) && (
        <Button
          size="sm"
          variant="outline"
          loading={isSaving}
          onClick={onInvite}>
          {inviteActionLabel(staff)}
        </Button>
      )}
    </div>
  )
}
