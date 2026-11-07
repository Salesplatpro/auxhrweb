import { describe, expect, it } from 'vitest'

import { onboardingDestination, onboardingGate } from './destination'

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

describe('onboardingGate', () => {
  const VERIFIED = '2026-11-01T00:00:00.000Z'
  const completion = (canProceedToPlatform: boolean) => ({
    percentage: canProceedToPlatform ? 40 : 10,
    isProfileComplete: false,
    canProceedToPlatform,
  })

  it('holds an unverified talent or recruiter at the inbox screen', () => {
    expect(onboardingGate({ userRole: 'talent' })).toBe('/verify-email')
    expect(
      onboardingGate({ userRole: 'recruiter', emailVerifiedAt: null }),
    ).toBe('/verify-email')
  })

  it('sends a verified talent without a CV and roles to the wizard', () => {
    expect(
      onboardingGate({
        userRole: 'talent',
        emailVerifiedAt: VERIFIED,
        profileCompletion: completion(false),
      }),
    ).toBe('/onboarding/profile')
  })

  it('lets a talent with a CV and roles in, even with gaps left', () => {
    expect(
      onboardingGate({
        userRole: 'talent',
        emailVerifiedAt: VERIFIED,
        profileCompletion: completion(true),
      }),
    ).toBeNull()
  })

  it('lets a talent in when the server sends no completion data', () => {
    expect(
      onboardingGate({ userRole: 'talent', emailVerifiedAt: VERIFIED }),
    ).toBeNull()
  })

  it('lets a verified recruiter in without a company', () => {
    expect(
      onboardingGate({ userRole: 'recruiter', emailVerifiedAt: VERIFIED }),
    ).toBeNull()
  })

  it('never holds an admin', () => {
    expect(onboardingGate({ userRole: 'admin' })).toBeNull()
  })
})
