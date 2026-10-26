import { useState } from 'react'
import { useSWRConfig } from 'swr'

import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { updateMemberCanManagePeople } from '../services/organizationService'
import { OrganizationMember } from '../types'
import { organizationMembersKey } from './useOrganizationMembers'

export const useSetMemberCanManagePeople = (organizationId: string) => {
  const { mutate } = useSWRConfig()
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null)

  const withFlag = (
    members: OrganizationMember[] | undefined,
    memberId: string,
    canManagePeople: boolean,
  ) =>
    (members ?? []).map((member) =>
      member.id === memberId ? { ...member, canManagePeople } : member,
    )

  const setCanManagePeople = async (
    member: OrganizationMember,
    canManagePeople: boolean,
  ) => {
    setPendingMemberId(member.id)
    try {
      await mutate<OrganizationMember[]>(
        organizationMembersKey(organizationId),
        async (current) => {
          await updateMemberCanManagePeople(
            organizationId,
            member.id,
            canManagePeople,
          )
          return withFlag(current, member.id, canManagePeople)
        },
        {
          optimisticData: (current) =>
            withFlag(current, member.id, canManagePeople),
          rollbackOnError: true,
          revalidate: false,
        },
      )
      const name = `${member.user.firstName} ${member.user.lastName}`.trim()
      notify(
        'success',
        canManagePeople
          ? `${name} can now manage people`
          : `${name} can no longer manage people`,
      )
      return true
    } catch (error) {
      notify('error', getErrorMessage(error, 'Could not update access'))
      return false
    } finally {
      setPendingMemberId(null)
    }
  }

  return { setCanManagePeople, pendingMemberId }
}
