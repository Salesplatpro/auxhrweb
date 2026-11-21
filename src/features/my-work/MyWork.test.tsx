import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MyWork } from './MyWork'

const { useMyWorkMock, downloadMock, notifyMock, payState } = vi.hoisted(
  () => ({
    notifyMock: vi.fn(),
    useMyWorkMock: vi.fn(),
    downloadMock: vi.fn(),
    payState: {
      value: {
        isLoading: false,
        hasError: false,
        pay: { currentPackageId: null, packages: [], grants: [] } as unknown,
      },
    },
  }),
)

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useMyWork: useMyWorkMock,
  useMyPay: () => payState.value,
}))

const noPay = {
  isLoading: false,
  hasError: false,
  pay: { currentPackageId: null, packages: [], grants: [] },
}

const pkg = {
  id: 'p-1',
  currency: 'NGN',
  period: 'monthly',
  baseSalary: 420000,
  bonus: 600000,
  commissionTarget: 0,
  totalYearly: 5640000,
  startsOn: '2026-12-01',
  commissionPlanId: null,
  benefits: [
    { id: 'b-1', name: 'Health cover (HMO)' },
    { id: 'b-2', name: 'Pension 10%' },
  ],
  paragraph: 'Your pay is set by HR.',
  createdAt: '2026-11-01T00:00:00Z',
}

const withPay = {
  isLoading: false,
  hasError: false,
  pay: {
    currentPackageId: 'p-1',
    packages: [pkg],
    grants: [
      {
        id: 'g-1',
        shares: 10000,
        grantedOn: '2020-01-01',
        cliffMonths: 12,
        vestingMonths: 48,
        strikePrice: 50,
        currency: 'NGN',
      },
    ],
  },
}

vi.mock('@/features/people/services/peopleService', () => ({
  MY_WORK_KEY: '/my-work',
  downloadMySignedDocument: downloadMock,
}))

vi.mock('./PendingInvites', () => ({ PendingInvites: () => null }))

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
    payState.value = noPay
  })

  it('shows the welcome card, documents to sign and first-week tasks', () => {
    useMyWorkMock.mockReturnValue({ records: [record], isLoading: false })
    renderPage()

    expect(screen.getByText(/Welcome to Acme Ltd, /)).toBeTruthy()
    expect(
      screen.getByText(/Here.s everything for your first weeks/),
    ).toBeTruthy()
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

  it('shows how much of the first week is done', () => {
    useMyWorkMock.mockReturnValue({
      records: [
        {
          ...record,
          tasks: [
            ...record.tasks,
            {
              id: 't-2',
              title: 'Meet your team',
              dueOn: null,
              doneAt: '2026-01-05',
            },
          ],
        },
      ],
      isLoading: false,
    })
    renderPage()

    expect(screen.getByText('1 of 2 done')).toBeTruthy()
    expect(screen.getByText('50%')).toBeTruthy()
  })

  it('shows no percentage when there are no first-week tasks', () => {
    useMyWorkMock.mockReturnValue({
      records: [{ ...record, tasks: [] }],
      isLoading: false,
    })
    renderPage()

    expect(screen.getByText('No tasks yet.')).toBeTruthy()
    expect(screen.queryByText(/%$/)).toBeNull()
  })

  it('sums a monthly package into a yearly total and opens Pay & shares from the overview', () => {
    payState.value = withPay
    useMyWorkMock.mockReturnValue({ records: [record], isLoading: false })
    renderPage()

    expect(screen.getByText('NGN 5,640,000')).toBeTruthy()
    expect(screen.getByText('10,000 of 10,000 yours')).toBeTruthy()

    fireEvent.click(screen.getByText('See pay & shares'))

    expect(screen.getByText('Current pay')).toBeTruthy()
    expect(screen.getByText('Health cover (HMO)')).toBeTruthy()
    expect(screen.getByText('not on a plan')).toBeTruthy()
    expect(screen.getByText('My share options')).toBeTruthy()
  })

  it('shows the yearly total worked out by the server', () => {
    payState.value = {
      ...withPay,
      pay: {
        ...withPay.pay,
        packages: [
          {
            ...pkg,
            period: 'yearly',
            baseSalary: 6000000,
            bonus: 0,
            totalYearly: 6000000,
          },
        ],
        grants: [],
      },
    }
    useMyWorkMock.mockReturnValue({ records: [record], isLoading: false })
    renderPage()

    expect(screen.getByText('NGN 6,000,000')).toBeTruthy()
  })

  it('explains an empty Pay & shares tab and a failed load', () => {
    useMyWorkMock.mockReturnValue({ records: [record], isLoading: false })
    const first = renderPage()
    expect(screen.queryByText('See pay & shares')).toBeNull()
    fireEvent.click(screen.getByText('Pay & shares'))
    expect(screen.getByText("Your pay hasn't been set up yet.")).toBeTruthy()
    first.unmount()

    payState.value = { isLoading: false, hasError: true, pay: null }
    renderPage()
    fireEvent.click(screen.getByText('Pay & shares'))
    expect(
      screen.getByText(
        "Couldn't load your pay. Refresh the page to try again.",
      ),
    ).toBeTruthy()
  })
})
