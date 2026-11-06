import useSWRMutation from 'swr/mutation'

import { useProfile } from '@/features/profile/hooks/useProfile'

import {
  createOrganization,
  MY_ORGANIZATIONS_ENDPOINT,
} from '../services/organizationService'
import { CreateOrganizationPayload } from '../types'
import { useMyOrganizations } from './useMyOrganizations'

export const useCreateOrganization = () => {
  const { mutate: mutateProfile } = useProfile()
  const { mutate: mutateOrganizations } = useMyOrganizations()

  const { trigger, isMutating } = useSWRMutation(
    MY_ORGANIZATIONS_ENDPOINT,
    (_key, { arg }: { arg: CreateOrganizationPayload }) =>
      createOrganization(arg),
  )

  const create = async (payload: CreateOrganizationPayload) => {
    const response = await trigger(payload)
    await Promise.all([mutateOrganizations(), mutateProfile()])
    return response.data.organization
  }

  return { createOrganization: create, isCreating: isMutating }
}
