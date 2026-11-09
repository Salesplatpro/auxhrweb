import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AccountEmailVerification from './AccountEmailVerification'

const VERIFIED = '2026-11-07T08:00:00.000Z'

type Profile = Record<string, unknown>

const {
  navigateMock,
  submitVerifyTokenMock,
  submitResendMock,
  submitChangeEmailMock,
  mutateMock,
  authState,
  profileState,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  submitVerifyTokenMock: vi.fn(),
  submitResendMock: vi.fn(),
  submitChangeEmailMock: vi.fn(),
  mutateMock: vi.fn(),
  authState: {
    logout: vi.fn(),
    setUser: vi.fn(),
    isLoggedIn: true,
    user: { userRole: 'talent' } as Record<string, unknown> | null,
  },
  profileState: {
    profile: null as Profile | null,
    isLoading: false,
    error: undefined as unknown,
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
  useProfile: () => ({ ...profileState, mutate: mutateMock }),
}))

vi.mock('../hooks/useEmailVerification', () => ({
  useEmailVerification: () => ({
    submitVerifyToken: submitVerifyTokenMock,
    submitResend: submitResendMock,
    submitChangeEmail: submitChangeEmailMock,
    isChangingEmail: false,
  }),
}))

const LocationProbe = () => {
  const location = useLocation()
  return (
    <p data-testid="location">{`${location.pathname}${location.search}`}</p>
  )
}

const renderAt = (search: string) =>
  render(
    <MemoryRouter initialEntries={[`/verify-email${search}`]}>
      <Routes>
        <Route path="/verify-email" element={<AccountEmailVerification />} />
        <Route path="*" element={<p>Elsewhere</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )

const recruiter = (overrides: Profile = {}): Profile => ({
  userRole: 'recruiter',
  firstName: 'Ada',
  lastName: 'Obi',
  email: 'ada.obi@acmeltd.com',
  emailVerifiedAt: VERIFIED,
  ...overrides,
})

const talent = (overrides: Profile = {}): Profile => ({
  userRole: 'talent',
  firstName: 'Tunde',
  lastName: 'Bakare',
  email: 'tunde@example.com',
  emailVerifiedAt: VERIFIED,
  profileCompletion: {
    percentage: 0,
    isProfileComplete: false,
    canProceedToPlatform: false,
  },
  ...overrides,
})

beforeEach(() => {
  navigateMock.mockReset()
  submitVerifyTokenMock.mockReset()
  submitResendMock.mockReset()
  submitChangeEmailMock.mockReset()
  mutateMock.mockReset()
  authState.logout.mockReset()
  authState.setUser.mockReset()
  authState.isLoggedIn = true
  authState.user = { userRole: 'talent', emailVerifiedAt: null }
  profileState.profile = null
  profileState.isLoading = false
  profileState.error = undefined
})

describe('verify link', () => {
  it('resumes the apply wizard when the redirect is a job path', async () => {
    submitVerifyTokenMock.mockResolvedValue({ profile: talent() })

    renderAt('?token=abc&redirect=%2Fapply%2Fjob-1')

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith('/apply/job-1', {
        replace: true,
        state: {
          toast: { type: 'success', message: 'Your email has been verified.' },
        },
      }),
    )
  })

  it('ignores an open-redirect attempt and shows the verified screen', async () => {
    submitVerifyTokenMock.mockResolvedValue({ profile: talent() })

    renderAt('?token=abc&redirect=https%3A%2F%2Fevil.com')

    expect(await screen.findByText('Email verified')).toBeTruthy()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('offers a new recruiter company setup and the access code', async () => {
    authState.user = { userRole: 'recruiter', emailVerifiedAt: null }
    submitVerifyTokenMock.mockResolvedValue({ profile: recruiter() })

    renderAt('?token=abc')

    expect(await screen.findByText('Email verified')).toBeTruthy()
    expect(screen.getByText('Account active')).toBeTruthy()
    expect(screen.getByText('Ada Obi')).toBeTruthy()
    expect(screen.getByText('Recruiter')).toBeTruthy()
    expect(screen.getByText('ada.obi@acmeltd.com')).toBeTruthy()
    expect(screen.getByText('Not set up yet')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Use an access code' }),
    ).toHaveProperty('href', expect.stringContaining('/join-team'))

    fireEvent.click(screen.getByRole('button', { name: /Set up your company/ }))
    expect(navigateMock).toHaveBeenCalledWith('/onboarding/company', {
      replace: true,
    })
  })

  it('updates the saved session so the old unverified flag is gone', async () => {
    authState.user = { userRole: 'recruiter', emailVerifiedAt: null }
    submitVerifyTokenMock.mockResolvedValue({ profile: recruiter() })

    renderAt('?token=abc')

    await screen.findByText('Email verified')
    expect(authState.setUser).toHaveBeenCalledWith({
      userRole: 'recruiter',
      emailVerifiedAt: VERIFIED,
    })
  })

  it('shows the company a recruiter joined through an invite', async () => {
    authState.user = { userRole: 'recruiter', emailVerifiedAt: null }
    submitVerifyTokenMock.mockResolvedValue({
      joinedCompanyName: 'Acme Ltd',
      profile: recruiter({
        activeOrganizationId: 'org-1',
        activeOrganization: { name: 'Acme Ltd' },
      }),
    })

    renderAt('?token=abc&redirect=%2Fjoin-company%2Fabc123')

    expect(await screen.findByText('Joined')).toBeTruthy()
    expect(screen.getByText('Acme Ltd')).toBeTruthy()
    expect(screen.queryByText('Use an access code')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Go to dashboard/ }))
    expect(navigateMock).toHaveBeenCalledWith('/recruiterDashboard/dashboard', {
      replace: true,
    })
  })

  it('sends a new talent to build their profile', async () => {
    submitVerifyTokenMock.mockResolvedValue({ profile: talent() })

    renderAt('?token=abc')

    expect(await screen.findByText('Talent')).toBeTruthy()
    expect(screen.getByText('Profile')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Build your profile/ }))
    expect(navigateMock).toHaveBeenCalledWith('/onboarding/profile', {
      replace: true,
    })
  })

  it('asks a logged-out user to log in', async () => {
    authState.isLoggedIn = false
    authState.user = null
    submitVerifyTokenMock.mockResolvedValue({ profile: undefined })

    renderAt('?token=abc&redirect=%2Fapply%2Fjob-1')

    fireEvent.click(
      await screen.findByRole('button', { name: 'Log in to continue' }),
    )
    expect(navigateMock).toHaveBeenCalledWith('/login?next=%2Fapply%2Fjob-1', {
      replace: true,
    })
  })

  it('says so when the link was for a different account than the one signed in', async () => {
    submitVerifyTokenMock.mockResolvedValue({
      profile: talent({ emailVerifiedAt: null, email: 'other@example.com' }),
    })

    renderAt('?token=abc')

    expect(
      await screen.findByText('That link was for another account'),
    ).toBeTruthy()
    expect(screen.getByText(/other@example.com/)).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', {
        name: /Log out and sign in with that account/,
      }),
    )
    expect(authState.logout).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('treats a used link as success when the account is already verified', async () => {
    submitVerifyTokenMock.mockRejectedValue(new Error('expired'))
    mutateMock.mockResolvedValue({ data: { user: talent() } })

    renderAt('?token=abc')

    expect(await screen.findByText('Email verified')).toBeTruthy()
  })

  it('offers a new link when the token is bad', async () => {
    submitVerifyTokenMock.mockRejectedValue(new Error('expired'))
    mutateMock.mockResolvedValue({
      data: { user: talent({ emailVerifiedAt: null }) },
    })

    renderAt('?token=abc&redirect=%2Fapply%2Fjob-1')

    expect(await screen.findByText('Link invalid or expired')).toBeTruthy()
    profileState.profile = talent({ emailVerifiedAt: null })
    fireEvent.click(screen.getByRole('button', { name: 'Send a new link' }))
    expect(await screen.findByText('Check your inbox')).toBeTruthy()
    expect(screen.getByTestId('location').textContent).toBe(
      '/verify-email?redirect=%2Fapply%2Fjob-1',
    )
  })

  it('verifies each token once', async () => {
    submitVerifyTokenMock.mockResolvedValue({ profile: talent() })

    const { rerender } = renderAt('?token=abc')
    await screen.findByText('Email verified')
    rerender(
      <MemoryRouter initialEntries={['/verify-email?token=abc']}>
        <Routes>
          <Route path="/verify-email" element={<AccountEmailVerification />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(submitVerifyTokenMock).toHaveBeenCalledTimes(1)
  })
})

describe('check your inbox', () => {
  it('sends a logged-out visitor to log in', () => {
    authState.isLoggedIn = false

    renderAt('')

    expect(screen.getByTestId('location').textContent).toBe('/login')
  })

  it('shows step 3 with the address the link went to', () => {
    profileState.profile = talent({ emailVerifiedAt: null })

    renderAt('')

    expect(screen.getByText('Check your inbox')).toBeTruthy()
    expect(screen.getByText('Step 3 of 3')).toBeTruthy()
    expect(screen.getByText(/tunde@example.com/)).toBeTruthy()
  })

  it('moves a verified user straight on', () => {
    profileState.profile = recruiter()

    renderAt('')

    expect(screen.getByTestId('location').textContent).toBe(
      '/onboarding/company',
    )
  })

  it('keeps a safe redirect ahead of onboarding', () => {
    profileState.profile = talent()

    renderAt('?redirect=%2Fjoin-staff%2Fabc123')

    expect(screen.getByTestId('location').textContent).toBe(
      '/join-staff/abc123',
    )
  })

  it('checks again when the user comes back to the tab', () => {
    profileState.profile = talent({ emailVerifiedAt: null })
    renderAt('')

    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(mutateMock).toHaveBeenCalledTimes(1)
  })

  it('stops listening once the page closes', () => {
    profileState.profile = talent({ emailVerifiedAt: null })
    const { unmount } = renderAt('')
    unmount()

    window.dispatchEvent(new Event('focus'))

    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('passes the redirect along when resending', async () => {
    vi.useFakeTimers()
    try {
      profileState.profile = talent({ emailVerifiedAt: null })
      submitResendMock.mockResolvedValue(undefined)
      renderAt('?redirect=%2Fapply%2Fjob-1')
      act(() => vi.advanceTimersByTime(60_000))

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Resend email' }))
      })

      expect(submitResendMock).toHaveBeenCalledWith('/apply/job-1')
    } finally {
      vi.useRealTimers()
    }
  })

  it('changes the email and keeps the redirect', async () => {
    profileState.profile = talent({ emailVerifiedAt: null })
    submitChangeEmailMock.mockResolvedValue(undefined)
    renderAt('?redirect=%2Fapply%2Fjob-1')

    fireEvent.click(
      screen.getByRole('button', { name: 'Change email address' }),
    )
    fireEvent.change(screen.getByLabelText('New email'), {
      target: { value: 'new@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'Password1!' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send new link' }))
    })

    expect(submitChangeEmailMock).toHaveBeenCalledWith({
      newEmail: 'new@example.com',
      currentPassword: 'Password1!',
      redirectPath: '/apply/job-1',
    })
    expect(screen.getByText('Check your inbox')).toBeTruthy()
  })

  it('checks the new email before sending it', () => {
    profileState.profile = talent({ emailVerifiedAt: null })
    renderAt('')

    fireEvent.click(
      screen.getByRole('button', { name: 'Change email address' }),
    )
    fireEvent.change(screen.getByLabelText('New email'), {
      target: { value: 'tunde@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send new link' }))

    expect(screen.getByText('This is already your email')).toBeTruthy()
    expect(screen.getByText('Enter your password')).toBeTruthy()
    expect(submitChangeEmailMock).not.toHaveBeenCalled()
  })

  it('shows the server message when the change fails', async () => {
    profileState.profile = talent({ emailVerifiedAt: null })
    submitChangeEmailMock.mockRejectedValue(new Error('Email already in use'))
    renderAt('')

    fireEvent.click(
      screen.getByRole('button', { name: 'Change email address' }),
    )
    fireEvent.change(screen.getByLabelText('New email'), {
      target: { value: 'taken@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'Password1!' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send new link' }))
    })

    expect(screen.getByText('Email already in use')).toBeTruthy()
    expect(screen.getByText('Change your email')).toBeTruthy()
  })

  it('logs out from "Back to log in"', () => {
    profileState.profile = talent({ emailVerifiedAt: null })
    renderAt('')

    fireEvent.click(screen.getByRole('button', { name: /Back to log in/ }))

    expect(authState.logout).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('offers a retry when the account fails to load, without redirecting', () => {
    profileState.error = new Error('offline')
    renderAt('')

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(mutateMock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('location').textContent).toBe('/verify-email')
  })
})
