import {
  fireEvent,
  render as renderInDom,
  screen,
  waitFor,
} from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import NotificationsList from './NotificationsList'

const {
  useNotificationsMock,
  useMarkNotificationReadMock,
  markAsReadFn,
  navigateMock,
  switchOrganizationMock,
} = vi.hoisted(() => ({
  useNotificationsMock: vi.fn(),
  useMarkNotificationReadMock: vi.fn(),
  markAsReadFn: vi.fn(),
  navigateMock: vi.fn(),
  switchOrganizationMock: vi.fn(),
}))

vi.mock('@/features/notifications/hooks/useNotificationPages', () => ({
  useNotificationPages: useNotificationsMock,
}))
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigateMock,
}))
vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: { activeOrganizationId: 'org-1' } }),
}))
vi.mock('@/features/organizations/hooks/useSwitchOrganization', () => ({
  useSwitchOrganization: () => ({
    switchOrganization: switchOrganizationMock,
    isSwitching: false,
  }),
}))
vi.mock('@/features/notifications/hooks/useMarkNotificationRead', () => ({
  useMarkNotificationRead: useMarkNotificationReadMock,
}))

const render = (ui: React.ReactElement) =>
  renderInDom(<MemoryRouter>{ui}</MemoryRouter>)

const withLink = (organizationId: string | null) => ({
  id: 'n1',
  userId: 'u1',
  title: 'New high match',
  message: 'Ada Obi is a high match for Account Executive.',
  link: '/recruiterDashboard/singleJobPost/j1?applicationId=a1',
  organizationId,
  isRead: true,
  deleted: false,
  createdAt: new Date().toISOString(),
})

describe('NotificationsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the applicant when the notification belongs to the active company', async () => {
    useNotificationsMock.mockReturnValue({
      isLoading: false,
      mutate: vi.fn(),
      notifications: [withLink('org-1')],
    })
    useMarkNotificationReadMock.mockReturnValue({ markAsRead: markAsReadFn })

    render(<NotificationsList />)
    fireEvent.click(screen.getByText('New high match'))

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/recruiterDashboard/singleJobPost/j1?applicationId=a1',
      ),
    )
    expect(switchOrganizationMock).not.toHaveBeenCalled()
  })

  it('asks before switching company, then opens the applicant', async () => {
    switchOrganizationMock.mockResolvedValue(true)
    useNotificationsMock.mockReturnValue({
      isLoading: false,
      mutate: vi.fn(),
      notifications: [withLink('org-2')],
    })
    useMarkNotificationReadMock.mockReturnValue({ markAsRead: markAsReadFn })

    render(<NotificationsList />)
    fireEvent.click(screen.getByText('New high match'))

    expect(await screen.findByText('Switch company to open this?')).toBeTruthy()
    expect(navigateMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Switch company' }))

    await waitFor(() =>
      expect(switchOrganizationMock).toHaveBeenCalledWith('org-2'),
    )
    await waitFor(() => expect(navigateMock).toHaveBeenCalled())
  })

  it('stays put when switching company fails', async () => {
    switchOrganizationMock.mockResolvedValue(false)
    useNotificationsMock.mockReturnValue({
      isLoading: false,
      mutate: vi.fn(),
      notifications: [withLink('org-2')],
    })
    useMarkNotificationReadMock.mockReturnValue({ markAsRead: markAsReadFn })

    render(<NotificationsList />)
    fireEvent.click(screen.getByText('New high match'))
    fireEvent.click(
      await screen.findByRole('button', { name: 'Switch company' }),
    )

    await waitFor(() => expect(switchOrganizationMock).toHaveBeenCalled())
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('offers more when there are older notifications', () => {
    const loadMore = vi.fn()
    useNotificationsMock.mockReturnValue({
      isLoading: false,
      mutate: vi.fn(),
      hasMore: true,
      loadMore,
      notifications: [withLink(null)],
    })
    useMarkNotificationReadMock.mockReturnValue({ markAsRead: markAsReadFn })

    render(<NotificationsList />)
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))

    expect(loadMore).toHaveBeenCalled()
  })

  it('shows an empty state when there are no notifications', () => {
    useNotificationsMock.mockReturnValue({
      notifications: [],
      isLoading: false,
      mutate: vi.fn(),
    })
    useMarkNotificationReadMock.mockReturnValue({ markAsRead: markAsReadFn })

    render(<NotificationsList />)

    expect(screen.getByText(/do not have any notifications/i)).toBeTruthy()
  })

  it('renders each notification message read-only, with no acknowledge/reject actions', () => {
    useNotificationsMock.mockReturnValue({
      isLoading: false,
      mutate: vi.fn(),
      notifications: [
        {
          id: 'n1',
          userId: 'talent-1',
          message: "Congratulations, you've been shortlisted!",
          isRead: false,
          deleted: false,
          createdAt: new Date().toISOString(),
        },
      ],
    })
    useMarkNotificationReadMock.mockReturnValue({ markAsRead: markAsReadFn })

    render(<NotificationsList />)

    expect(screen.getByText(/shortlisted/)).toBeTruthy()
    expect(screen.queryByText('Acknowledge')).toBeNull()
    expect(screen.queryByText('Reject')).toBeNull()
  })

  it('renders a concise title prominently above the longer message body', () => {
    useNotificationsMock.mockReturnValue({
      isLoading: false,
      mutate: vi.fn(),
      notifications: [
        {
          id: 'n1',
          userId: 'talent-1',
          title: 'Shortlisted for Backend Developer',
          message:
            "Great news! You've been shortlisted for Backend Developer. Watch your inbox — the recruiter will be in touch soon.",
          isRead: false,
          deleted: false,
          createdAt: new Date().toISOString(),
        },
      ],
    })
    useMarkNotificationReadMock.mockReturnValue({ markAsRead: markAsReadFn })

    render(<NotificationsList />)

    expect(screen.getByText('Shortlisted for Backend Developer')).toBeTruthy()
  })

  it('renders decision notifications as title-only, with no duplicate message line', () => {
    useNotificationsMock.mockReturnValue({
      isLoading: false,
      mutate: vi.fn(),
      notifications: [
        {
          id: 'n1',
          userId: 'talent-1',
          title:
            "Congratulations, you've been shortlisted for Backend Developer at TechCorp",
          message:
            "Congratulations, you've been shortlisted for Backend Developer at TechCorp",
          isRead: false,
          deleted: false,
          createdAt: new Date().toISOString(),
        },
      ],
    })
    useMarkNotificationReadMock.mockReturnValue({ markAsRead: markAsReadFn })

    render(<NotificationsList />)

    expect(
      screen.getAllByText(
        "Congratulations, you've been shortlisted for Backend Developer at TechCorp",
      ),
    ).toHaveLength(1)
  })

  it('marks an unread notification as read when clicked', () => {
    const mutate = vi.fn()
    useNotificationsMock.mockReturnValue({
      isLoading: false,
      mutate,
      notifications: [
        {
          id: 'n1',
          userId: 'talent-1',
          message: 'Your dream job is still out there.',
          isRead: false,
          deleted: false,
          createdAt: new Date().toISOString(),
        },
      ],
    })
    useMarkNotificationReadMock.mockReturnValue({ markAsRead: markAsReadFn })

    render(<NotificationsList />)
    fireEvent.click(screen.getByText(/dream job/))

    expect(markAsReadFn).toHaveBeenCalledWith('n1')
  })
})
