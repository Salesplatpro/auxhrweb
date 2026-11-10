import { httpClient } from '@/features/auth/services/httpClient'

import { RecruiterNavCounts } from '../types'

export const RECRUITER_COUNTS_ENDPOINT = '/recruiter/dashboard/counts'

export const recruiterCountsKey = (organizationId: string) =>
  [RECRUITER_COUNTS_ENDPOINT, organizationId] as const

export const fetchRecruiterCounts = () =>
  httpClient
    .get<{ data: RecruiterNavCounts }>(RECRUITER_COUNTS_ENDPOINT)
    .then((response) => response.data.data)
