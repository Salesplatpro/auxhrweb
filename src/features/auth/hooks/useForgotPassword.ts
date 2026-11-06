import useSWRMutation from 'swr/mutation'

import { AUTH_ENDPOINTS } from '@/services/api/endpoints'
import { getErrorMessage, getErrorStatus } from '@/utils/getErrorMessage'

import { requestPasswordReset } from '../services/authService'
import { ForgotPasswordRequest } from '../types'

export const useForgotPassword = () => {
  const requestReset = useSWRMutation(
    AUTH_ENDPOINTS.FORGOT_PASSWORD,
    (_key, { arg }: { arg: ForgotPasswordRequest }) =>
      requestPasswordReset(arg),
  )

  const submitForgotPassword = async (payload: ForgotPasswordRequest) => {
    try {
      const { data } = await requestReset.trigger(payload)
      return data
    } catch (err) {
      throw Object.assign(
        new Error(getErrorMessage(err, 'Something went wrong.')),
        { status: getErrorStatus(err) },
      )
    }
  }

  return {
    submitForgotPassword,
    isRequesting: requestReset.isMutating,
  }
}
