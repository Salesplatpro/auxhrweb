import { useCallback } from 'react'
import { useSWRConfig } from 'swr'

import {
  jobApplicationsKey,
  jobSummaryKey,
} from '../services/applicationService'

/** Refreshes every applicant list and the numbers of one job after a decision. */
export const useRevalidateJob = (jobId?: string) => {
  const { mutate } = useSWRConfig()
  return useCallback(async () => {
    if (!jobId) return
    await Promise.all([
      mutate(
        (key) => Array.isArray(key) && key[0] === jobApplicationsKey(jobId),
      ),
      mutate(jobSummaryKey(jobId)),
    ])
  }, [jobId, mutate])
}
