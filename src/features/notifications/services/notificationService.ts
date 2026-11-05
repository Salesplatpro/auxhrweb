import { httpClient } from '@/features/auth/services/httpClient'

import { AppNotification } from '../types'

export const notificationsKey = '/notifications'

export const NOTIFICATIONS_PAGE_SIZE = 50

export const fetchNotifications = (offset = 0) =>
  httpClient
    .get<{ data: { notifications: AppNotification[]; unReadCount: number } }>(
      notificationsKey,
      { params: { limit: NOTIFICATIONS_PAGE_SIZE, offset } },
    )
    .then((response) => response.data)

// The backend marks a notification read as a side effect of fetching it — no
// separate "mark as read" endpoint exists (see controllers/notification.ts).
export const readNotification = (notificationId: string) =>
  httpClient
    .get<{ data: { notification: AppNotification } }>(
      `${notificationsKey}/${notificationId}`,
    )
    .then((response) => response.data)

export const markAllNotificationsRead = () =>
  httpClient
    .patch<{ data: { updated: number } }>(`${notificationsKey}/read-all`)
    .then((response) => response.data)
