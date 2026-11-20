import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CommissionPlanEditor } from './CommissionPlanEditor'

const { saveCommissionPlanMock } = vi.hoisted(() => ({
  saveCommissionPlanMock: vi.fn(),
}))

vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => ({ organizationId: 'org-1' }),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useCommissionPlans: () => ({ plans: [], isLoading: false, hasError: false }),
}))

vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({ saveCommissionPlan: saveCommissionPlanMock }),
}))

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/new']}>
      <Routes>
        <Route path="/new" element={<CommissionPlanEditor />} />
        <Route path="*" element={<p>Plans list</p>} />
      </Routes>
    </MemoryRouter>,
  )

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

const fillPlan = () => {
  fireEvent.change(screen.getByLabelText(/Plan name/), {
    target: { value: 'Sales team 2026' },
  })
  type('Tier 1 ends at', '5000000')
  type('Tier 1 rate', '5')
  type('Tier 2 rate', '7.5')
}

beforeEach(() => {
  vi.clearAllMocks()
  saveCommissionPlanMock.mockResolvedValue({ id: 'plan-1' })
})

describe('CommissionPlanEditor', () => {
  it('works out what someone would earn from the tiers', async () => {
    renderPage()
    fillPlan()
    fireEvent.change(screen.getByLabelText('Sales this year'), {
      target: { value: '8000000' },
    })

    expect(await screen.findByText('First ₦5,000,000 × 5%')).toBeTruthy()
    expect(screen.getByText('Next ₦3,000,000 × 7.5%')).toBeTruthy()
    expect(screen.getByText('₦475,000')).toBeTruthy()
  })

  it('saves the tiers as bands from 0 up to no limit', async () => {
    renderPage()
    fillPlan()
    fireEvent.click(screen.getByRole('button', { name: 'Save plan' }))

    await waitFor(() =>
      expect(saveCommissionPlanMock).toHaveBeenCalledWith(
        {
          name: 'Sales team 2026',
          paidOn: 'yearly_sales',
          frequency: 'quarterly',
          bands: [
            { fromAmount: 0, toAmount: 5000000, ratePercent: 5 },
            { fromAmount: 5000000, toAmount: null, ratePercent: 7.5 },
          ],
        },
        undefined,
      ),
    )
  })

  it('refuses a tier that ends below where it starts', async () => {
    renderPage()
    fillPlan()
    fireEvent.click(screen.getByRole('button', { name: 'Add tier' }))
    type('Tier 2 ends at', '4000000')
    type('Tier 3 rate', '9')
    fireEvent.click(screen.getByRole('button', { name: 'Save plan' }))

    expect(
      await screen.findByText('Must be above the tier before'),
    ).toBeTruthy()
    expect(saveCommissionPlanMock).not.toHaveBeenCalled()
  })
})
