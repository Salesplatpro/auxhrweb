import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RequireOnboarded from './RequireOnboarded'

const { profileState, mutateMock } = vi.hoisted(() => ({
  profileState: {
    profile: null as Record<string, unknown> | null,
    isLoading: false,
    error: undefined as unknown,
  },
  mutateMock: vi.fn(),
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ ...profileState, mutate: mutateMock }),
}))

const LocationProbe = () => (
  <p data-testid="location">{useLocation().pathname}</p>
)

const renderGuard = () =>
  render(
    <MemoryRouter initialEntries={['/talentDashboard']}>
      <Routes>
        <Route element={<RequireOnboarded />}>
          <Route path="/talentDashboard" element={<p>Dashboard</p>} />
        </Route>
        <Route path="*" element={<p>Elsewhere</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )

const VERIFIED = '2026-11-07T00:00:00.000Z'

describe('RequireOnboarded', () => {
  beforeEach(() => {
    profileState.profile = null
    profileState.isLoading = false
    profileState.error = undefined
    mutateMock.mockReset()
  })

  it('waits while the account loads', () => {
    profileState.isLoading = true
    renderGuard()
    expect(screen.queryByText('Dashboard')).toBeNull()
    expect(screen.getByTestId('location').textContent).toBe('/talentDashboard')
  })

  it('offers a retry instead of redirecting when the account fails to load', () => {
    profileState.error = new Error('offline')
    renderGuard()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(mutateMock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('location').textContent).toBe('/talentDashboard')
  })

  it('sends an unverified user to the inbox screen', () => {
    profileState.profile = { userRole: 'talent', emailVerifiedAt: null }
    renderGuard()
    expect(screen.getByTestId('location').textContent).toBe('/verify-email')
  })

  it('sends a talent without a CV and roles to the profile wizard', () => {
    profileState.profile = {
      userRole: 'talent',
      emailVerifiedAt: VERIFIED,
      profileCompletion: {
        percentage: 20,
        isProfileComplete: false,
        canProceedToPlatform: false,
      },
    }
    renderGuard()
    expect(screen.getByTestId('location').textContent).toBe(
      '/onboarding/profile',
    )
  })

  it('lets a talent with a CV and roles in', () => {
    profileState.profile = {
      userRole: 'talent',
      emailVerifiedAt: VERIFIED,
      profileCompletion: {
        percentage: 60,
        isProfileComplete: false,
        canProceedToPlatform: true,
      },
    }
    renderGuard()
    expect(screen.getByText('Dashboard')).toBeTruthy()
  })

  it('lets a verified user in when the server sends no completion data', () => {
    profileState.profile = { userRole: 'talent', emailVerifiedAt: VERIFIED }
    renderGuard()
    expect(screen.getByText('Dashboard')).toBeTruthy()
  })
})
