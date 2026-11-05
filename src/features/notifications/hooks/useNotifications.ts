import useSWR from 'swr'

import {
  fetchNotifications,
  notificationsKey,
} from '../services/notificationService'

const REFRESH_INTERVAL_MS = 60_000

export const useNotifications = () => {
  const { data, error, isLoading, mutate } = useSWR(
    notificationsKey,
    () => fetchNotifications(),
    { refreshInterval: REFRESH_INTERVAL_MS },
  )

  return {
    notifications: data?.data.notifications ?? [],
    unReadCount: data?.data.unReadCount ?? 0,
    error,
    isLoading,
    mutate,
  }
}
