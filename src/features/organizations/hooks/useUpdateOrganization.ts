import useSWRMutation from 'swr/mutation'

import { useProfile } from '@/features/profile/hooks/useProfile'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import {
  MY_ORGANIZATIONS_ENDPOINT,
  updateOrganization,
} from '../services/organizationService'
import { UpdateOrganizationPayload } from '../types'
import { useMyOrganizations } from './useMyOrganizations'

interface UpdateArg {
  organizationId: string
  payload: UpdateOrganizationPayload
}

export const useUpdateOrganization = () => {
  const { mutate: mutateProfile } = useProfile()
  const { mutate: mutateOrganizations } = useMyOrganizations()

  const { trigger, isMutating } = useSWRMutation(
    `${MY_ORGANIZATIONS_ENDPOINT}/update`,
    (_key, { arg }: { arg: UpdateArg }) =>
      updateOrganization(arg.organizationId, arg.payload),
  )

  const update = async (
    organizationId: string,
    payload: UpdateOrganizationPayload,
    success: { title: string; description?: string } = {
      title: 'Company updated',
    },
  ) => {
    try {
      const response = await trigger({ organizationId, payload })
      // The edited company may be the active one, so the banner needs refreshing too.
      await Promise.all([mutateOrganizations(), mutateProfile()])
      notify('success', success.title, {
        autoClose: 2000,
        description: success.description,
      })
      return response.data.organization
    } catch (error) {
      notify('error', getErrorMessage(error, 'Failed to update company'))
      return null
    }
  }

  return { updateOrganization: update, isUpdating: isMutating }
}
