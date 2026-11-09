import { VERIFY_EMAIL_PATH } from '@/features/auth/utils/dashboardPath'
import { ProfileUser } from '@/features/profile/types'

import { ONBOARDING_PATHS } from './paths'

export const onboardingDestination = (
  user?: ProfileUser | null,
): string | null => {
  if (!user) return null
  if (
    user.userRole === 'recruiter' &&
    !user.activeOrganizationId &&
    !user.activeOrganization
  ) {
    return ONBOARDING_PATHS.company
  }
  if (
    user.userRole === 'talent' &&
    user.profileCompletion &&
    !user.profileCompletion.isProfileComplete
  ) {
    return ONBOARDING_PATHS.profile
  }
  return null
}

/**
 * Where a user must go before the dashboard: the inbox screen until the email is
 * verified, and for talent the profile wizard until a CV and roles are saved.
 */
export const onboardingGate = (user: ProfileUser): string | null => {
  const isMember = user.userRole === 'talent' || user.userRole === 'recruiter'
  if (isMember && !user.emailVerifiedAt) return VERIFY_EMAIL_PATH
  if (
    user.userRole === 'talent' &&
    user.profileCompletion &&
    !user.profileCompletion.canProceedToPlatform
  ) {
    return ONBOARDING_PATHS.profile
  }
  return null
}
