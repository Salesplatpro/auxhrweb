import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { JoinCompanyInvitePage } from './JoinCompanyInvitePage'

const TOKEN = 'a'.repeat(64)
const INVITED_EMAIL = 'joiner@invitecorp.com'

const {
  navigateMock,
  acceptInviteMock,
  fetchPreviewMock,
  mutateProfileMock,
  authState,
  profileState,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  acceptInviteMock: vi.fn(),
  fetchPreviewMock: vi.fn(),
  mutateProfileMock: vi.fn(),
  authState: {
    isLoggedIn: false,
    user: undefined as
      | {
          email?: string
          userRole?: string
          emailVerifiedAt?: string | null
        }
      | undefined,
  },
  profileState: {
    profile: null as { emailVerifiedAt?: string | null } | null,
    isLoading: false,
  },
}))

vi.mock('swr', async () => {
  const actual = await vi.importActual<typeof import('swr')>('swr')
  return { ...actual, mutate: vi.fn().mockResolvedValue(undefined) }
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) =>
    selector(authState),
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: profileState.profile,
    isLoading: profileState.isLoading,
    mutate: mutateProfileMock,
  }),
}))

vi.mock('@/features/organizations/services/organizationService', () => ({
  MY_ORGANIZATIONS_ENDPOINT: '/organizations/me',
  fetchOrganizationInvitePreview: (...args: unknown[]) =>
    fetchPreviewMock(...args),
  acceptOrganizationInvite: (...args: unknown[]) => acceptInviteMock(...args),
}))

vi.mock('../components/LoginForm', () => ({
  LoginForm: ({ lockedEmail }: { lockedEmail?: string }) => (
    <div>Login form {lockedEmail}</div>
  ),
}))

vi.mock('../components/SignupForm', () => ({
  SignupForm: ({ lockedEmail }: { lockedEmail?: string }) => (
    <div>Signup form {lockedEmail}</div>
  ),
}))

const pendingPreview = (overrides: Record<string, unknown> = {}) => ({
  data: {
    invite: {
      organizationName: 'Invite Corp',
      invitedEmail: INVITED_EMAIL,
      status: 'pending',
      expiresAt: '2026-12-01T00:00:00.000Z',
      inviteeExists: true,
      ...overrides,
    },
  },
})

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={[`/join-company/${TOKEN}`]}>
      <Routes>
        <Route
          path="/join-company/:token"
          element={<JoinCompanyInvitePage />}
        />
      </Routes>
    </MemoryRouter>,
  )

describe('JoinCompanyInvitePage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    acceptInviteMock.mockReset()
    fetchPreviewMock.mockReset()
    mutateProfileMock.mockReset()
    mutateProfileMock.mockResolvedValue(undefined)
    acceptInviteMock.mockResolvedValue({
      data: { organization: { id: 'org-1' } },
    })
    fetchPreviewMock.mockResolvedValue(pendingPreview())
    authState.isLoggedIn = false
    authState.user = undefined
    profileState.profile = null
    profileState.isLoading = false
  })

  it('auto-accepts for a logged-in verified recruiter with the invited email and does not show login', async () => {
    authState.isLoggedIn = true
    authState.user = {
      email: INVITED_EMAIL,
      userRole: 'recruiter',
      emailVerifiedAt: '2026-01-01T00:00:00.000Z',
    }
    profileState.profile = { emailVerifiedAt: '2026-01-01T00:00:00.000Z' }

    renderPage()

    await waitFor(() => expect(acceptInviteMock).toHaveBeenCalledWith(TOKEN))
    expect(screen.queryByText(/Login form/)).toBeNull()
    expect(screen.queryByText(/Log in with your recruiter account/)).toBeNull()

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/recruiterDashboard/dashboard',
        {
          replace: true,
          state: {
            toast: {
              type: 'success',
              message: 'You joined Invite Corp.',
            },
          },
        },
      ),
    )
  })

  it('asks an existing platform user who is logged out to log in, not sign up', async () => {
    renderPage()

    expect(
      await screen.findByText(
        'Log in with your recruiter account to accept this invite.',
      ),
    ).toBeTruthy()
    expect(screen.getByText(`Login form ${INVITED_EMAIL}`)).toBeTruthy()
    expect(screen.queryByText(/Signup form/)).toBeNull()
    expect(acceptInviteMock).not.toHaveBeenCalled()
  })

  it('forces a new user to sign up with the invited email', async () => {
    fetchPreviewMock.mockResolvedValue(pendingPreview({ inviteeExists: false }))

    renderPage()

    expect(
      await screen.findByText(
        'Create your recruiter account to accept this invite.',
      ),
    ).toBeTruthy()
    expect(screen.getByText(`Signup form ${INVITED_EMAIL}`)).toBeTruthy()
    expect(screen.queryByText(/Login form/)).toBeNull()
    expect(acceptInviteMock).not.toHaveBeenCalled()
  })

  it('asks a logged-in unverified recruiter to verify email instead of signing in again', async () => {
    authState.isLoggedIn = true
    authState.user = {
      email: INVITED_EMAIL,
      userRole: 'recruiter',
      emailVerifiedAt: null,
    }
    profileState.profile = { emailVerifiedAt: null }

    renderPage()

    expect(await screen.findByText('Verify your email')).toBeTruthy()
    expect(screen.queryByText(/Login form/)).toBeNull()
    expect(acceptInviteMock).not.toHaveBeenCalled()
  })
})
