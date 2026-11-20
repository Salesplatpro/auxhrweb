import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Benefits } from './Benefits'

const { useBenefitsMock } = vi.hoisted(() => ({ useBenefitsMock: vi.fn() }))

vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => ({ organizationId: 'org-1' }),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useBenefits: useBenefitsMock,
}))

vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({
    saveBenefit: vi.fn(),
    removeBenefit: vi.fn(),
    isSaving: false,
  }),
}))

const benefits = [
  { id: 'b-1', name: 'Health cover', description: 'HMO', givenTo: 3 },
  { id: 'b-2', name: 'Transport allowance', description: null, givenTo: 0 },
]

const renderPage = () =>
  render(
    <MemoryRouter>
      <Benefits />
    </MemoryRouter>,
  )

beforeEach(() => {
  useBenefitsMock.mockReturnValue({
    benefits,
    isLoading: false,
    hasError: false,
  })
})

describe('Benefits', () => {
  it('counts the benefits and shows who has each one', () => {
    renderPage()

    expect(screen.getByText('2 benefits')).toBeTruthy()
    expect(screen.getByText('3 people')).toBeTruthy()
    expect(screen.getByText('Nobody')).toBeTruthy()
  })

  it('opens the add form in a dialog', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Add benefit' }))

    expect(
      screen.getByText("It will show on everyone's Pay tab to tick."),
    ).toBeTruthy()
    expect(screen.getByLabelText('Short description (optional)')).toBeTruthy()
  })

  it('says who is affected before a benefit is deleted', () => {
    renderPage()
    fireEvent.click(screen.getAllByLabelText('Benefit actions')[1]!)
    fireEvent.click(screen.getByText('Delete'))

    expect(screen.getByText('Delete Transport allowance?')).toBeTruthy()
    expect(
      screen.getByText(
        'Nobody has it right now. It will be removed from the list.',
      ),
    ).toBeTruthy()
  })
})
