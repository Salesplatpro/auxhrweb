import useSWR from 'swr'

import { useProfile } from '@/features/profile/hooks/useProfile'

import {
  fetchRecruiterApplicants,
  fetchRecruiterSummary,
  recruiterApplicantsKey,
  recruiterSummaryKey,
} from '../services/dashboardService'
import { SummaryChart, SummaryRange } from '../types'

export const APPLICANTS_PAGE_SIZE = 7

const OPTIONS = { shouldRetryOnError: false }

export const useRecruiterDashboardSummary = (
  range: SummaryRange,
  chart: SummaryChart,
) => {
  const { profile } = useProfile()
  const organizationId = profile?.activeOrganizationId ?? null
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? recruiterSummaryKey(organizationId, range, chart) : null,
    () => fetchRecruiterSummary(range, chart),
    OPTIONS,
  )

  return { summary: data, error, isLoading, retry: () => void mutate() }
}

export const useRecruiterApplicants = (page: number) => {
  const { profile } = useProfile()
  const organizationId = profile?.activeOrganizationId ?? null
  const offset = page * APPLICANTS_PAGE_SIZE
  const { data, error, isLoading, mutate } = useSWR(
    organizationId
      ? recruiterApplicantsKey(organizationId, APPLICANTS_PAGE_SIZE, offset)
      : null,
    () => fetchRecruiterApplicants(APPLICANTS_PAGE_SIZE, offset),
    OPTIONS,
  )

  return {
    applicants: data?.items ?? [],
    total: data?.total ?? 0,
    offset,
    error,
    isLoading,
    retry: () => void mutate(),
  }
}
