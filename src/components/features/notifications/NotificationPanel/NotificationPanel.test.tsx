import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NotificationPanel } from './NotificationPanel'

const { markAsReadFn, markAllAsReadFn, followFn } = vi.hoisted(() => ({
  markAsReadFn: vi.fn(),
  markAllAsReadFn: vi.fn(),
  followFn: vi.fn(),
}))

vi.mock('@/features/notifications/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [
      {
        id: 'n1',
        userId: 'u1',
        title: 'New message',
        message: 'You have a new message from Jane',
        isRead: false,
        deleted: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'n2',
        userId: 'u1',
        type: 'interview_invite',
        title: 'Kosana Tech Ltd invited you to a recorded interview',
        message: 'Product Designer · do it by 12 Nov',
        link: '/talentDashboard/interview/i1',
        isRead: false,
        deleted: false,
        createdAt: new Date().toISOString(),
      },
    ],
    unReadCount: 2,
    isLoading: false,
    mutate: vi.fn(),
  }),
}))

vi.mock('@/features/notifications/hooks/useMarkNotificationRead', () => ({
  useMarkNotificationRead: () => ({ markAsRead: markAsReadFn }),
}))

vi.mock('@/features/notifications/hooks/useMarkAllNotificationsRead', () => ({
  useMarkAllNotificationsRead: () => ({
    markAllAsRead: markAllAsReadFn,
    isMarkingAll: false,
  }),
}))

vi.mock('@/features/notifications/hooks/useOpenNotification', () => ({
  useOpenNotification: () => ({
    follow: followFn,
    needsSwitch: false,
    isSwitching: false,
    confirmSwitch: vi.fn(),
    cancelSwitch: vi.fn(),
  }),
}))

describe('NotificationPanel', () => {
  afterEach(cleanup)

  it('lists notifications and marks all as read', () => {
    render(
      <MemoryRouter>
        <NotificationPanel viewAllTo="/talentDashboard/notification" />
      </MemoryRouter>,
    )

    expect(screen.getByText('New message')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Unread 2' })).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'View all notifications' }),
    ).toBeTruthy()
    fireEvent.click(screen.getByText('Mark all as read'))
    expect(markAllAsReadFn).toHaveBeenCalled()
  })

  it('offers the typed action and marks the notification read before following it', async () => {
    render(
      <MemoryRouter>
        <NotificationPanel viewAllTo="/talentDashboard/notification" />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Start interview'))

    await waitFor(() => expect(followFn).toHaveBeenCalled())
    expect(markAsReadFn).toHaveBeenCalledWith('n2')
    expect(followFn.mock.calls[0]![0].link).toBe(
      '/talentDashboard/interview/i1',
    )
  })
})
