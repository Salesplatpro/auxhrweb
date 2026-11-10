import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PlanPromoCard } from './PlanPromoCard'

const state = vi.hoisted(() => ({
  profile: null as Record<string, unknown> | null,
  meters: [] as Array<{ key: string; used: number; limit: number | null }>,
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: state.profile }),
}))

vi.mock('@/features/organizations/hooks/useOrganizationUsage', () => ({
  useOrganizationUsage: () => ({ usage: { meters: state.meters } }),
}))

vi.mock('@/features/pricing/hooks/usePricingCatalog', () => ({
  usePricingCatalog: () => ({
    catalog: { plans: [{ key: 'beta', name: 'Beta' }] },
  }),
}))

const renderCard = () =>
  render(
    <MemoryRouter>
      <PlanPromoCard />
    </MemoryRouter>,
  )

describe('PlanPromoCard', () => {
  beforeEach(() => {
    state.profile = {
      activeOrganizationId: 'org-1',
      activeOrganization: { id: 'org-1', billingPlan: 'beta' },
    }
    state.meters = []
  })

  it('shows nothing without a company', () => {
    state.profile = null
    const { container } = renderCard()

    expect(container.textContent).toBe('')
  })

  it('shows the plan and how many job post slots are used', () => {
    state.meters = [{ key: 'job_listings', used: 3, limit: 5 }]
    renderCard()

    expect(screen.getByText('Beta plan')).toBeTruthy()
    expect(screen.getByText('3 of 5 job post slots used.')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(
      '60',
    )
    expect(
      screen.getByRole('link', { name: 'Upgrade Plan' }).getAttribute('href'),
    ).toBe('/recruiterDashboard/plan')
  })

  it('says unlimited when the meter has no limit or is missing', () => {
    state.meters = [{ key: 'job_listings', used: 3, limit: null }]
    renderCard()

    expect(screen.getByText('Unlimited job posts.')).toBeTruthy()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('keeps the bar full rather than overflowing when over the limit', () => {
    state.meters = [{ key: 'job_listings', used: 7, limit: 5 }]
    renderCard()

    expect(screen.getByText('7 of 5 job post slots used.')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(
      '100',
    )
  })

  it('treats a zero limit as full', () => {
    state.meters = [{ key: 'job_listings', used: 0, limit: 0 }]
    renderCard()

    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(
      '100',
    )
  })
})
