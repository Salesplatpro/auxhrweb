import React from 'react'
import { Navigate, Outlet, useOutletContext } from 'react-router-dom'

import { OnboardingDoneState } from '@/features/onboarding/done/OnboardingDoneState'
import { useProfile } from '@/features/profile/hooks/useProfile'

interface RequireEmailVerifiedProps {
  redirectTo: string
}

const RequireEmailVerified: React.FC<RequireEmailVerifiedProps> = ({
  redirectTo,
}) => {
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

  if (!profile.emailVerifiedAt) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet context={outletContext} />
}

export default RequireEmailVerified
