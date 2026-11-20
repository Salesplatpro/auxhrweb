import { fireEvent, render, screen, within } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HeadcountCost } from './HeadcountCost'

const { useHeadcountCostMock } = vi.hoisted(() => ({
  useHeadcountCostMock: vi.fn(),
}))

vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => ({ organizationId: 'org-1' }),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useHeadcountCost: useHeadcountCostMock,
}))

const row = (department: string, staffCount: number, baseSalary: number) => ({
  currency: 'NGN',
  department,
  staffCount,
  baseSalary,
  bonus: 0,
  commissionTarget: 0,
  total: baseSalary,
})

const cost = {
  totals: [row('', 3, 39_720_000)],
  departments: [row('Engineering', 2, 13_800_000), row('Sales', 1, 9_360_000)],
  headcount: 3,
  invited: { count: 1, names: ['Halima Bello'] },
  left: { count: 2, names: ['Ibrahim Musa', 'Ada Obi'] },
  byMonth: [
    { month: '2026-10', headcount: 2 },
    { month: '2026-11', headcount: 3 },
  ],
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <HeadcountCost />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  useHeadcountCostMock.mockReturnValue({
    cost,
    isLoading: false,
    hasError: false,
  })
})

describe('HeadcountCost', () => {
  it('shows headcount, invited, leavers and the monthly base pay', () => {
    renderPage()

    expect(screen.getByText('active today')).toBeTruthy()
    expect(screen.getByText('Halima Bello, starts soon')).toBeTruthy()
    expect(screen.getByText('Ibrahim Musa, Ada Obi')).toBeTruthy()
    expect(screen.getByText('₦3,310,000')).toBeTruthy()
  })

  it('lists each department with its monthly base pay', () => {
    renderPage()

    const row = screen.getByText('Engineering').closest('tr')!
    expect(within(row).getByText('₦1,150,000')).toBeTruthy()
  })

  it('asks for a shorter period', () => {
    renderPage()
    fireEvent.click(screen.getByText('Last 12 months'))
    fireEvent.click(screen.getByText('Last 6 months'))

    expect(useHeadcountCostMock).toHaveBeenLastCalledWith('org-1', 6)
  })

  it('does not pretend there is no cost when loading failed', () => {
    useHeadcountCostMock.mockReturnValue({
      cost: null,
      isLoading: false,
      hasError: true,
    })
    renderPage()

    expect(screen.getByText("Couldn't load headcount cost")).toBeTruthy()
  })
})
