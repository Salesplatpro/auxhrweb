import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MyWork } from './MyWork'

const { useMyWorkMock, setMyTaskDoneMock } = vi.hoisted(() => ({
  useMyWorkMock: vi.fn(),
  setMyTaskDoneMock: vi.fn(),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useMyWork: useMyWorkMock,
  useMyPay: () => ({
    isLoading: false,
    pay: { currentPackageId: null, packages: [], grants: [] },
  }),
}))

vi.mock('@/features/people/services/peopleService', () => ({
  MY_WORK_KEY: '/my-work',
  setMyTaskDone: setMyTaskDoneMock,
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: { firstName: 'Ada' } }),
}))

const record = {
  staffId: 's-1',
  companyName: 'Acme Ltd',
  companyLogoUrl: null,
  jobTitle: 'Product Designer',
  managerName: 'Olu Owner',
  startDate: '2026-01-05',
  documentsToSign: [
    { id: 'd-1', title: 'Offer letter', sentAt: '2026-01-02T00:00:00Z' },
  ],
  tasks: [
    {
      id: 't-1',
      title: 'Collect your laptop',
      dueOn: '2026-01-05',
      doneAt: null,
    },
  ],
}

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter>
        <MyWork />
      </MemoryRouter>
    </SWRConfig>,
  )

describe('MyWork', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the welcome card, documents to sign and first-week tasks', () => {
    useMyWorkMock.mockReturnValue({ records: [record], isLoading: false })
    setMyTaskDoneMock.mockResolvedValue({ ...record.tasks[0], doneAt: 'now' })
    renderPage()

    expect(screen.getByText('Welcome to Acme Ltd')).toBeTruthy()
    expect(screen.getByText('Olu Owner')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Sign' }).getAttribute('href'),
    ).toBe('/talentDashboard/my-work/documents/d-1')
    fireEvent.click(screen.getByLabelText('Collect your laptop'))
    expect(setMyTaskDoneMock).toHaveBeenCalledWith('t-1', true)
  })

  it('explains the page to someone who is not on a staff yet', () => {
    useMyWorkMock.mockReturnValue({ records: [], isLoading: false })
    renderPage()

    expect(screen.getByText("You're not on a company's staff yet")).toBeTruthy()
  })
})
