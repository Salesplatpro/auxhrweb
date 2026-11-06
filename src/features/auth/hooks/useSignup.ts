import useSWRMutation from 'swr/mutation'

import { AUTH_ENDPOINTS } from '@/services/api/endpoints'
import { getErrorMessage } from '@/utils/getErrorMessage'

import { registerRecruiter, registerTalent } from '../services/authService'
import { useAuthStore } from '../store/useAuthStore'
import { TalentRegisterRequest } from '../types'

export type SignupRole = 'talent' | 'recruiter'

export type SignupRequest = TalentRegisterRequest & {
  userType: SignupRole
  remember: boolean
}

export const useSignup = () => {
  const setSubmitting = useAuthStore((state) => state.setSubmitting)
  const setError = useAuthStore((state) => state.setError)
  const setSession = useAuthStore((state) => state.setSession)
  const isSubmitting = useAuthStore((state) => state.isSubmitting)

  const { trigger, isMutating } = useSWRMutation(
    AUTH_ENDPOINTS.REGISTER_TALENT,
    (
      _key,
      { arg }: { arg: TalentRegisterRequest & { userType: SignupRole } },
    ) => {
      const { userType, ...payload } = arg
      return userType === 'recruiter'
        ? registerRecruiter(payload)
        : registerTalent(payload)
    },
  )

  const submitSignup = async ({ remember, ...values }: SignupRequest) => {
    setError(null)
    setSubmitting(true)
    try {
      const { data } = await trigger(values)
      setSession(data.data, { persist: remember })
      return data
    } catch (err) {
      setError(getErrorMessage(err, 'An error occurred while signing up'))
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const clearError = () => setError(null)

  return { submitSignup, clearError, isLoading: isSubmitting || isMutating }
}
