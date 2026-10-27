import React from 'react'
import { Link, Outlet, useLocation, useParams } from 'react-router-dom'

import { Spinner } from '@/components/ui/Spinner'
import { WizardStepper } from '@/features/apply-wizard/WizardStepper'

import styles from './JoinStaffLayout.module.scss'
import { PendingInvite, useJoinStaffInvite } from './useJoinStaffInvite'

const WIZARD_STEPS = [
  { label: 'Account', segment: 'account' },
  { label: 'Verify email', segment: 'verify' },
  { label: 'Profile', segment: 'profile' },
  { label: 'Join', segment: 'join' },
]

export interface JoinStaffContext {
  token: string
  invite: PendingInvite
}

const UNAVAILABLE_COPY: Record<string, { title: string; message: string }> = {
  expired: {
    title: 'This invite has expired',
    message:
      'Invites stop working after 7 days. Ask your company to send you a new one.',
  },
  accepted: {
    title: 'This invite has already been used',
    message: 'Log in to your AuxHR account to continue.',
  },
  invalid: {
    title: "This invite link isn't valid",
    message:
      'Check that you copied the whole link from your email, or ask your company to send it again.',
  },
}

const Unavailable: React.FC<{ reason: keyof typeof UNAVAILABLE_COPY }> = ({
  reason,
}) => {
  const { title, message } = UNAVAILABLE_COPY[reason]!
  return (
    <div className={styles.unavailable}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{message}</p>
      <Link to="/login" className={styles.link}>
        Go to login
      </Link>
    </div>
  )
}

const JoinStaffLayout: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const location = useLocation()
  const { invite, isLoading, isInvalid } = useJoinStaffInvite(token)

  if (isLoading) return <Spinner fullPage />
  if (isInvalid || !invite || !token) {
    return (
      <div className={styles.page}>
        <Unavailable reason="invalid" />
      </div>
    )
  }
  if (invite.status !== 'pending') {
    return (
      <div className={styles.page}>
        <Unavailable reason={invite.status} />
      </div>
    )
  }

  const currentSegment = location.pathname.split('/').filter(Boolean).pop()
  const currentIndex = Math.max(
    0,
    WIZARD_STEPS.findIndex((step) => step.segment === currentSegment),
  )
  const context: JoinStaffContext = { token, invite }

  return (
    <div className={`wizard-page ${styles.page}`}>
      <WizardStepper
        steps={WIZARD_STEPS.map(({ label }) => ({ label }))}
        currentIndex={currentIndex}
      />
      <header className={styles.summary}>
        <p className={styles.kicker}>{invite.organizationName}</p>
        <h1 className={styles.heading}>
          {invite.organizationName} has added you as {invite.jobTitle}
        </h1>
        {invite.invitedByName && (
          <p className={styles.by}>Invited by {invite.invitedByName}</p>
        )}
      </header>
      <div className={styles.content}>
        <Outlet context={context} />
      </div>
    </div>
  )
}

export default JoinStaffLayout
