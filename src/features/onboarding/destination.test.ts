import { describe, expect, it } from 'vitest'

import { onboardingDestination } from './destination'

describe('onboardingDestination', () => {
  it('sends a recruiter without a company to company setup', () => {
    expect(onboardingDestination({ userRole: 'recruiter' })).toBe(
      '/onboarding/company',
    )
  })

  it('leaves a recruiter with a company alone', () => {
    expect(
      onboardingDestination({
        userRole: 'recruiter',
        activeOrganizationId: 'org-1',
      }),
    ).toBeNull()
  })

  it('sends a talent with an incomplete profile to the builder', () => {
    expect(
      onboardingDestination({
        userRole: 'talent',
        profileCompletion: {
          percentage: 30,
          isProfileComplete: false,
          canProceedToPlatform: false,
        },
      }),
    ).toBe('/onboarding/profile')
  })

  it('does not guess when completion is unknown or the role is admin', () => {
    expect(onboardingDestination({ userRole: 'talent' })).toBeNull()
    expect(onboardingDestination({ userRole: 'admin' })).toBeNull()
    expect(onboardingDestination(null)).toBeNull()
  })
})
