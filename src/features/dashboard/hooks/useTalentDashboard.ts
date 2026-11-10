import useSWR from 'swr'

import { useAuthStore } from '@/features/auth/store/useAuthStore'

import {
  fetchTalentDashboard,
  talentDashboardKey,
} from '../services/dashboardService'

export const useTalentDashboard = () => {
  const userId = useAuthStore((state) => state.user?.id)
  const { data, error, isLoading, mutate } = useSWR(
    userId ? talentDashboardKey(userId) : null,
    fetchTalentDashboard,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  return { dashboard: data, error, isLoading, retry: () => void mutate() }
}
