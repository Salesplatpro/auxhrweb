import { describe, expect, it } from 'vitest'

import type { StaffInvitePreview } from '@/features/people/types'

import { joinStaffScreen } from './joinStaffScreen'

const pending = (inviteeExists: boolean): StaffInvitePreview => ({
  status: 'pending',
  organizationName: 'Kosana Tech Ltd',
  organizationLogoUrl: null,
  jobTitle: 'Data Analyst',
  invitedEmail: 'Kelechi@example.com',
  invitedByName: 'Philip Kosana',
  expiresAt: null,
  inviteeExists,
})

const state = (
  invite: StaffInvitePreview | null,
  overrides: Partial<Parameters<typeof joinStaffScreen>[0]> = {},
) =>
  joinStaffScreen({
    invite,
    isLoading: false,
    isInvalid: false,
    session: { token: null },
    hasJoined: false,
    accountExists: false,
    ...overrides,
  })

const talent = {
  token: 'jwt',
  userRole: 'talent',
  email: 'kelechi@example.com',
}

describe('joinStaffScreen', () => {
  it('asks a new person to set a password and an existing one to log in', () => {
    expect(state(pending(false))).toBe('password')
    expect(state(pending(true))).toBe('login')
  })

  it('switches to log in when the server says the account already exists', () => {
    expect(state(pending(false), { accountExists: true })).toBe('login')
  })

  it('offers to accept when the invited talent is signed in, whatever the letter case', () => {
    expect(state(pending(true), { session: talent })).toBe('accept')
  })

  it('stops a recruiter or a different talent', () => {
    expect(
      state(pending(true), { session: { ...talent, userRole: 'recruiter' } }),
    ).toBe('wrong-role')
    expect(
      state(pending(true), {
        session: { ...talent, email: 'someone@example.com' },
      }),
    ).toBe('wrong-email')
  })

  it('shows the expired, invalid and loading states', () => {
    expect(
      state({
        status: 'expired',
        organizationName: 'Kosana Tech Ltd',
        organizationLogoUrl: null,
        invitedEmail: 'kelechi@example.com',
        invitedAt: null,
        expiresAt: null,
        contactEmail: null,
      }),
    ).toBe('expired')
    expect(state(null, { isInvalid: true })).toBe('invalid')
    expect(state(null, { isLoading: true })).toBe('loading')
  })

  it('lets a signed-in talent reopen a used invite and sends anyone else to log in', () => {
    expect(state({ status: 'accepted' }, { session: talent })).toBe('accept')
    expect(state({ status: 'accepted' })).toBe('used')
  })

  it('keeps the joined screen even after the invite reloads as used', () => {
    expect(
      state({ status: 'accepted' }, { hasJoined: true, isLoading: true }),
    ).toBe('joined')
  })
})
