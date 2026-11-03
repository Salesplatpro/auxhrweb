import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { NotificationPanel } from './NotificationPanel'

const { markAsReadFn, markAllAsReadFn } = vi.hoisted(() => ({
  markAsReadFn: vi.fn(),
  markAllAsReadFn: vi.fn(),
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
    ],
    unReadCount: 1,
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
    follow: vi.fn(),
    needsSwitch: false,
    isSwitching: false,
    confirmSwitch: vi.fn(),
    cancelSwitch: vi.fn(),
  }),
}))

describe('NotificationPanel', () => {
  it('lists notifications and marks all as read', () => {
    render(
      <MemoryRouter>
        <NotificationPanel viewAllTo="/talentDashboard/notification" />
      </MemoryRouter>,
    )

    expect(screen.getByText('New message')).toBeTruthy()
    expect(screen.getByText('Unread (1)')).toBeTruthy()
    fireEvent.click(screen.getByText('Mark all as read'))
    expect(markAllAsReadFn).toHaveBeenCalled()
  })
})
