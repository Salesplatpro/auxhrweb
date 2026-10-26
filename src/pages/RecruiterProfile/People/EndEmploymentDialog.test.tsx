import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { StaffMember } from '@/features/people/types'
import { todayDateOnly } from '@/features/people/utils/formatDate'

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

describe('EndEmploymentDialog', () => {
  it('ends employment today by default and closes', async () => {
    endEmploymentMock.mockResolvedValue({ id: 's-1' })
    renderDialog()

    fireEvent.click(screen.getByRole('button', { name: 'End employment' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(endEmploymentMock).toHaveBeenCalledWith('s-1', todayDateOnly())
  })

  it('stays open when ending fails', async () => {
    endEmploymentMock.mockResolvedValue(null)
    renderDialog()

    fireEvent.click(screen.getByRole('button', { name: 'End employment' }))
    await waitFor(() => expect(endEmploymentMock).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })

  it('will not accept a last day before the start date', () => {
    renderDialog()

    fireEvent.change(screen.getByLabelText('Last day of employment'), {
      target: { value: '2026-01-01' },
    })
    expect(
      screen.getByText('Pick a date between their start date and today.'),
    ).toBeTruthy()
    expect(
      (
        screen.getByRole('button', {
          name: 'End employment',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
  })

  it('renders nothing without a person', () => {
    render(
      <EndEmploymentDialog
        staff={null}
        organizationId="org-1"
        onClose={onClose}
      />,
    )
    expect(screen.queryByText(/End employment for/)).toBeNull()
  })
})
