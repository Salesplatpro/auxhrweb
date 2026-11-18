import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PayData, PayPackage, StaffMember } from '@/features/people/types'

import { PayTab } from './PayTab'

const { usePayMock, savePayPackageMock } = vi.hoisted(() => ({
  usePayMock: vi.fn(),
  savePayPackageMock: vi.fn(),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  usePay: usePayMock,
  useCommissionPlans: () => ({
    plans: [
      {
        id: 'plan-1',
        name: 'Product targets 2026',
        tiers: [
          { fromPercent: 0, toPercent: 80, ratePercent: 2, boost: null },
          { fromPercent: 80, toPercent: null, ratePercent: 4, boost: null },
        ],
        peopleCount: 5,
      },
    ],
    isLoading: false,
  }),
  useBenefits: () => ({
    benefits: [{ id: 'b-1', name: 'Health cover', description: null }],
    isLoading: false,
  }),
}))

vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({
    savePayPackage: savePayPackageMock,
    addGrant: vi.fn(),
    removeGrant: vi.fn(),
    isSaving: false,
  }),
}))

const staff = {
  id: 's-1',
  fullName: 'Ada Obi',
  jobTitle: 'Product Designer',
  status: 'active',
} as StaffMember

const emptyPay: PayData = { currentPackageId: null, packages: [], grants: [] }

const pkg = (overrides: Partial<PayPackage> = {}): PayPackage => ({
  id: 'p-1',
  currency: 'NGN',
  period: 'monthly',
  baseSalary: 350000,
  bonus: 600000,
  commissionTarget: 600000,
  totalYearly: 5400000,
  commissionPlanId: null,
  startsOn: '2026-01-01',
  benefits: [{ id: 'b-1', name: 'Health cover' }],
  paragraph: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const renderTab = () =>
  render(
    <MemoryRouter>
      <PayTab staff={staff} organizationId="org-1" />
    </MemoryRouter>,
  )

const type = (label: RegExp, value: string, name: string) =>
  fireEvent.change(screen.getByLabelText(label), {
    target: { value, name },
  })

describe('PayTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets up pay with a yearly bonus and target and shows the total as you type', async () => {
    usePayMock.mockReturnValue({ pay: emptyPay, isLoading: false })
    savePayPackageMock.mockResolvedValue({})
    renderTab()

    expect(screen.getByText('No pay set up for Ada yet')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Set up pay' }))
    type(/Base salary/, '350000', 'baseSalary')
    type(/Bonus/, '600000', 'bonus')
    type(/Commission target/, '600000', 'commissionTarget')

    expect(await screen.findByText('₦5,400,000')).toBeTruthy()
    expect(screen.getByText('₦350,000 monthly')).toBeTruthy()
    expect(screen.getAllByText('per year')).toHaveLength(2)
    expect(screen.getByText('per month')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Save pay' }))
    await waitFor(() =>
      expect(savePayPackageMock).toHaveBeenCalledWith(
        's-1',
        expect.objectContaining({
          baseSalary: 350000,
          bonusPerYear: 600000,
          commissionTargetPerYear: 600000,
          period: 'monthly',
        }),
        'Ada',
      ),
    )
    const payload = savePayPackageMock.mock.calls[0]![1] as object
    expect(payload).not.toHaveProperty('bonus')
    expect(payload).not.toHaveProperty('commissionTarget')
  })

  it('shows the current package with its yearly total and the packages before it', () => {
    usePayMock.mockReturnValue({
      isLoading: false,
      pay: {
        currentPackageId: 'p-2',
        grants: [],
        packages: [
          pkg({ id: 'p-2' }),
          pkg({
            id: 'p-1',
            startsOn: '2025-02-03',
            baseSalary: 300000,
            bonus: 400000,
            commissionTarget: 0,
            totalYearly: 4000000,
          }),
        ],
      },
    })
    renderTab()

    expect(screen.getByText('Current package')).toBeTruthy()
    expect(screen.getByText('Since 1 Jan 2026 · Monthly · NGN')).toBeTruthy()
    expect(screen.getByText('₦5,400,000')).toBeTruthy()
    expect(screen.getByText('Past packages')).toBeTruthy()
    expect(screen.getByText('3 Feb 2025 – 31 Dec 2025')).toBeTruthy()
    expect(screen.getByText('₦300,000 / month')).toBeTruthy()
    expect(screen.getByText('₦4,000,000')).toBeTruthy()
  })

  it('leaves out past packages when there is only one', () => {
    usePayMock.mockReturnValue({
      isLoading: false,
      pay: { currentPackageId: 'p-1', grants: [], packages: [pkg()] },
    })
    renderTab()
    expect(screen.queryByText('Past packages')).toBeNull()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy()
  })
})
