import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MyTeam } from './MyTeam'

const { useMyTeam, useTeamMemberDetails } = vi.hoisted(() => ({
  useMyTeam: vi.fn(),
  useTeamMemberDetails: vi.fn(),
}))

vi.mock('@/features/people/hooks/usePerformance', () => ({
  useMyTeam,
  useTeamMemberDetails,
}))
vi.mock('@/features/people/components/performance/PerformanceCards', () => ({
  PerformanceCards: ({
    base,
    firstName,
  }: {
    base: string
    firstName?: string
  }) => (
    <div>
      Cards for {base} ({firstName})
    </div>
  ),
}))

const members = [
  {
    staffId: 's-2',
    fullName: 'Ada Obi',
    jobTitle: 'Designer',
    reportId: 'r-1',
    goalsWaiting: 2,
    goalReportsToRead: 0,
    relation: 'report' as const,
    departmentName: null,
  },
  {
    staffId: 's-3',
    fullName: 'Bayo Lawal',
    jobTitle: 'Engineer',
    reportId: null,
    goalsWaiting: 0,
    goalReportsToRead: 0,
    relation: 'report' as const,
    departmentName: null,
  },
  {
    staffId: 's-4',
    fullName: 'Hauwa Sani',
    jobTitle: 'Researcher',
    reportId: 'r-9',
    goalsWaiting: 1,
    goalReportsToRead: 0,
    relation: 'report' as const,
    departmentName: null,
  },
]

describe('MyTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('says why the tab is there and lists direct reports with their week and goals', () => {
    useMyTeam.mockReturnValue({
      team: { weekStart: '2026-11-02', members, departments: [] },
      isLoading: false,
    })
    render(<MyTeam managerStaffId="m-1" />)

    expect(
      screen.getByText('You see this tab because 3 people report to you.'),
    ).toBeTruthy()
    expect(screen.getByText('Your direct reports')).toBeTruthy()
    expect(screen.getAllByText("This week's report")).toHaveLength(3)
    expect(screen.getAllByText('Submitted')).toHaveLength(2)
    expect(screen.getByText('Not yet')).toBeTruthy()
    expect(screen.getByText('2 goals waiting for approval')).toBeTruthy()
    expect(screen.getByText('1 goal waiting for approval')).toBeTruthy()
    expect(screen.getByText('Goals approved')).toBeTruthy()
  })

  it('opens one person with the goals to approve, and comes back with either Back to team button', () => {
    useMyTeam.mockReturnValue({
      team: { weekStart: '2026-11-02', members, departments: [] },
      isLoading: false,
    })
    render(<MyTeam managerStaffId="m-1" />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Open' })[0]!)
    expect(
      screen.getByText('Ada Obi · 2 goals waiting for approval'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Read each goal. Change anything you want, then approve.',
      ),
    ).toBeTruthy()
    expect(
      screen.getByText('Cards for /my-work/m-1/team/s-2 (Ada)'),
    ).toBeTruthy()
    expect(
      screen.getAllByRole('button', { name: 'Back to team' }),
    ).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: 'Back to team' })[1]!)
    expect(screen.getByText('Your direct reports')).toBeTruthy()
  })

  it('handles an empty team and a failed load', () => {
    useMyTeam.mockReturnValue({
      team: { weekStart: '2026-11-02', members: [], departments: [] },
      isLoading: false,
    })
    const first = render(<MyTeam managerStaffId="m-1" />)
    expect(screen.getByText('Nobody reports to you right now.')).toBeTruthy()
    expect(screen.queryByText(/You see this tab/)).toBeNull()
    first.unmount()

    useMyTeam.mockReturnValue({ team: null, hasError: true })
    render(<MyTeam managerStaffId="m-1" />)
    expect(screen.getByText("Couldn't load your team")).toBeTruthy()
  })

  it('groups people by the departments the user heads, shows empty ones, and opens their details', () => {
    useTeamMemberDetails.mockReturnValue({
      details: {
        staffId: 's-5',
        fullName: 'Kemi Ade',
        jobTitle: 'Analyst',
        department: 'Sales',
        managerName: 'Bola Boss',
        email: 'kemi@example.com',
        phone: null,
        startDate: '2026-01-05',
        status: 'active',
        joinedAt: '2026-01-06T00:00:00.000Z',
      },
      isLoading: false,
    })
    useMyTeam.mockReturnValue({
      team: {
        weekStart: '2026-11-02',
        members: [
          {
            staffId: 's-5',
            fullName: 'Kemi Ade',
            jobTitle: 'Analyst',
            reportId: null,
            goalsWaiting: 0,
            goalReportsToRead: 0,
            relation: 'department',
            departmentName: 'Sales',
          },
        ],
        departments: [
          { id: 'd-1', name: 'Sales' },
          { id: 'd-2', name: 'Support' },
        ],
      },
      isLoading: false,
    })
    render(<MyTeam managerStaffId="m-1" />)

    expect(
      screen.getByText('You see this tab because you head Sales, Support.'),
    ).toBeTruthy()
    expect(screen.queryByText('Your direct reports')).toBeNull()
    expect(screen.getByText('No one is in Support yet.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(useTeamMemberDetails).toHaveBeenCalledWith('m-1', 's-5')
    expect(screen.getByText('kemi@example.com')).toBeTruthy()
    expect(screen.getByText('Bola Boss')).toBeTruthy()
  })

  it("doesn't show details for a direct report outside the user's departments", () => {
    useMyTeam.mockReturnValue({
      team: { weekStart: '2026-11-02', members, departments: [] },
      isLoading: false,
    })
    render(<MyTeam managerStaffId="m-1" />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Open' })[0]!)

    expect(screen.queryByText('Details')).toBeNull()
    expect(useTeamMemberDetails).not.toHaveBeenCalled()
  })
})
