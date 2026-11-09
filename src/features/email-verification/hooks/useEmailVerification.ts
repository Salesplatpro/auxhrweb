import useSWRMutation from 'swr/mutation'

import {
  changeEmailRequest,
  resendVerificationRequest,
  verifyEmailRequest,
} from '@/features/auth/services/authService'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { ChangeEmailRequest, VerifyEmailRequest } from '@/features/auth/types'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { AUTH_ENDPOINTS } from '@/services/api/endpoints'
import { getErrorMessage } from '@/utils/getErrorMessage'

export const useEmailVerification = () => {
  const { mutate } = useProfile()
  const setSession = useAuthStore((state) => state.setSession)

  const verifyToken = useSWRMutation(
    AUTH_ENDPOINTS.VERIFY_EMAIL,
    (_key, { arg }: { arg: VerifyEmailRequest }) => verifyEmailRequest(arg),
  )
  const resend = useSWRMutation(
    AUTH_ENDPOINTS.RESEND_VERIFICATION,
    (_key, { arg }: { arg?: { redirectPath?: string } }) =>
      resendVerificationRequest(arg?.redirectPath),
  )
  const changeEmail = useSWRMutation(
    AUTH_ENDPOINTS.CHANGE_EMAIL,
    (_key, { arg }: { arg: ChangeEmailRequest }) => changeEmailRequest(arg),
  )

  const submitVerifyToken = async (token: string) => {
    try {
      const { data } = await verifyToken.trigger({ token })
      const refreshed = await mutate()
      return { ...data?.data, profile: refreshed?.data?.user }
    } catch (err) {
      throw new Error(
        getErrorMessage(err, 'Verification link is invalid or has expired.'),
      )
    }
  }

  const submitResend = async (redirectPath?: string) => {
    try {
      const { data } = await resend.trigger({ redirectPath })
      return data
    } catch (err) {
      throw new Error(
        getErrorMessage(err, 'Failed to resend verification email.'),
      )
    }
  }

  const submitChangeEmail = async (payload: ChangeEmailRequest) => {
    try {
      const { data } = await changeEmail.trigger(payload)
      setSession(data.data)
      await mutate()
      return data
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Failed to change email.'))
    }
  }

  return {
    submitVerifyToken,
    submitResend,
    submitChangeEmail,
    isVerifying: verifyToken.isMutating,
    isResending: resend.isMutating,
    isChangingEmail: changeEmail.isMutating,
  }
}
