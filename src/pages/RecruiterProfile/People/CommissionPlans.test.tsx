import { render, screen, within } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CommissionPlans } from './CommissionPlans'

const { useCommissionPlansMock } = vi.hoisted(() => ({
  useCommissionPlansMock: vi.fn(),
}))

vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => ({ organizationId: 'org-1' }),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useCommissionPlans: useCommissionPlansMock,
}))

vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({ removeCommissionPlan: vi.fn(), isSaving: false }),
}))

const plan = (overrides = {}) => ({
  id: 'plan-1',
  name: 'Sales team 2026',
  paidOn: 'yearly_sales',
  frequency: 'quarterly',
  bands: [
    { fromAmount: 0, toAmount: 5000000, ratePercent: 5 },
    { fromAmount: 5000000, toAmount: 10000000, ratePercent: 7.5 },
    { fromAmount: 10000000, toAmount: null, ratePercent: 10 },
  ],
  needsBands: false,
  peopleCount: 4,
  people: ['Segun Ajayi', 'Funmilayo Adeyemi'],
  ...overrides,
})

const renderPage = () =>
  render(
    <MemoryRouter>
      <CommissionPlans />
    </MemoryRouter>,
  )

const state = (plans: unknown[]) =>
  useCommissionPlansMock.mockReturnValue({
    plans,
    isLoading: false,
    hasError: false,
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CommissionPlans', () => {
  it('shows each plan with its tiers, what it is paid on and who has it', () => {
    state([plan()])
    renderPage()

    const row = screen.getByText('Sales team 2026').closest('tr')!
    expect(within(row).getByText('3 tiers · 5% → 7.5% → 10%')).toBeTruthy()
    expect(within(row).getByText('Yearly sales')).toBeTruthy()
    expect(within(row).getByText('4 people')).toBeTruthy()
    expect(
      within(row).getByText('Segun Ajayi, Funmilayo Adeyemi +2'),
    ).toBeTruthy()
  })

  it('flags a plan from before tiers existed', () => {
    state([plan({ bands: null, needsBands: true, paidOn: null })])
    renderPage()

    expect(screen.getByText('Needs tiers')).toBeTruthy()
  })

  it('invites the owner to create the first plan', () => {
    state([])
    renderPage()

    expect(screen.getByText('No commission plans yet')).toBeTruthy()
    expect(screen.getByText('0 plans')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /New plan/ })).toHaveLength(1)
  })
})
