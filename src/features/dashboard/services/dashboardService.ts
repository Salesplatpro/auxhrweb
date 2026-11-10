import { httpClient } from '@/features/auth/services/httpClient'

import {
  DashboardApplicantsPage,
  RecruiterDashboardSummary,
  RecruiterNavCounts,
  SummaryChart,
  SummaryRange,
} from '../types'

export const RECRUITER_COUNTS_ENDPOINT = '/recruiter/dashboard/counts'
export const RECRUITER_SUMMARY_ENDPOINT = '/recruiter/dashboard/summary'
export const RECRUITER_APPLICANTS_ENDPOINT = '/recruiter/dashboard/applicants'

export const recruiterCountsKey = (organizationId: string) =>
  [RECRUITER_COUNTS_ENDPOINT, organizationId] as const

export const fetchRecruiterCounts = () =>
  httpClient
    .get<{ data: RecruiterNavCounts }>(RECRUITER_COUNTS_ENDPOINT)
    .then((response) => response.data.data)

export const recruiterSummaryKey = (
  organizationId: string,
  range: SummaryRange,
  chart: SummaryChart,
) => [RECRUITER_SUMMARY_ENDPOINT, organizationId, range, chart] as const

export const fetchRecruiterSummary = (
  range: SummaryRange,
  chart: SummaryChart,
) =>
  httpClient
    .get<{ data: RecruiterDashboardSummary }>(RECRUITER_SUMMARY_ENDPOINT, {
      params: { range, chart },
    })
    .then((response) => response.data.data)

export const recruiterApplicantsKey = (
  organizationId: string,
  limit: number,
  offset: number,
) => [RECRUITER_APPLICANTS_ENDPOINT, organizationId, limit, offset] as const

export const fetchRecruiterApplicants = (limit: number, offset: number) =>
  httpClient
    .get<{ data: DashboardApplicantsPage }>(RECRUITER_APPLICANTS_ENDPOINT, {
      params: { limit, offset },
    })
    .then((response) => response.data.data)
