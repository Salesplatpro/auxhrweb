import { describe, expect, it } from 'vitest'

import {
  changePasswordPathForRole,
  dashboardPathForRole,
  destinationAfterAuth,
  loginPathWithNext,
} from './dashboardPath'

const verified = (userRole: string) => ({
  userRole,
  emailVerifiedAt: '2026-11-01T00:00:00.000Z',
})

const unverified = (userRole: string) => ({ userRole, emailVerifiedAt: null })

describe('destinationAfterAuth', () => {
  it('resumes an apply-wizard next path for talent (not the dashboard)', () => {
    expect(
      destinationAfterAuth(
        verified('talent'),
        '/apply/11111111-1111-1111-1111-111111111111',
      ),
    ).toBe('/apply/11111111-1111-1111-1111-111111111111')
  })

  it('resumes nested apply-wizard steps for talent', () => {
    expect(
      destinationAfterAuth(
        verified('talent'),
        '/apply/11111111-1111-1111-1111-111111111111/profile',
      ),
    ).toBe('/apply/11111111-1111-1111-1111-111111111111/profile')
  })

  it('resumes a staff invite path for talent but not for recruiters', () => {
    const path = `/join-staff/${'a'.repeat(64)}`
    expect(destinationAfterAuth(verified('talent'), path)).toBe(path)
    expect(destinationAfterAuth(verified('recruiter'), path)).toBe(
      '/recruiterDashboard/dashboard',
    )
  })

  it('does not send talent to a recruiter next path', () => {
    expect(
      destinationAfterAuth(
        verified('talent'),
        '/recruiterDashboard/plan?checkout=paid',
      ),
    ).toBe('/talentDashboard')
  })

  it('still honors recruiter billing next paths', () => {
    expect(
      destinationAfterAuth(
        verified('recruiter'),
        '/recruiterDashboard/plan?checkout=paid&interval=monthly',
      ),
    ).toBe('/recruiterDashboard/plan?checkout=paid&interval=monthly')
  })

  it('resumes a company invite path for recruiters', () => {
    expect(
      destinationAfterAuth(
        verified('recruiter'),
        '/join-company/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      ),
    ).toBe(
      '/join-company/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    )
  })

  it('sends an admin to the overview dashboard by default', () => {
    expect(dashboardPathForRole('admin')).toBe('/adminDashboard')
    expect(destinationAfterAuth(verified('admin'), null)).toBe(
      '/adminDashboard',
    )
  })

  it('resumes an admin sub-page but not another role dashboard', () => {
    expect(
      destinationAfterAuth(verified('admin'), '/adminDashboard/jobs'),
    ).toBe('/adminDashboard/jobs')
    expect(
      destinationAfterAuth(verified('admin'), '/recruiterDashboard/dashboard'),
    ).toBe('/adminDashboard')
  })

  it('falls back to the role dashboard when next is missing', () => {
    expect(destinationAfterAuth(verified('talent'), null)).toBe(
      dashboardPathForRole('talent'),
    )
  })

  it('rejects open redirects', () => {
    expect(destinationAfterAuth(verified('talent'), 'https://evil.com')).toBe(
      '/talentDashboard',
    )
    expect(destinationAfterAuth(verified('talent'), '//evil.com')).toBe(
      '/talentDashboard',
    )
  })
})

describe('destinationAfterAuth onboarding paths', () => {
  it('resumes company setup for recruiters only', () => {
    expect(
      destinationAfterAuth(verified('recruiter'), '/onboarding/company'),
    ).toBe('/onboarding/company')
    expect(
      destinationAfterAuth(verified('talent'), '/onboarding/company'),
    ).toBe('/talentDashboard')
  })

  it('resumes the profile builder for talent only', () => {
    expect(
      destinationAfterAuth(verified('talent'), '/onboarding/profile'),
    ).toBe('/onboarding/profile')
    expect(
      destinationAfterAuth(verified('recruiter'), '/onboarding/profile'),
    ).toBe('/recruiterDashboard/dashboard')
  })
})

describe('loginPathWithNext', () => {
  it('encodes an apply path as the login next param', () => {
    expect(loginPathWithNext('/apply/abc-123')).toBe(
      '/login?next=%2Fapply%2Fabc-123',
    )
  })

  it('returns /login when next is absent', () => {
    expect(loginPathWithNext()).toBe('/login')
  })
})

describe('changePasswordPathForRole', () => {
  it('returns the dashboard change-password route for talent and recruiter', () => {
    expect(changePasswordPathForRole('talent')).toBe(
      '/talentDashboard/change-password',
    )
    expect(changePasswordPathForRole('recruiter')).toBe(
      '/recruiterDashboard/change-password',
    )
  })

  it('returns undefined for admin and when the role is missing', () => {
    expect(changePasswordPathForRole('admin')).toBeUndefined()
    expect(changePasswordPathForRole()).toBeUndefined()
    expect(changePasswordPathForRole(null)).toBeUndefined()
  })
})

describe('destinationAfterAuth before the email is verified', () => {
  it('sends an unverified talent or recruiter to the inbox screen', () => {
    expect(destinationAfterAuth(unverified('talent'), null)).toBe(
      '/verify-email',
    )
    expect(destinationAfterAuth(unverified('recruiter'), null)).toBe(
      '/verify-email',
    )
  })

  it('does not let a dashboard next path skip verification', () => {
    expect(
      destinationAfterAuth(unverified('recruiter'), '/recruiterDashboard/plan'),
    ).toBe('/verify-email')
    expect(
      destinationAfterAuth(unverified('talent'), '/onboarding/profile'),
    ).toBe('/verify-email')
  })

  it('keeps apply and join flows, which verify the email themselves', () => {
    expect(destinationAfterAuth(unverified('talent'), '/apply/job-1')).toBe(
      '/apply/job-1',
    )
    const staff = `/join-staff/${'a'.repeat(64)}`
    expect(destinationAfterAuth(unverified('talent'), staff)).toBe(staff)
    const company = `/join-company/${'b'.repeat(64)}`
    expect(destinationAfterAuth(unverified('recruiter'), company)).toBe(company)
  })

  it('still checks the role before keeping a flow path', () => {
    expect(destinationAfterAuth(unverified('recruiter'), '/apply/job-1')).toBe(
      '/verify-email',
    )
  })

  it('never holds an admin at the inbox screen', () => {
    expect(destinationAfterAuth(unverified('admin'), null)).toBe(
      '/adminDashboard',
    )
  })

  it('treats a missing user as logged out', () => {
    expect(destinationAfterAuth(null, null)).toBe('/')
  })

  it('lets a verified recruiter resume the join-team page', () => {
    expect(destinationAfterAuth(verified('recruiter'), '/join-team')).toBe(
      '/join-team',
    )
    expect(destinationAfterAuth(verified('talent'), '/join-team')).toBe(
      '/talentDashboard',
    )
  })
})
