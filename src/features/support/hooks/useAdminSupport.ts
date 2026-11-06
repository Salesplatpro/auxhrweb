import { useEffect, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'

import { SUPPORT_INBOX_KEY } from '../constants'
import {
  fetchSupportInbox,
  fetchSupportRequest,
  fetchSupportUserContext,
} from '../services/supportService'
import { SupportInboxFilters, SupportRequestDetail } from '../types'

export const AI_DRAFT_POLL_MS = 4000
export const AI_DRAFT_POLL_LIMIT_MS = 2 * 60 * 1000

export const useSupportInbox = (filters: SupportInboxFilters) => {
  const { data, error, isLoading, mutate } = useSWR(
    [SUPPORT_INBOX_KEY, filters] as const,
    ([, query]) => fetchSupportInbox(query),
    { keepPreviousData: true },
  )
  return { inbox: data, error, isLoading, retry: () => mutate() }
}

/** Refreshes every inbox page in the cache, whatever its filters. */
export const useRefreshSupportInbox = () => {
  const { mutate } = useSWRConfig()
  return () =>
    mutate(
      (key) => Array.isArray(key) && key[0] === SUPPORT_INBOX_KEY,
      undefined,
      { revalidate: true },
    )
}

/**
 * One request with the user's history. While the AI is still drafting it polls, but only
 * for two minutes, so a stuck draft never keeps the page polling forever.
 */
export const useSupportRequest = (id: string | undefined) => {
  const [pollExpired, setPollExpired] = useState(false)

  useEffect(() => {
    setPollExpired(false)
    const timer = setTimeout(() => setPollExpired(true), AI_DRAFT_POLL_LIMIT_MS)
    return () => clearTimeout(timer)
  }, [id])

  const { data, error, isLoading, mutate } = useSWR(
    id ? `${SUPPORT_INBOX_KEY}/${id}` : null,
    () => fetchSupportRequest(id as string),
    {
      revalidateOnFocus: false,
      refreshInterval: (latest?: SupportRequestDetail) =>
        !pollExpired && latest?.request.aiDraftStatus === 'pending'
          ? AI_DRAFT_POLL_MS
          : 0,
    },
  )

  return {
    detail: data,
    error,
    isLoading,
    mutate,
    stillDrafting: pollExpired && data?.request.aiDraftStatus === 'pending',
  }
}

export const useSupportUserContext = (id: string | undefined) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${SUPPORT_INBOX_KEY}/${id}/user-context` : null,
    () => fetchSupportUserContext(id as string),
    { revalidateOnFocus: false },
  )
  return { context: data, error, isLoading, retry: () => mutate() }
}
