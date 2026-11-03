import useSWRInfinite from 'swr/infinite'

import {
  fetchNotifications,
  NOTIFICATIONS_PAGE_SIZE,
  notificationsKey,
} from '../services/notificationService'

export const useNotificationPages = () => {
  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(
      (page: number) => [notificationsKey, page * NOTIFICATIONS_PAGE_SIZE],
      ([, offset]) => fetchNotifications(offset as number),
    )

  const lastPage = data?.[data.length - 1]?.data.notifications

  return {
    notifications: data?.flatMap((page) => page.data.notifications) ?? [],
    error,
    isLoading,
    isLoadingMore: isValidating && !!data && size > data.length,
    hasMore: lastPage?.length === NOTIFICATIONS_PAGE_SIZE,
    loadMore: () => setSize(size + 1),
    mutate,
  }
}
