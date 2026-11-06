import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CompanyDonePage from './CompanyDonePage'

const { profileState } = vi.hoisted(() => ({
  profileState: {
    profile: null as Record<string, unknown> | null,
    isLoading: false,
    error: undefined as unknown,
  },
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ ...profileState, mutate: vi.fn() }),
}))

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/onboarding/company/done']}>
      <Routes>
        <Route path="/onboarding/company/done" element={<CompanyDonePage />} />
        <Route path="/onboarding/company" element={<p>Company setup</p>} />
      </Routes>
    </MemoryRouter>,
  )

describe('CompanyDonePage', () => {
  beforeEach(() => {
    profileState.profile = null
    profileState.isLoading = false
    profileState.error = undefined
  })

  it('celebrates with the company and current plan', () => {
    profileState.profile = {
      firstName: 'Ada',
      lastName: 'Obi',
      activeOrganization: { name: 'Acme Ltd', billingPlan: 'pay_per_use' },
    }
    renderPage()

    expect(screen.getByText("You're all set, Ada")).toBeTruthy()
    expect(screen.getAllByText('Acme Ltd').length).toBeGreaterThan(0)
    expect(screen.getByText('Pay per Use')).toBeTruthy()
  })

  it('sends a recruiter without a company back to setup', () => {
    profileState.profile = { firstName: 'Ada', activeOrganization: null }
    renderPage()
    expect(screen.getByText('Company setup')).toBeTruthy()
  })

  it('offers a retry when the profile fails to load', () => {
    profileState.error = new Error('offline')
    renderPage()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
  })
})
