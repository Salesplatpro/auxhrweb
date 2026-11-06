import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProfileDonePage from './ProfileDonePage'

const { state } = vi.hoisted(() => ({
  state: { profile: null as Record<string, unknown> | null },
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: state.profile,
    isLoading: false,
    mutate: vi.fn(),
  }),
}))

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/onboarding/profile/done']}>
      <Routes>
        <Route path="/onboarding/profile/done" element={<ProfileDonePage />} />
        <Route path="/onboarding/profile" element={<p>Profile builder</p>} />
      </Routes>
    </MemoryRouter>,
  )

describe('ProfileDonePage', () => {
  beforeEach(() => {
    state.profile = null
  })

  it('celebrates a complete profile without inventing match counts', () => {
    state.profile = {
      firstName: 'Tunde',
      lastName: 'Bakare',
      profileCompletion: { percentage: 100, isProfileComplete: true },
    }
    renderPage()
    expect(screen.getByText('Your profile is live, Tunde')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: /See my job matches/ }),
    ).toBeTruthy()
    expect(screen.queryByText(/new$/)).toBeNull()
  })

  it('sends an incomplete profile back to the builder', () => {
    state.profile = {
      firstName: 'Tunde',
      profileCompletion: { percentage: 70, isProfileComplete: false },
    }
    renderPage()
    expect(screen.getByText('Profile builder')).toBeTruthy()
  })
})
