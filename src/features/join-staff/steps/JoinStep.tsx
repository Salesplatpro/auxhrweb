import React, { useState } from 'react'
import { HiOutlineCheckCircle } from 'react-icons/hi2'
import { useNavigate, useOutletContext } from 'react-router-dom'

import { Alert } from '@/components/feedback'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { dashboardPathForRole } from '@/features/auth/utils/dashboardPath'
import { joinStaffPath } from '@/features/people/paths'
import { acceptStaffInvite } from '@/features/people/services/peopleService'
import { JoinedStaff } from '@/features/people/types'
import { getErrorCode, getErrorMessage } from '@/utils/getErrorMessage'

import type { JoinStaffContext } from '../JoinStaffLayout'
import styles from './steps.module.scss'

const JoinStep: React.FC = () => {
  const { token, invite } = useOutletContext<JoinStaffContext>()
  const navigate = useNavigate()
  const userRole = useAuthStore((state) => state.user?.userRole)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joined, setJoined] = useState<JoinedStaff | null>(null)

  const handleJoin = async () => {
    setIsJoining(true)
    setError(null)
    try {
      setJoined(await acceptStaffInvite(token))
    } catch (err) {
      if (getErrorCode(err) === 'PROFILE_INCOMPLETE') {
        navigate(`${joinStaffPath(token)}/profile`, { replace: true })
        return
      }
      setError(getErrorMessage(err, 'We could not add you to this company'))
    } finally {
      setIsJoining(false)
    }
  }

  if (joined) {
    return (
      <div className={styles.page}>
        <Card className={styles.card}>
          <div className={styles.success}>
            <HiOutlineCheckCircle className={styles.successIcon} aria-hidden />
            <h2 className={styles.cardTitle}>
              You&apos;ve joined {joined.organizationName}
            </h2>
            <p className={styles.cardLead}>
              You&apos;re now linked as {joined.jobTitle}.
            </p>
            <Button onClick={() => navigate(dashboardPathForRole(userRole))}>
              Go to my dashboard
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <h2 className={styles.cardTitle}>You&apos;re ready to join</h2>
        <p className={styles.cardLead}>
          Your account is set up and your profile is complete. Join{' '}
          {invite.organizationName} as {invite.jobTitle}.
        </p>
        {error && <Alert variant="error">{error}</Alert>}
        <Button loading={isJoining} onClick={() => void handleJoin()}>
          Join {invite.organizationName}
        </Button>
      </Card>
    </div>
  )
}

export default JoinStep
