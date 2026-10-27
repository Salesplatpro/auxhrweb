import React, { useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { SignupForm } from '@/features/auth/components/SignupForm'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { joinStaffPath } from '@/features/people/paths'

import type { JoinStaffContext } from '../JoinStaffLayout'
import styles from './steps.module.scss'

const AccountStep: React.FC = () => {
  const { token, invite } = useOutletContext<JoinStaffContext>()
  const navigate = useNavigate()
  const isLoggedIn = useAuthStore((state) => !!state.token)
  const base = joinStaffPath(token)

  useEffect(() => {
    if (isLoggedIn) navigate(base, { replace: true })
  }, [isLoggedIn, base, navigate])

  if (isLoggedIn) return null

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <h2 className={styles.cardTitle}>
          {invite.inviteeExists
            ? 'Log in to join'
            : 'Create your AuxHR account'}
        </h2>
        <p className={styles.cardLead}>
          {invite.inviteeExists
            ? `You already have an AuxHR account for ${invite.invitedEmail}. Log in to continue.`
            : `Use ${invite.invitedEmail} so ${invite.organizationName} can link your account.`}
        </p>
        {invite.inviteeExists ? (
          <LoginForm lockedEmail={invite.invitedEmail} hideSignupLink />
        ) : (
          <SignupForm
            forceTalent
            lockedEmail={invite.invitedEmail}
            redirectPath={base}
            onSuccess={() => navigate(base, { replace: true })}
          />
        )}
      </Card>
    </div>
  )
}

export default AccountStep
