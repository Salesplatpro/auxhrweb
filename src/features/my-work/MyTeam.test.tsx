import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MyTeam } from './MyTeam'

const { useMyTeam } = vi.hoisted(() => ({ useMyTeam: vi.fn() }))

vi.mock('@/features/people/hooks/usePerformance', () => ({ useMyTeam }))
vi.mock('@/features/people/components/performance/PerformanceCards', () => ({
  PerformanceCards: ({ base }: { base: string }) => <div>Cards for {base}</div>,
}))

const members = [
  {
    staffId: 's-2',
    fullName: 'Ada Obi',
    jobTitle: 'Designer',
    reportId: 'r-1',
    goalsWaiting: 2,
  },
  {
    staffId: 's-3',
    fullName: 'Bayo Lawal',
    jobTitle: 'Engineer',
    reportId: null,
    goalsWaiting: 0,
  },
]

describe('MyTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows who has submitted and which goals wait, then opens one person', () => {
    useMyTeam.mockReturnValue({
      team: { weekStart: '2026-11-02', members },
      isLoading: false,
    })
    render(<MyTeam managerStaffId="m-1" />)

    expect(screen.getByText(/Submitted · 2 goals waiting/)).toBeTruthy()
    expect(screen.getByText(/Engineer · Not yet/)).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Open' })[0]!)
    expect(screen.getByText('Cards for /my-work/m-1/team/s-2')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '← My team' }))
    expect(screen.getByText('Ada Obi')).toBeTruthy()
  })

  it('handles an empty team and a failed load', () => {
    useMyTeam.mockReturnValue({
      team: { weekStart: '2026-11-02', members: [] },
      isLoading: false,
    })
    const first = render(<MyTeam managerStaffId="m-1" />)
    expect(screen.getByText('Nobody reports to you right now.')).toBeTruthy()
    first.unmount()

    useMyTeam.mockReturnValue({ team: null, hasError: true })
    render(<MyTeam managerStaffId="m-1" />)
    expect(screen.getByText("Couldn't load your team")).toBeTruthy()
  })
})
