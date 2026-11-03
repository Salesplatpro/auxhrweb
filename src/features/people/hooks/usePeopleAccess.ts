import useSWR from 'swr'

import { useProfile } from '@/features/profile/hooks/useProfile'

import { fetchPeopleAccess, staffBase } from '../services/peopleService'

const peopleAccessKey = (organizationId: string) =>
  `${staffBase(organizationId)}/access`

export const usePeopleAccess = () => {
  const { profile, isLoading: isProfileLoading } = useProfile()
  const organizationId = profile?.activeOrganizationId ?? null

  const { data, isLoading } = useSWR(
    organizationId ? peopleAccessKey(organizationId) : null,
    () => (organizationId ? fetchPeopleAccess(organizationId) : null),
  )

  const canManagePeople = data?.canManagePeople ?? false
  const assignedCount = data?.assignedCount ?? 0

  return {
    organizationId,
    isLoading: isProfileLoading || isLoading,
    isOwner: data?.isOwner ?? false,
    canManagePeople,
    assignedCount,
    hasPeopleAccess: canManagePeople || assignedCount > 0,
  }
}
