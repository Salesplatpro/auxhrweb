import { render, screen, within } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AccessLog } from './AccessLog'

const { useAccessLogMock, useStaffOptionsMock } = vi.hoisted(() => ({
  useAccessLogMock: vi.fn(),
  useStaffOptionsMock: vi.fn(),
}))

vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => ({ organizationId: 'org-1' }),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useAccessLog: useAccessLogMock,
  useStaffOptions: useStaffOptionsMock,
}))

vi.mock('@/features/organizations/hooks/useOrganizationMembers', () => ({
  useOrganizationMembers: () => ({ members: [], isLoading: false }),
}))

const logState = (items: unknown[], overrides = {}) =>
  useAccessLogMock.mockReturnValue({
    items,
    total: items.length,
    isLoading: false,
    hasError: false,
    ...overrides,
  })

const renderPage = () =>
  render(
    <MemoryRouter>
      <AccessLog />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  useStaffOptionsMock.mockReturnValue({ options: [], isLoading: false })
})

describe('AccessLog', () => {
  it('shows who opened what, and from where', () => {
    logState([
      {
        id: 'l-1',
        createdAt: '2026-03-10T09:30:00.000Z',
        actorId: 'u-1',
        actorName: 'Hana Resources',
        staffId: 's-1',
        staffName: 'Ada Obi',
        resource: 'staff_record',
        description: 'Staff record of Ada Obi',
        ip: '203.0.113.9',
      },
    ])
    renderPage()

    const row = screen.getByText('Hana Resources').closest('tr')!
    expect(within(row).getByText('Staff record of Ada Obi')).toBeTruthy()
    expect(within(row).getByText('203.0.113.9')).toBeTruthy()
  })

  it('lets the owner filter by anyone who ever worked there, including people who left', () => {
    logState([])
    renderPage()

    expect(useStaffOptionsMock).toHaveBeenCalledWith('org-1', {
      includeEnded: true,
    })
  })

  it('says so when nobody has opened a record yet', () => {
    logState([])
    renderPage()

    expect(screen.getByText('Nothing here yet')).toBeTruthy()
  })

  it('does not pretend an empty log when loading failed', () => {
    logState([], { hasError: true })
    renderPage()

    expect(screen.getByText("Couldn't load the access log")).toBeTruthy()
    expect(screen.queryByText('Nothing here yet')).toBeNull()
  })
})
