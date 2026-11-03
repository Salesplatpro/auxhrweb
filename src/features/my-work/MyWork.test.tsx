import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MyWork } from './MyWork'

const { useMyWorkMock, downloadMock, notifyMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(),
  useMyWorkMock: vi.fn(),
  downloadMock: vi.fn(),
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
  downloadMySignedDocument: downloadMock,
}))

vi.mock('./CompletionAction', () => ({
  CompletionAction: () => <button type="button">Request completion</button>,
}))

vi.mock('./MyPerformance', () => ({
  MyPerformance: () => <div>My performance cards</div>,
}))

vi.mock('./MyTeam', () => ({
  MyTeam: () => <div>My team list</div>,
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

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
  hasTeam: false,
  signedDocuments: [] as {
    id: string
    title: string
    signedAt: string | null
  }[],
  completionRequests: [],
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
    renderPage()

    expect(screen.getByText('Welcome to Acme Ltd')).toBeTruthy()
    expect(screen.getByText('Olu Owner')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Sign' }).getAttribute('href'),
    ).toBe('/talentDashboard/my-work/documents/d-1')
    expect(screen.getByText('Collect your laptop')).toBeTruthy()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Request completion' }),
    ).toBeTruthy()
  })

  it('lists signed documents and shows why a download failed', async () => {
    useMyWorkMock.mockReturnValue({
      records: [
        {
          ...record,
          signedDocuments: [
            { id: 'd-2', title: 'NDA', signedAt: '2026-01-03T00:00:00Z' },
          ],
        },
      ],
      isLoading: false,
    })
    downloadMock.mockRejectedValue({
      response: { data: { error: { message: 'Still being prepared' } } },
    })
    renderPage()

    expect(screen.getByText('NDA')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))
    expect(downloadMock).toHaveBeenCalledWith('d-2')
    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith('error', 'Still being prepared'),
    )
  })

  it('offers My team only to someone with people reporting to them', () => {
    useMyWorkMock.mockReturnValue({ records: [record], isLoading: false })
    const first = renderPage()
    expect(screen.queryByRole('tab', { name: 'My team' })).toBeNull()
    expect(screen.queryByText('My team')).toBeNull()
    first.unmount()

    useMyWorkMock.mockReturnValue({
      records: [{ ...record, hasTeam: true }],
      isLoading: false,
    })
    renderPage()
    fireEvent.click(screen.getByText('My team'))
    expect(screen.getByText('My team list')).toBeTruthy()
    expect(screen.queryByText('My performance cards')).toBeNull()
  })

  it('explains the page to someone who is not on a staff yet', () => {
    useMyWorkMock.mockReturnValue({ records: [], isLoading: false })
    renderPage()

    expect(screen.getByText("You're not on a company's staff yet")).toBeTruthy()
  })
})
