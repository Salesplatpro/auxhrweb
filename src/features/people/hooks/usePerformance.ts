import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'

import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import {
  fetchMyPerformance,
  fetchMyTeam,
  fetchOrgChart,
  fetchPerformance,
  fetchQuarterlyReview,
  myPerformanceKey,
  orgChartKey,
  quarterlyReviewKey,
} from '../services/peopleService'

/** Each of these reads writes an access log line, so focus and reconnect don't refetch. */
const VIEW_LOGGED_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: false,
} as const

export const usePerformance = (base: string | null) => {
  const { data, error, isLoading } = useSWR(
    base,
    (key: string) => fetchPerformance(key),
    VIEW_LOGGED_OPTIONS,
  )
  return { performance: data ?? null, isLoading, hasError: !!error }
}

export const useMyPerformance = (staffId: string) => {
  const { data, error, isLoading } = useSWR(
    myPerformanceKey(staffId),
    () => fetchMyPerformance(staffId),
    VIEW_LOGGED_OPTIONS,
  )
  return { performance: data ?? null, isLoading, hasError: !!error }
}

export const useMyTeam = (managerStaffId: string) => {
  const { data, error, isLoading } = useSWR(
    `/my-work/${managerStaffId}/team`,
    () => fetchMyTeam(managerStaffId),
    VIEW_LOGGED_OPTIONS,
  )
  return { team: data ?? null, isLoading, hasError: !!error }
}

export const useOrgChart = (organizationId: string | null) => {
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? orgChartKey(organizationId) : null,
    () => (organizationId ? fetchOrgChart(organizationId) : null),
  )
  return { chart: data ?? null, isLoading, hasError: !!error, reload: mutate }
}

export const useQuarterlyReview = (
  organizationId: string | null,
  quarter: string,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? quarterlyReviewKey(organizationId, quarter) : null,
    () =>
      organizationId ? fetchQuarterlyReview(organizationId, quarter) : null,
    VIEW_LOGGED_OPTIONS,
  )
  return { review: data ?? null, isLoading, hasError: !!error, mutate }
}

const statusOf = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status

/**
 * Runs a change and keeps the screen honest when it fails. A 409 means the data moved on,
 * and a network failure or AI timeout may still have saved on the server, so either way
 * the screen reloads instead of showing what it had.
 */
export const usePerformanceChange = <T>(cacheKey: string) => {
  const { mutate } = useSWRConfig()
  const [pending, setPending] = useState<string | null>(null)

  const updateCache = (change: (current: T) => T) =>
    mutate<T>(cacheKey, (current) => (current ? change(current) : current), {
      revalidate: false,
    })

  const run = async <R>(
    name: string,
    action: () => Promise<R>,
    failure: string,
  ): Promise<R | null> => {
    setPending(name)
    try {
      return await action()
    } catch (error) {
      notify('error', getErrorMessage(error, failure))
      const status = statusOf(error)
      if (status === undefined || status === 409 || status >= 500) {
        await mutate(cacheKey)
      }
      return null
    } finally {
      setPending(null)
    }
  }

  return { run, updateCache, pending }
}
