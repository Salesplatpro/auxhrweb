import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useJoinStaffStep } from './JoinStaffEntry'

const { authState, profileState } = vi.hoisted(() => ({
  authState: {
    token: null as string | null,
    user: null as { userRole: string; email: string } | null,
  },
  profileState: {
    profile: null as Record<string, unknown> | null,
    isLoading: false,
  },
}))

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector(authState),
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => profileState,
}))

const INVITED = 'ada@example.com'

const signIn = (userRole = 'talent', email = INVITED) => {
  authState.token = 'jwt'
  authState.user = { userRole, email }
}

const step = () => renderHook(() => useJoinStaffStep(INVITED)).result.current

beforeEach(() => {
  authState.token = null
  authState.user = null
  profileState.profile = null
  profileState.isLoading = false
})

describe('useJoinStaffStep', () => {
  it('starts with account creation or login when signed out', () => {
    expect(step()).toBe('account')
  })

  it('blocks recruiter and admin accounts', () => {
    signIn('recruiter')
    expect(step()).toBe('wrong-role')
  })

  it('blocks an account that is not the invited email', () => {
    signIn('talent', 'someone-else@example.com')
    expect(step()).toBe('wrong-email')
  })

  it('waits for the profile to load', () => {
    signIn()
    profileState.isLoading = true
    expect(step()).toBe('loading')
  })

  it('asks for email verification before anything else', () => {
    signIn()
    profileState.profile = { emailVerifiedAt: null }
    expect(step()).toBe('verify')
  })

  it('asks the person to complete their profile before joining', () => {
    signIn()
    profileState.profile = {
      emailVerifiedAt: '2026-01-01',
      profileCompletion: { isProfileComplete: false },
    }
    expect(step()).toBe('profile')
  })

  it('lets a verified person with a complete profile join', () => {
    signIn()
    profileState.profile = {
      emailVerifiedAt: '2026-01-01',
      profileCompletion: { isProfileComplete: true },
    }
    expect(step()).toBe('join')
  })

  it('matches the invited email regardless of letter case', () => {
    signIn('talent', 'Ada@Example.com')
    profileState.profile = {
      emailVerifiedAt: '2026-01-01',
      profileCompletion: { isProfileComplete: true },
    }
    expect(step()).toBe('join')
  })
})
