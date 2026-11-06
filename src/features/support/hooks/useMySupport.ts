import useSWR from 'swr'

import { fetchMySupport } from '../services/supportService'

export const MY_SUPPORT_KEY = '/feedback/mine'

/** The signed-in user's conversation. It refreshes on focus so a new reply shows up. */
export const useMySupport = () => {
  const { data, error, isLoading, mutate } = useSWR(
    MY_SUPPORT_KEY,
    fetchMySupport,
    { revalidateOnFocus: true },
  )
  return { requests: data, error, isLoading, retry: () => mutate(), mutate }
}
