import useSWR from 'swr'

import {
  fetchAccessLog,
  fetchBenefits,
  fetchChecklist,
  fetchChecklistDefaults,
  fetchCommissionPlans,
  fetchCompanyProfile,
  fetchHeadcountCost,
  fetchMyPay,
  fetchMyWork,
  fetchPay,
  fetchStaffActivity,
  fetchStaffDocuments,
  fetchStaffList,
  fetchStaffMember,
  fetchStaffOptions,
  MY_WORK_KEY,
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

export const staffPayKey = (organizationId: string, staffId: string) =>
  `${staffBase(organizationId)}/${staffId}/pay`

export const benefitsKey = (organizationId: string) =>
  `${staffBase(organizationId)}/benefits`

export const commissionPlansKey = (organizationId: string) =>
  `${staffBase(organizationId)}/commission-plans`

export const staffDocumentsKey = (organizationId: string, staffId: string) =>
  `${staffBase(organizationId)}/${staffId}/documents`

export const checklistKey = (organizationId: string, staffId: string) =>
  `${staffBase(organizationId)}/${staffId}/checklist`

export const checklistDefaultsKey = (organizationId: string) =>
  `${staffBase(organizationId)}/checklist-defaults`

export const companyProfileKey = (organizationId: string) =>
  `${staffBase(organizationId)}/company-profile`

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

export const usePay = (organizationId: string | null, staffId: string) => {
  const { data, error, isLoading } = useSWR(
    organizationId ? staffPayKey(organizationId, staffId) : null,
    () => (organizationId ? fetchPay(organizationId, staffId) : null),
    VIEW_LOGGED_OPTIONS,
  )

  return { pay: data ?? null, isLoading, hasError: !!error }
}

export const useBenefits = (organizationId: string | null) => {
  const { data, error, isLoading } = useSWR(
    organizationId ? benefitsKey(organizationId) : null,
    () => (organizationId ? fetchBenefits(organizationId) : null),
  )

  return {
    benefits: data ?? [],
    isLoading,
    hasError: !!error,
    isForbidden: isForbidden(error),
  }
}

export const useCommissionPlans = (organizationId: string | null) => {
  const { data, error, isLoading } = useSWR(
    organizationId ? commissionPlansKey(organizationId) : null,
    () => (organizationId ? fetchCommissionPlans(organizationId) : null),
  )

  return { plans: data ?? [], isLoading, hasError: !!error }
}

export const useHeadcountCost = (organizationId: string | null) => {
  const { data, error, isLoading } = useSWR(
    organizationId ? `${staffBase(organizationId)}/headcount-cost` : null,
    () => (organizationId ? fetchHeadcountCost(organizationId) : null),
    VIEW_LOGGED_OPTIONS,
  )

  return { cost: data ?? null, isLoading, hasError: !!error }
}

export const useStaffDocuments = (
  organizationId: string | null,
  staffId: string,
) => {
  const { data, error, isLoading } = useSWR(
    organizationId ? staffDocumentsKey(organizationId, staffId) : null,
    () =>
      organizationId ? fetchStaffDocuments(organizationId, staffId) : null,
    VIEW_LOGGED_OPTIONS,
  )

  return { documents: data ?? [], isLoading, hasError: !!error }
}

export const useChecklist = (
  organizationId: string | null,
  staffId: string,
) => {
  const { data, error, isLoading } = useSWR(
    organizationId ? checklistKey(organizationId, staffId) : null,
    () => (organizationId ? fetchChecklist(organizationId, staffId) : null),
  )

  return { tasks: data ?? [], isLoading, hasError: !!error }
}

export const useChecklistDefaults = (
  organizationId: string | null,
  enabled: boolean,
) => {
  const { data, isLoading } = useSWR(
    organizationId && enabled ? checklistDefaultsKey(organizationId) : null,
    () => (organizationId ? fetchChecklistDefaults(organizationId) : null),
  )

  return { items: data ?? null, isLoading }
}

export const useCompanyProfile = (organizationId: string | null) => {
  const { data, error, isLoading } = useSWR(
    organizationId ? companyProfileKey(organizationId) : null,
    () => (organizationId ? fetchCompanyProfile(organizationId) : null),
  )

  return { profile: data ?? null, isLoading, hasError: !!error }
}

export const useMyWork = () => {
  const { data, error, isLoading } = useSWR(MY_WORK_KEY, fetchMyWork, {
    shouldRetryOnError: false,
  })

  return { records: data ?? [], isLoading, hasError: !!error }
}

export const useMyPay = (staffId: string | null) => {
  const { data, error, isLoading } = useSWR(
    staffId ? `${MY_WORK_KEY}/${staffId}/pay` : null,
    () => (staffId ? fetchMyPay(staffId) : null),
    VIEW_LOGGED_OPTIONS,
  )

  return { pay: data ?? null, isLoading, hasError: !!error }
}
