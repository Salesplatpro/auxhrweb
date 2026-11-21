import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrgChart } from './OrgChart'

const mocks = vi.hoisted(() => ({
  useOrgChart: vi.fn(),
  saveStaff: vi.fn(),
  reload: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('@/features/people/hooks/usePerformance', () => ({
  useOrgChart: mocks.useOrgChart,
}))
vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({ saveStaff: mocks.saveStaff, isSaving: false }),
}))
vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => ({ organizationId: 'o-1' }),
}))
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mocks.navigate,
}))

const person = (
  id: string,
  managerId: string | null,
  extra: Partial<{ managerLeft: boolean }> = {},
) => ({
  id,
  fullName: `Person ${id}`,
  jobTitle: 'Role',
  department: null,
  managerId,
  managerLeft: false,
  ...extra,
})

const showChart = (people: ReturnType<typeof person>[], truncated = false) => {
  mocks.useOrgChart.mockReturnValue({
    chart: { people, truncated },
    isLoading: false,
    hasError: false,
    reload: mocks.reload,
  })
  return render(
    <MemoryRouter>
      <OrgChart />
    </MemoryRouter>,
  )
}

const dropdown = (id: string) =>
  document.querySelector(
    `[data-field="reports-to-${id}"] button`,
  ) as HTMLElement

describe('OrgChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.reload.mockResolvedValue(undefined)
    mocks.saveStaff.mockResolvedValue({ id: 'x' })
  })

  it('lists people with no manager apart with a Choose a manager box, and notes when a manager left', () => {
    showChart([person('a', null), person('b', null, { managerLeft: true })])
    expect(screen.getByText('No manager set')).toBeTruthy()
    expect(screen.getByText('2 people')).toBeTruthy()
    expect(screen.getByText('Their manager has left')).toBeTruthy()
    expect(screen.getAllByText('Choose a manager')).toHaveLength(2)
  })

  it('shows each person under their manager with the manager already chosen', () => {
    showChart([person('a', null), person('b', 'a'), person('c', 'a')])
    expect(screen.getByText('Reporting lines')).toBeTruthy()
    expect(dropdown('b').textContent).toContain('Person a')
    expect(dropdown('c').textContent).toContain('Person a')
  })

  it('collapses below the second level until opened', () => {
    showChart([
      person('a', null),
      person('b', 'a'),
      person('c', 'b'),
      person('d', 'c'),
    ])
    expect(screen.getByText('Person c')).toBeTruthy()
    expect(screen.queryByText('Person d')).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: /Show 1 people under Person c/ }),
    )
    expect(screen.getByText('Person d')).toBeTruthy()
  })

  it('offers no one under the person, then saves the new manager and refreshes', async () => {
    showChart([person('a', null), person('b', 'a'), person('c', null)])
    fireEvent.click(dropdown('a'))
    const box = document.querySelector(
      '[data-field="reports-to-a"]',
    ) as HTMLElement
    expect(within(box).queryByText('Person b')).toBeNull()
    expect(within(box).queryByText('Person a')).toBeNull()
    fireEvent.click(within(box).getByText('Person c'))
    await waitFor(() =>
      expect(mocks.saveStaff).toHaveBeenCalledWith('a', { managerId: 'c' }),
    )
    await waitFor(() => expect(mocks.reload).toHaveBeenCalled())
  })

  it('can clear a manager', async () => {
    showChart([person('a', null), person('b', 'a')])
    fireEvent.click(dropdown('b'))
    fireEvent.click(screen.getByText('No manager'))
    await waitFor(() =>
      expect(mocks.saveStaff).toHaveBeenCalledWith('b', { managerId: null }),
    )
  })

  it('reloads the tree even when the server refuses', async () => {
    mocks.saveStaff.mockResolvedValue(null)
    showChart([person('a', null), person('b', 'a')])
    fireEvent.click(dropdown('b'))
    fireEvent.click(screen.getByText('No manager'))
    await waitFor(() => expect(mocks.reload).toHaveBeenCalled())
  })

  it('does not hang on data with a loop', () => {
    showChart([person('a', 'b'), person('b', 'a')])
    expect(screen.getByText('Person a')).toBeTruthy()
  })

  it('shows empty, error and cut-off states', () => {
    const empty = showChart([])
    expect(screen.getByText('No people yet')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Add employee' }))
    expect(mocks.navigate).toHaveBeenCalledWith(
      '/recruiterDashboard/people/employees',
    )
    empty.unmount()

    const cut = showChart([person('a', null)], true)
    expect(screen.getByText(/first 5,000/)).toBeTruthy()
    cut.unmount()

    mocks.useOrgChart.mockReturnValue({
      chart: null,
      hasError: true,
      reload: mocks.reload,
    })
    render(
      <MemoryRouter>
        <OrgChart />
      </MemoryRouter>,
    )
    expect(screen.getByText('We could not load the org chart')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(mocks.reload).toHaveBeenCalled()
  })
})
