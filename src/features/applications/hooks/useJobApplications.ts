import useSWR from 'swr'

import {
  fetchJobApplications,
  jobApplicationsKey,
  JobApplicationsQuery,
} from '../services/applicationService'

export const useJobApplications = (
  jobId?: string,
  query: JobApplicationsQuery = {},
) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    jobId ? [jobApplicationsKey(jobId), query] : null,
    () => fetchJobApplications(jobId!, query),
    { keepPreviousData: true },
  )

  return { data, error, isLoading, isValidating, mutate }
}
