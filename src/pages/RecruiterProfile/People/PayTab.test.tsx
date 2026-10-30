import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PayData, StaffMember } from '@/features/people/types'

import { PayTab } from './PayTab'

const { usePayMock, previewMock, savePayPackageMock } = vi.hoisted(() => ({
  usePayMock: vi.fn(),
  previewMock: vi.fn(),
  savePayPackageMock: vi.fn(),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  usePay: usePayMock,
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

vi.mock('@/features/people/services/peopleService', () => ({
  previewPayParagraph: previewMock,
}))

const staff = {
  id: 's-1',
  fullName: 'Ada Obi',
  status: 'active',
} as StaffMember

const emptyPay: PayData = { currentPackageId: null, packages: [], grants: [] }

const renderTab = () =>
  render(
    <MemoryRouter>
      <PayTab staff={staff} organizationId="org-1" />
    </MemoryRouter>,
  )

describe('PayTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('leads from the empty state into the form and previews the paragraph', async () => {
    usePayMock.mockReturnValue({ pay: emptyPay, isLoading: false })
    previewMock.mockResolvedValue('Your base salary is NGN 400,000 per month.')
    renderTab()

    expect(screen.getByText('No pay set up yet')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Set up pay' }))
    fireEvent.change(screen.getByLabelText(/Base salary/), {
      target: { value: '400000', name: 'baseSalary' },
    })

    expect(
      await screen.findByText('Your base salary is NGN 400,000 per month.'),
    ).toBeTruthy()
    expect(previewMock).toHaveBeenLastCalledWith(
      'org-1',
      expect.objectContaining({ baseSalary: 400000, currency: 'NGN' }),
    )
  })

  it('summarises the current package as yearly pay', () => {
    usePayMock.mockReturnValue({
      isLoading: false,
      pay: {
        currentPackageId: 'p-1',
        grants: [],
        packages: [
          {
            id: 'p-1',
            currency: 'NGN',
            period: 'monthly',
            baseSalary: 400000,
            bonus: 50000,
            commissionTarget: 0,
            startsOn: '2026-01-05',
            benefits: [{ id: 'b-1', name: 'Health cover' }],
            paragraph: 'Your base salary is NGN 400,000 per month.',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    })
    renderTab()

    expect(screen.getByText('NGN 5,400,000')).toBeTruthy()
    expect(
      screen.getByText('Your base salary is NGN 400,000 per month.'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy()
  })
})
