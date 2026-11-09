import React from 'react'
import { Navigate, Outlet, useOutletContext } from 'react-router-dom'

import { onboardingGate } from '@/features/onboarding/destination'
import { OnboardingDoneState } from '@/features/onboarding/done/OnboardingDoneState'
import { useProfile } from '@/features/profile/hooks/useProfile'

const RequireOnboarded: React.FC = () => {
  const { profile, isLoading, error, mutate } = useProfile()
  const outletContext = useOutletContext()

  if (!profile) {
    return (
      <OnboardingDoneState
        isLoading={isLoading || !error}
        error={error}
        onRetry={() => void mutate()}
      />
    )
  }

  const gate = onboardingGate(profile)
  if (gate) {
    return <Navigate to={gate} replace />
  }

  return <Outlet context={outletContext} />
}

export default RequireOnboarded
