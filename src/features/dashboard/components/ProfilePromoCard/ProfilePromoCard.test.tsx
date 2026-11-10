import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ProfilePromoCard } from './ProfilePromoCard'

const state = vi.hoisted(() => ({
  profile: null as Record<string, unknown> | null,
  isLoading: false,
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => state,
}))

const renderCard = () =>
  render(
    <MemoryRouter>
      <ProfilePromoCard />
    </MemoryRouter>,
  )

describe('ProfilePromoCard', () => {
  it('shows how complete the profile is and links to it', () => {
    state.profile = { profileCompletion: { percentage: 86 } }
    renderCard()

    expect(screen.getByText('Profile 86% done')).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: 'Complete profile' })
        .getAttribute('href'),
    ).toBe('/talentDashboard/talentProfile')
  })

  it('hides once the profile is complete or while it loads', () => {
    state.profile = { profileCompletion: { percentage: 100 } }
    const complete = renderCard()
    expect(complete.container.textContent).toBe('')
    complete.unmount()

    state.isLoading = true
    state.profile = null
    const loading = renderCard()
    expect(loading.container.textContent).toBe('')
  })
})
