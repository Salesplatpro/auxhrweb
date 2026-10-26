import React from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { EmailVerificationPanel } from '@/features/email-verification/components/EmailVerificationPanel'
import { joinStaffPath } from '@/features/people/paths'
import { useProfile } from '@/features/profile/hooks/useProfile'

import type { JoinStaffContext } from '../JoinStaffLayout'
import styles from './steps.module.scss'

const VerifyStep: React.FC = () => {
  const { token } = useOutletContext<JoinStaffContext>()
  const navigate = useNavigate()
  const { mutate } = useProfile()
  const base = joinStaffPath(token)

  const handleContinue = async () => {
    const refreshed = await mutate()
    if (refreshed?.data?.user?.emailVerifiedAt) {
      navigate(base, { replace: true })
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.intro}>
          Please verify your email address before completing your profile.
        </p>
        <EmailVerificationPanel redirectPath={base} />
        <div className={styles.continueBar}>
          <Button onClick={() => void handleContinue()}>
            I&apos;ve verified — Continue
          </Button>
        </div>
      </div>
    </div>
  )
}

export default VerifyStep
