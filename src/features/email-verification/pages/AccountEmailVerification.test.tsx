import { render, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AccountEmailVerification from './AccountEmailVerification'

const { navigateMock, submitVerifyTokenMock, mutateMock, authState } =
  vi.hoisted(() => ({
    navigateMock: vi.fn(),
    submitVerifyTokenMock: vi.fn(),
    mutateMock: vi.fn(),
    authState: {
      logout: vi.fn(),
      isLoggedIn: true,
      user: { userRole: 'talent' } as { userRole?: string } | undefined,
    },
  }))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) =>
    selector(authState),
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: null,
    isLoading: false,
    mutate: mutateMock,
  }),
}))

vi.mock('../hooks/useEmailVerification', () => ({
  useEmailVerification: () => ({
    submitVerifyToken: submitVerifyTokenMock,
    submitResend: vi.fn(),
    isResending: false,
  }),
}))

const renderAt = (search: string) =>
  render(
    <MemoryRouter initialEntries={[`/verify-email${search}`]}>
      <Routes>
        <Route path="/verify-email" element={<AccountEmailVerification />} />
      </Routes>
    </MemoryRouter>,
  )

describe('AccountEmailVerification — post-verification redirect', () => {
  beforeEach(() => {
    navigateMock.mockClear()
    submitVerifyTokenMock.mockClear()
    mutateMock.mockReset()
    authState.isLoggedIn = true
    authState.user = { userRole: 'talent' }
  })

  it('resumes the apply wizard when the redirect param is a valid job path', async () => {
    submitVerifyTokenMock.mockResolvedValue(undefined)

    renderAt(
      '?token=abc123&redirect=%2Fapply%2F11111111-1111-1111-1111-111111111111',
    )

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/apply/11111111-1111-1111-1111-111111111111',
        {
          replace: true,
          state: {
            toast: {
              type: 'success',
              message: 'Your email has been verified.',
            },
          },
        },
      ),
    )
  })

  it('falls back to the dashboard when the redirect param is an open-redirect attempt', async () => {
    submitVerifyTokenMock.mockResolvedValue(undefined)

    renderAt('?token=abc123&redirect=https%3A%2F%2Fevil.com')

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith('/talentDashboard', {
        replace: true,
        state: {
          toast: { type: 'success', message: 'Your email has been verified.' },
        },
      }),
    )
  })

  it('sends a new recruiter without a company to company setup', async () => {
    authState.user = { userRole: 'recruiter' }
    submitVerifyTokenMock.mockResolvedValue(undefined)
    mutateMock.mockResolvedValue({
      data: { user: { userRole: 'recruiter', activeOrganizationId: null } },
    })

    renderAt('?token=abc123')

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/onboarding/company',
        expect.objectContaining({ replace: true }),
      ),
    )
  })

  it('sends a talent with an incomplete profile to the profile builder', async () => {
    submitVerifyTokenMock.mockResolvedValue(undefined)
    mutateMock.mockResolvedValue({
      data: {
        user: {
          userRole: 'talent',
          profileCompletion: {
            percentage: 10,
            isProfileComplete: false,
            canProceedToPlatform: false,
          },
        },
      },
    })

    renderAt('?token=abc123')

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/onboarding/profile',
        expect.objectContaining({ replace: true }),
      ),
    )
  })

  it('keeps an apply redirect ahead of onboarding', async () => {
    submitVerifyTokenMock.mockResolvedValue(undefined)
    mutateMock.mockResolvedValue({
      data: {
        user: {
          userRole: 'talent',
          profileCompletion: {
            percentage: 10,
            isProfileComplete: false,
            canProceedToPlatform: false,
          },
        },
      },
    })

    renderAt(
      '?token=abc123&redirect=%2Fapply%2F11111111-1111-1111-1111-111111111111',
    )

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/apply/11111111-1111-1111-1111-111111111111',
        expect.anything(),
      ),
    )
  })

  it('includes joined company in the toast when verify returns a company name', async () => {
    submitVerifyTokenMock.mockResolvedValue({
      joinedCompanyName: 'Invite Corp',
    })
    authState.user = { userRole: 'recruiter' }

    renderAt('?token=abc123')

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/recruiterDashboard/dashboard',
        {
          replace: true,
          state: {
            toast: {
              type: 'success',
              message: 'Your email is verified. You joined Invite Corp.',
            },
          },
        },
      ),
    )
  })

  it('sends a verified recruiter to the dashboard after joining even if redirect is the invite link', async () => {
    submitVerifyTokenMock.mockResolvedValue({
      joinedCompanyName: 'Invite Corp',
    })
    authState.user = { userRole: 'recruiter' }

    renderAt(
      '?token=abc123&redirect=%2Fjoin-company%2Faaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    )

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/recruiterDashboard/dashboard',
        {
          replace: true,
          state: {
            toast: {
              type: 'success',
              message: 'Your email is verified. You joined Invite Corp.',
            },
          },
        },
      ),
    )
  })

  it('offers "Continue application" instead of "Go to dashboard" when already verified with a valid redirect', async () => {
    submitVerifyTokenMock.mockRejectedValue(new Error('already verified'))
    mutateMock.mockResolvedValue({
      data: { user: { emailVerifiedAt: '2026-01-01T00:00:00.000Z' } },
    })

    renderAt(
      '?token=abc123&redirect=%2Fapply%2F11111111-1111-1111-1111-111111111111',
    )

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/apply/11111111-1111-1111-1111-111111111111',
        { replace: true },
      ),
    )
  })
})
