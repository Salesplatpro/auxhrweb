import useSWR from 'swr'

import { fetchStaffInvitePreview } from '@/features/people/services/peopleService'
import { StaffInvitePreview } from '@/features/people/types'

export type PendingInvite = Extract<StaffInvitePreview, { status: 'pending' }>

export const useJoinStaffInvite = (token: string | undefined) => {
  const { data, error, isLoading } = useSWR(
    token ? `/staff-invites/${token}` : null,
    () => (token ? fetchStaffInvitePreview(token) : null),
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  )

  return {
    invite: data ?? null,
    isLoading,
    isInvalid: !!error,
  }
}
