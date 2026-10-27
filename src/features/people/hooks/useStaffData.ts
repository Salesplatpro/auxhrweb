import useSWR from 'swr'

import {
  fetchAccessLog,
  fetchStaffActivity,
  fetchStaffList,
  fetchStaffMember,
  fetchStaffOptions,
  staffBase,
  toQueryString,
} from '../services/peopleService'
import { AccessLogQuery, StaffListQuery } from '../types'
import { isForbidden } from '../utils/isForbidden'

const staffListKey = (organizationId: string, query: StaffListQuery) =>
  `${staffBase(organizationId)}?${toQueryString({ ...query })}`

export const staffOptionsKeyPrefix = (organizationId: string) =>
  `${staffBase(organizationId)}/options`

export const staffMemberKey = (organizationId: string, staffId: string) =>
  `${staffBase(organizationId)}/${staffId}`

export const staffActivityKey = (organizationId: string, staffId: string) =>
  `${staffBase(organizationId)}/${staffId}/activity`

const accessLogKey = (organizationId: string, query: AccessLogQuery) =>
  `${staffBase(organizationId)}/access-log?${toQueryString({ ...query })}`

export const useStaffList = (
  organizationId: string | null,
  query: StaffListQuery,
) => {
  const { data, error, isLoading } = useSWR(
    organizationId ? staffListKey(organizationId, query) : null,
    () => (organizationId ? fetchStaffList(organizationId, query) : null),
    { keepPreviousData: true },
  )

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    counts: data?.counts ?? { invited: 0, active: 0, ended: 0 },
    isLoading,
    hasError: !!error,
    isForbidden: isForbidden(error),
  }
}

/** Current staff by default (for the manager dropdown); everyone when filtering by person. */
export const useStaffOptions = (
  organizationId: string | null,
  { includeEnded = false, enabled = true } = {},
) => {
  const { data, isLoading } = useSWR(
    organizationId && enabled
      ? `${staffOptionsKeyPrefix(organizationId)}?includeEnded=${includeEnded}`
      : null,
    () =>
      organizationId ? fetchStaffOptions(organizationId, includeEnded) : null,
  )

  return { options: data ?? [], isLoading }
}

/**
 * Opening a record is written to the access log by the server, so focus and
 * reconnect revalidation are off: switching browser tabs must not count as
 * someone viewing the employee again.
 */
const VIEW_LOGGED_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
} as const

export const useStaffMember = (
  organizationId: string | null,
  staffId: string | undefined,
) => {
  const { data, error, isLoading } = useSWR(
    organizationId && staffId ? staffMemberKey(organizationId, staffId) : null,
    () =>
      organizationId && staffId
        ? fetchStaffMember(organizationId, staffId)
        : null,
    VIEW_LOGGED_OPTIONS,
  )

  return {
    staff: data ?? null,
    isLoading,
    hasError: !!error,
    isForbidden: isForbidden(error),
  }
}

export const useStaffActivity = (
  organizationId: string | null,
  staffId: string | undefined,
) => {
  const { data, error, isLoading } = useSWR(
    organizationId && staffId
      ? staffActivityKey(organizationId, staffId)
      : null,
    () =>
      organizationId && staffId
        ? fetchStaffActivity(organizationId, staffId)
        : null,
    VIEW_LOGGED_OPTIONS,
  )

  return { activities: data ?? [], isLoading, hasError: !!error }
}

export const useAccessLog = (
  organizationId: string | null,
  query: AccessLogQuery,
) => {
  const { data, error, isLoading } = useSWR(
    organizationId ? accessLogKey(organizationId, query) : null,
    () => (organizationId ? fetchAccessLog(organizationId, query) : null),
    { keepPreviousData: true },
  )

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    hasError: !!error,
  }
}
