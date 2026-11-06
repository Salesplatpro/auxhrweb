import React from 'react'
import { LuArrowRight } from 'react-icons/lu'
import { Navigate, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { useProfile } from '@/features/profile/hooks/useProfile'

import { CelebrationCard } from '../components/CelebrationCard'
import { OnboardingShell } from '../components/OnboardingShell'
import { OnboardingDoneState } from '../done/OnboardingDoneState'
import { ONBOARDING_PATHS } from '../paths'

const TALENT_HOME = '/talentDashboard'
const TALENT_JOBS = '/talentDashboard/job'

export const ProfileDonePage = () => {
  const navigate = useNavigate()
  const { profile, isLoading, error, mutate } = useProfile()

  if (!profile) {
    return (
      <OnboardingDoneState
        isLoading={isLoading || !error}
        error={error}
        onRetry={() => void mutate()}
      />
    )
  }

  const completion = profile.profileCompletion
  if (!completion?.isProfileComplete) {
    return <Navigate to={ONBOARDING_PATHS.profile} replace />
  }

  return (
    <OnboardingShell
      account={{
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.profileImageUrl,
        subtitle: `Talent · Profile ${completion.percentage}%`,
      }}>
      <CelebrationCard
        title={`Your profile is live, ${profile.firstName ?? 'there'}`}
        lead="Recruiters can now find you, and AuxHR is already matching you to open roles."
        items={[
          { label: 'Account created', value: 'Done' },
          { label: 'Email verified', value: 'Done' },
          {
            label: 'Profile and CV added',
            value: `${completion.percentage}%`,
          },
        ]}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="xl"
              pill
              stretch
              onClick={() => navigate(TALENT_HOME)}>
              Go to dashboard
            </Button>
            <Button
              type="button"
              variant="ink"
              size="xl"
              pill
              stretch
              iconEnd={<LuArrowRight />}
              onClick={() => navigate(TALENT_JOBS)}>
              See my job matches
            </Button>
          </>
        }
      />
    </OnboardingShell>
  )
}

export default ProfileDonePage
