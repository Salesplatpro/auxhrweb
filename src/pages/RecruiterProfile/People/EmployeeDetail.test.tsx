import { fireEvent, render, screen, within } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  StaffActivity,
  StaffInvite,
  StaffMember,
} from '@/features/people/types'

import { EmployeeDetail } from './EmployeeDetail'

const { useStaffMemberMock, useStaffActivityMock, sendInviteMock } = vi.hoisted(
  () => ({
    useStaffMemberMock: vi.fn(),
    useStaffActivityMock: vi.fn(),
    sendInviteMock: vi.fn(),
  }),
)

vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => ({
    organizationId: 'org-1',
    isLoading: false,
    isOwner: true,
    canManagePeople: true,
  }),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useStaffMember: useStaffMemberMock,
  useStaffActivity: useStaffActivityMock,
  useStaffOptions: () => ({ options: [], isLoading: false }),
}))

vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({
    sendInvite: sendInviteMock,
    saveStaff: vi.fn(),
    endEmployment: vi.fn(),
    addStaff: vi.fn(),
    isSaving: false,
  }),
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: { firstName: 'Olu', lastName: 'Owner' } }),
}))

const invite = (overrides: Partial<StaffInvite> = {}): StaffInvite => ({
  state: 'none',
  invitedByName: null,
  invitedAt: null,
  expiresAt: null,
  joinedAt: null,
  ...overrides,
})

const person = (overrides: Partial<StaffMember> = {}): StaffMember => ({
  id: 's-1',
  fullName: 'Ada Obi',
  email: 'ada@example.com',
  jobTitle: 'Product Designer',
  department: 'Design',
  managerId: null,
  managerName: null,
  startDate: '2026-01-05',
  endDate: null,
  status: 'invited',
  hiredThroughAuxhr: false,
  isExecutive: false,
  hasAccount: false,
  invite: invite(),
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const mockStaff = (staff: StaffMember | null, extra = {}) =>
  useStaffMemberMock.mockReturnValue({
    staff,
    isLoading: false,
    hasError: !staff,
    isForbidden: false,
    ...extra,
  })

const renderPage = (path = '/people/employees/s-1') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/people/employees/:staffId" element={<EmployeeDetail />} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  useStaffActivityMock.mockReturnValue({
    activities: [],
    isLoading: false,
    hasError: false,
  })
})

describe('EmployeeDetail', () => {
  it('shows the person, their status and the HR who invited them', () => {
    mockStaff(
      person({
        invite: invite({
          state: 'pending',
          invitedByName: 'Hana Resources',
          invitedAt: '2026-03-03T09:00:00.000Z',
          expiresAt: '2026-03-10T09:00:00.000Z',
        }),
      }),
    )
    renderPage()

    expect(screen.getByRole('heading', { name: 'Ada Obi' })).toBeTruthy()
    expect(screen.getByText('Product Designer · Design')).toBeTruthy()
    expect(screen.getByText('Invited')).toBeTruthy()
    const banner = screen.getByRole('status')
    expect(banner.textContent).toContain('Invited by Hana Resources')
    expect(banner.textContent).toContain('expires on 10 Mar 2026')
  })

  it('resends the invite from the banner', () => {
    mockStaff(
      person({
        invite: invite({ state: 'pending', invitedByName: 'Hana Resources' }),
      }),
    )
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Resend invite' }))
    expect(sendInviteMock).toHaveBeenCalledWith('s-1')
  })

  it('offers a new invite when the old one expired', () => {
    mockStaff(
      person({
        invite: invite({
          state: 'expired',
          invitedByName: 'Hana Resources',
          expiresAt: '2026-03-10T09:00:00.000Z',
        }),
      }),
    )
    renderPage()

    expect(screen.getByRole('status').textContent).toContain('expired')
    expect(
      screen.getByRole('button', { name: 'Send a new invite' }),
    ).toBeTruthy()
  })

  it('shows when and by whom someone joined, with no invite button', () => {
    mockStaff(
      person({
        status: 'active',
        hasAccount: true,
        invite: invite({
          state: 'accepted',
          invitedByName: 'Hana Resources',
          joinedAt: '2026-03-05T09:00:00.000Z',
        }),
      }),
    )
    renderPage()

    expect(screen.getByRole('status').textContent).toContain(
      'Joined AuxHR on 5 Mar 2026. Invited by Hana Resources.',
    )
    expect(screen.queryByRole('button', { name: /invite/i })).toBeNull()
  })

  it('shows no invite banner or End button once employment has ended', () => {
    mockStaff(person({ status: 'ended', endDate: '2026-04-01' }))
    renderPage()

    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByRole('button', { name: /End employment/ })).toBeNull()
    expect(screen.getByText('1 Apr 2026')).toBeTruthy()
  })

  it('lists what happened to the person on the Activity tab', () => {
    mockStaff(person())
    const activities: StaffActivity[] = [
      {
        id: 'a-2',
        type: 'invited',
        actorId: 'u-1',
        actorName: 'Hana Resources',
        meta: null,
        createdAt: '2026-03-03T09:00:00.000Z',
      },
      {
        id: 'a-1',
        type: 'created',
        actorId: 'u-1',
        actorName: 'Hana Resources',
        meta: null,
        createdAt: '2026-03-03T08:59:00.000Z',
      },
      {
        id: 'a-3',
        type: 'updated',
        actorId: 'u-0',
        actorName: 'Olu Owner',
        meta: { changes: { jobTitle: ['Designer', 'Product Designer'] } },
        createdAt: '2026-03-04T08:59:00.000Z',
      },
    ]
    useStaffActivityMock.mockReturnValue({
      activities,
      isLoading: false,
      hasError: false,
    })
    renderPage('/people/employees/s-1?tab=activity')

    const timeline = screen.getByRole('list', { name: 'Employee activity' })
    expect(within(timeline).getByText('Added by Hana Resources')).toBeTruthy()
    expect(within(timeline).getByText('Invited by Hana Resources')).toBeTruthy()
    expect(
      within(timeline).getByText('Details updated by Olu Owner'),
    ).toBeTruthy()
    expect(
      within(timeline).getByText('Job title: Designer → Product Designer'),
    ).toBeTruthy()
  })

  it('says so when the employee cannot be found', () => {
    mockStaff(null)
    renderPage()

    expect(screen.getByText("We couldn't find this employee")).toBeTruthy()
  })

  it('shows the no-access screen when the server refuses', () => {
    mockStaff(null, { isForbidden: true })
    renderPage()

    expect(screen.getByText("You don't have access to People")).toBeTruthy()
  })
})
