import { fireEvent, render, screen, within } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { StaffMember } from '@/features/people/types'

import { Employees } from './Employees'

const { navigateMock, useStaffListMock, sendInviteMock, endEmploymentMock } =
  vi.hoisted(() => ({
    navigateMock: vi.fn(),
    useStaffListMock: vi.fn(),
    sendInviteMock: vi.fn(),
    endEmploymentMock: vi.fn(),
  }))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => ({
    organizationId: 'org-1',
    isLoading: false,
    isOwner: true,
    canManagePeople: true,
  }),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useStaffList: useStaffListMock,
  useStaffOptions: () => ({ options: [], isLoading: false }),
}))

vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({
    sendInvite: sendInviteMock,
    endEmployment: endEmploymentMock,
    addStaff: vi.fn(),
    saveStaff: vi.fn(),
    isSaving: false,
  }),
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: {
      firstName: 'Olu',
      lastName: 'Owner',
      activeOrganization: { name: 'Acme Ltd' },
    },
  }),
}))

const person = (overrides: Partial<StaffMember> = {}): StaffMember => ({
  id: 's-1',
  fullName: 'Ada Obi',
  email: 'ada@example.com',
  jobTitle: 'Product Designer',
  department: 'Design',
  managerId: 'm-1',
  managerName: 'Bola Boss',
  startDate: '2026-01-05',
  endDate: null,
  status: 'active',
  hiredThroughAuxhr: false,
  isExecutive: false,
  hasAccount: false,
  invite: {
    state: 'none',
    invitedByName: null,
    invitedAt: null,
    expiresAt: null,
    joinedAt: null,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const mockList = (
  items: StaffMember[],
  overrides: Record<string, unknown> = {},
) =>
  useStaffListMock.mockReturnValue({
    items,
    total: items.length,
    counts: { invited: 0, active: items.length, ended: 0 },
    isLoading: false,
    hasError: false,
    isForbidden: false,
    ...overrides,
  })

const renderPage = () =>
  render(
    <MemoryRouter>
      <Employees />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Employees', () => {
  it('shows each person with their title, manager, start date and status', () => {
    mockList([person()])
    renderPage()

    const row = screen.getByText('Ada Obi').closest('tr')!
    expect(within(row).getByText('ada@example.com')).toBeTruthy()
    expect(within(row).getByText('Product Designer')).toBeTruthy()
    expect(within(row).getByText('Bola Boss')).toBeTruthy()
    expect(within(row).getByText('5 Jan 2026')).toBeTruthy()
    expect(within(row).getByText('Active')).toBeTruthy()
    expect(within(row).getByText('Outside')).toBeTruthy()
  })

  it('opens an employee when their row is clicked', () => {
    mockList([person()])
    renderPage()

    fireEvent.click(screen.getByText('Ada Obi'))
    expect(navigateMock).toHaveBeenCalledWith(
      '/recruiterDashboard/people/employees/s-1',
    )
  })

  it('shows invited people and flags an expired invite', () => {
    mockList(
      [
        person({
          status: 'invited',
          invite: {
            state: 'expired',
            invitedByName: 'Hana Resources',
            invitedAt: null,
            expiresAt: null,
            joinedAt: null,
          },
        }),
      ],
      { counts: { invited: 1, active: 0, ended: 0 } },
    )
    renderPage()

    expect(screen.getAllByText('Invited').length).toBeGreaterThan(0)
    expect(screen.getByText('Invite expired')).toBeTruthy()
  })

  it('asks HR to add the first employee when the company has none', () => {
    mockList([], { counts: { invited: 0, active: 0, ended: 0 } })
    renderPage()

    expect(screen.getByText('No employees yet')).toBeTruthy()
    const buttons = screen.getAllByRole('button', { name: 'Add employee' })
    fireEvent.click(buttons[buttons.length - 1]!)
    expect(screen.getByRole('dialog', { name: 'Add employee' })).toBeTruthy()
  })

  it('opens the Add employee panel with the invite box ticked', () => {
    mockList([person()])
    renderPage()

    fireEvent.click(screen.getAllByRole('button', { name: 'Add employee' })[0]!)
    const dialog = screen.getByRole('dialog', { name: 'Add employee' })
    const invite = within(dialog).getByLabelText(
      'Send an invite email',
    ) as HTMLInputElement
    expect(invite.checked).toBe(true)
  })

  it('sends an invite from the row menu for someone without an account', () => {
    mockList([person()])
    renderPage()

    const row = screen.getByText('Ada Obi').closest('tr')!
    fireEvent.click(within(row).getByLabelText('Row actions'))
    fireEvent.click(screen.getByText('Send invite'))
    expect(sendInviteMock).toHaveBeenCalledWith('s-1')
  })

  it('offers no invite for someone who already joined', () => {
    mockList([person({ hasAccount: true })])
    renderPage()

    const row = screen.getByText('Ada Obi').closest('tr')!
    fireEvent.click(within(row).getByLabelText('Row actions'))
    expect(screen.queryByText('Send invite')).toBeNull()
    expect(screen.getByText('End employment')).toBeTruthy()
  })

  it('shows the no-access screen when the server refuses', () => {
    mockList([], { isForbidden: true })
    renderPage()

    expect(screen.getByText("You don't have access to People")).toBeTruthy()
  })
})
