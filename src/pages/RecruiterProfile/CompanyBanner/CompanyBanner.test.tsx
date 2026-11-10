import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CompanyBanner } from './CompanyBanner'

const state = vi.hoisted(() => ({
  profile: undefined as Record<string, unknown> | undefined,
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
    catalog: { plans: [{ key: 'sme_pro', name: 'Pro' }] },
  }),
}))

const renderBanner = (onNavigate?: () => void) =>
  render(
    <MemoryRouter>
      <CompanyBanner onNavigate={onNavigate} />
    </MemoryRouter>,
  )

describe('CompanyBanner', () => {
  beforeEach(() => {
    state.profile = undefined
    state.meters = []
  })

  it('says when there is no company yet', () => {
    renderBanner()

    expect(screen.getByText('No company yet')).toBeTruthy()
  })

  it('shows the company initials, plan and member count', () => {
    state.profile = {
      activeOrganization: {
        id: 'org-1',
        name: 'Kosana Tech Ltd',
        billingPlan: 'sme_pro',
      },
    }
    state.meters = [{ key: 'team_members', used: 4, limit: 5 }]
    renderBanner()

    expect(screen.getByText('KT')).toBeTruthy()
    expect(screen.getByText('Kosana Tech Ltd')).toBeTruthy()
    expect(screen.getByText('Pro plan · 4 members')).toBeTruthy()
  })

  it('leaves out the member count when the meter is missing', () => {
    state.profile = {
      activeOrganization: { id: 'org-1', name: 'Solo', billingPlan: 'sme_pro' },
    }
    renderBanner()

    expect(screen.getByText('Pro plan')).toBeTruthy()
  })

  it('keeps company links in its menu and leaves People to the sidebar', () => {
    renderBanner()
    fireEvent.click(screen.getByText('No company yet'))

    for (const link of ['Manage companies', 'Create company', 'View plan']) {
      expect(screen.getByRole('menuitem', { name: link })).toBeTruthy()
    }
    for (const gone of ['Employees', 'Org chart', 'Access log']) {
      expect(screen.queryByText(gone)).toBeNull()
    }
  })

  it('closes the menu and reports navigation when a row is picked', () => {
    const onNavigate = vi.fn()
    renderBanner(onNavigate)
    fireEvent.click(screen.getByText('No company yet'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'View plan' }))

    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menuitem', { name: 'View plan' })).toBeNull()
  })
})
