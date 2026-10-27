import React, { useEffect } from 'react'
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom'

import { Alert } from '@/components/feedback'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useProfile } from '@/features/profile/hooks/useProfile'

import styles from './JoinStaffEntry.module.scss'
import type { JoinStaffContext } from './JoinStaffLayout'

type JoinStaffStep =
  | 'loading'
  | 'account'
  | 'wrong-role'
  | 'wrong-email'
  | 'verify'
  | 'profile'
  | 'join'

export const useJoinStaffStep = (invitedEmail: string): JoinStaffStep => {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const { profile, isLoading } = useProfile()

  if (!token) return 'account'
  if (user?.userRole !== 'talent') return 'wrong-role'
  if (user.email?.toLowerCase() !== invitedEmail.toLowerCase()) {
    return 'wrong-email'
  }
  if (isLoading || !profile) return 'loading'
  if (!profile.emailVerifiedAt) return 'verify'
  if (!profile.profileCompletion?.isProfileComplete) return 'profile'
  return 'join'
}

const JoinStaffEntry: React.FC = () => {
  const { invite } = useOutletContext<JoinStaffContext>()
  const step = useJoinStaffStep(invite.invitedEmail)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  useEffect(() => {
    if (step === 'loading' || step === 'wrong-role' || step === 'wrong-email') {
      return
    }
    navigate(step, { replace: true })
  }, [step, navigate])

  if (step === 'wrong-role' || step === 'wrong-email') {
    return (
      <div className={styles.page}>
        <Alert variant="warning">
          {step === 'wrong-role'
            ? 'This invite is for a personal AuxHR account. You are signed in with a recruiter or admin account.'
            : `This invite was sent to ${invite.invitedEmail}. You are signed in with a different account.`}
        </Alert>
        <Button variant="outline" onClick={() => logout()}>
          Log out and use {invite.invitedEmail}
        </Button>
      </div>
    )
  }

  if (step === 'loading') return <Spinner fullPage />
  return <Navigate to={step} replace />
}

export default JoinStaffEntry
