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
