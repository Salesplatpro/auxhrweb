import useSWR from 'swr'

import { fetchJobSummary, jobSummaryKey } from '../services/applicationService'

export const useJobSummary = (jobId?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    jobId ? jobSummaryKey(jobId) : null,
    () => fetchJobSummary(jobId!),
  )

  return { summary: data, error, isLoading, mutate }
}
