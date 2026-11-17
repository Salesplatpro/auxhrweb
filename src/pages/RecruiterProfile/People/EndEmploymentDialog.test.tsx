import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { StaffMember } from '@/features/people/types'
import { toDateOnly, todayDateOnly } from '@/features/people/utils/formatDate'

import { EndEmploymentDialog } from './EndEmploymentDialog'

const { endEmploymentMock } = vi.hoisted(() => ({ endEmploymentMock: vi.fn() }))

vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({
    endEmployment: endEmploymentMock,
    isSaving: false,
  }),
}))

const staff = {
  id: 's-1',
  fullName: 'Ada Obi',
  startDate: '2026-01-05',
} as StaffMember
const onClose = vi.fn()

const renderDialog = () =>
  render(
    <EndEmploymentDialog
      staff={staff}
      organizationId="org-1"
      onClose={onClose}
    />,
  )

beforeEach(() => {
  vi.clearAllMocks()
})

const daysFromToday = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toDateOnly(date)
}

const endButton = () => screen.getByRole('button', { name: 'End employment' })

describe('EndEmploymentDialog', () => {
  it('ends employment today with no reason by default and closes', async () => {
    endEmploymentMock.mockResolvedValue({ id: 's-1' })
    renderDialog()

    fireEvent.click(endButton())

    await waitFor(() =>
      expect(endEmploymentMock).toHaveBeenCalledWith(
        's-1',
        todayDateOnly(),
        null,
      ),
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('sends a future last day and the chosen reason', async () => {
    endEmploymentMock.mockResolvedValue({ id: 's-1' })
    renderDialog()
    const lastDay = daysFromToday(11)

    fireEvent.change(screen.getByLabelText('Last working day'), {
      target: { value: lastDay },
    })
    expect(
      screen.getByText('Ada keeps access to My work until this date.'),
    ).toBeTruthy()
    fireEvent.click(screen.getByText('Choose a reason'))
    fireEvent.click(screen.getByText('Contract ended'))
    fireEvent.click(endButton())

    await waitFor(() =>
      expect(endEmploymentMock).toHaveBeenCalledWith(
        's-1',
        lastDay,
        'contract_ended',
      ),
    )
  })

  it('stays open when ending fails', async () => {
    endEmploymentMock.mockResolvedValue(null)
    renderDialog()

    fireEvent.click(endButton())

    await waitFor(() => expect(endEmploymentMock).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })

  it.each([
    ['before the start date', '2026-01-04'],
    ['more than a year away', daysFromToday(370)],
  ])('will not accept a last day %s', (_label, value) => {
    renderDialog()

    fireEvent.change(screen.getByLabelText('Last working day'), {
      target: { value },
    })
    fireEvent.click(endButton())

    expect(
      screen.getByText(
        'Pick a date between their start date and a year from today.',
      ),
    ).toBeTruthy()
    expect(endEmploymentMock).not.toHaveBeenCalled()
  })

  it('renders nothing without a person', () => {
    const { container } = render(
      <EndEmploymentDialog
        staff={null}
        organizationId="org-1"
        onClose={onClose}
      />,
    )
    expect(container.innerHTML).toBe('')
  })
})
