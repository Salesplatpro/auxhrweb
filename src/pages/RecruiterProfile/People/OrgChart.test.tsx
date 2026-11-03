import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrgChart } from './OrgChart'

const mocks = vi.hoisted(() => ({
  useOrgChart: vi.fn(),
  saveStaff: vi.fn(),
  reload: vi.fn(),
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

const openPicker = (index: number) =>
  fireEvent.click(screen.getAllByRole('button', { name: 'Reports to' })[index]!)

describe('OrgChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.reload.mockResolvedValue(undefined)
  })

  it('lists people with no manager apart, and notes when a manager left', () => {
    showChart([person('a', null), person('b', null, { managerLeft: true })])
    expect(screen.getByText('No manager set')).toBeTruthy()
    expect(screen.getByText('Their manager has left')).toBeTruthy()
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

  it('keeps the current manager when saved without a change', async () => {
    mocks.saveStaff.mockResolvedValue({ id: 'b' })
    showChart([person('a', null), person('b', 'a')])
    openPicker(1)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(mocks.saveStaff).toHaveBeenCalledWith('b', { managerId: 'a' }),
    )
  })

  it('offers no one under the person, then saves and refreshes the tree', async () => {
    mocks.saveStaff.mockResolvedValue({ id: 'a' })
    showChart([person('a', null), person('b', 'a'), person('c', null)])
    openPicker(1)
    const select = screen.getByLabelText('Reports to') as HTMLSelectElement
    expect(Array.from(select.options).map((option) => option.value)).toEqual([
      '',
      'c',
    ])
    fireEvent.change(select, { target: { value: 'c' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(mocks.saveStaff).toHaveBeenCalledWith('a', { managerId: 'c' }),
    )
    await waitFor(() => expect(mocks.reload).toHaveBeenCalled())
  })

  it('reloads and stays open when the server refuses', async () => {
    mocks.saveStaff.mockResolvedValue(null)
    showChart([person('a', null), person('b', 'a')])
    openPicker(1)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(mocks.reload).toHaveBeenCalled())
    expect(screen.getByLabelText('Reports to')).toBeTruthy()
  })

  it('does not hang on data with a loop', () => {
    showChart([person('a', 'b'), person('b', 'a')])
    expect(screen.getByText('Person a')).toBeTruthy()
  })

  it('shows empty, error and cut-off states', () => {
    const empty = showChart([])
    expect(screen.getByText('No staff yet')).toBeTruthy()
    empty.unmount()

    const cut = showChart([person('a', null)], true)
    expect(screen.getByText(/first 5,000/)).toBeTruthy()
    cut.unmount()

    mocks.useOrgChart.mockReturnValue({ chart: null, hasError: true })
    render(
      <MemoryRouter>
        <OrgChart />
      </MemoryRouter>,
    )
    expect(screen.getByText("Couldn't load the org chart")).toBeTruthy()
  })
})
