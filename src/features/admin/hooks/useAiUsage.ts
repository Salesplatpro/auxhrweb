import useSWR from 'swr'

import { fetchAiUsage } from '../services/adminService'
import { AiUsageRange } from '../types'

export const useAiUsage = (days: AiUsageRange) => {
  const { data, error, isLoading, mutate } = useSWR(
    `/admin/ai-usage?days=${days}`,
    () => fetchAiUsage(days),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  return { usage: data, error, isLoading, retry: () => mutate() }
}
