import React, { FormEvent, useRef, useState } from 'react'
import { LuArrowRight, LuKeyRound } from 'react-icons/lu'
import { Navigate, useNavigate } from 'react-router-dom'

import { Alert } from '@/components/feedback'
import { TextInput } from '@/components/forms'
import { Button } from '@/components/ui/Button'
import { AuthPrompt, AuthScreen } from '@/features/auth/components/AuthScreen'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { dashboardPathForRole } from '@/features/auth/utils/dashboardPath'
import { OnboardingDoneState } from '@/features/onboarding/done/OnboardingDoneState'
import { ONBOARDING_PATHS } from '@/features/onboarding/paths'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { getErrorMessage } from '@/utils/getErrorMessage'

import { joinOrganizationWithAccessCode } from '../services/organizationService'
import {
  formatAccessCodeInput,
  isCompleteAccessCode,
} from '../utils/accessCode'
import styles from './JoinWithCodePage.module.scss'

const RECRUITER_HOME = dashboardPathForRole('recruiter')

export const JoinWithCodePage = () => {
  const navigate = useNavigate()
  const { profile, isLoading, error: loadError, mutate } = useProfile()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const inFlight = useRef(false)

  if (!profile) {
    return (
      <OnboardingDoneState
        isLoading={isLoading || !loadError}
        error={loadError}
        onRetry={() => void mutate()}
      />
    )
  }

  if (
    !isJoining &&
    (profile.activeOrganizationId || profile.activeOrganization)
  ) {
    return <Navigate to={RECRUITER_HOME} replace />
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (inFlight.current) return
    if (!isCompleteAccessCode(code)) {
      setError('Enter the 8-character code, like ABCD-2345.')
      return
    }
    inFlight.current = true
    setIsJoining(true)
    setError(null)
    try {
      const result = await joinOrganizationWithAccessCode(code)
      await mutate()
      navigate(RECRUITER_HOME, {
        replace: true,
        state: {
          toast: {
            type: 'success',
            message: `You joined ${result.data.organizationName}.`,
          },
        },
      })
    } catch (err) {
      setError(
        getErrorMessage(err, 'We could not join that company. Try again.'),
      )
      inFlight.current = false
      setIsJoining(false)
    }
  }

  return (
    <AuthShell>
      <AuthScreen
        icon={{ icon: <LuKeyRound /> }}
        title="Join your team"
        subtitle="Enter the access code your company owner shared with you. Your account email must use your company's work email domain.">
        <form className={styles.form} onSubmit={submit} noValidate>
          {error && <Alert variant="error">{error}</Alert>}
          <TextInput
            title="Access code"
            name="accessCode"
            label="accessCode"
            autoComplete="off"
            placeholder="ABCD-2345"
            maxLength={9}
            value={code}
            onChange={(event) => {
              setCode(formatAccessCodeInput(event.target.value))
              setError(null)
            }}
          />
          <Button
            type="submit"
            variant="ink"
            size="xl"
            pill
            stretch
            loading={isJoining}
            iconEnd={<LuArrowRight />}>
            Join company
          </Button>
        </form>
        <AuthPrompt
          text="Setting up a new company instead?"
          linkLabel="Set up your company"
          to={ONBOARDING_PATHS.company}
        />
      </AuthScreen>
    </AuthShell>
  )
}

export default JoinWithCodePage
