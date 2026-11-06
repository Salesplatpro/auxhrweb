import { useState } from 'react'
import useSWRMutation from 'swr/mutation'

import { AUTH_ENDPOINTS } from '@/services/api/endpoints'
import { getErrorCode, getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { loginRequest } from '../services/authService'
import { useAuthStore } from '../store/useAuthStore'
import { LoginFormValues, LoginRequest } from '../types'

export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password'

const isInvalidCredentials = (err: unknown) =>
  getErrorCode(err) === 'AUTHORIZATION_ERROR' &&
  getErrorMessage(err, '') === INVALID_CREDENTIALS_MESSAGE

export const useLogin = () => {
  const [invalidCredentials, setInvalidCredentials] = useState(false)
  const setSubmitting = useAuthStore((state) => state.setSubmitting)
  const setError = useAuthStore((state) => state.setError)
  const setSession = useAuthStore((state) => state.setSession)
  const isSubmitting = useAuthStore((state) => state.isSubmitting)

  const { trigger, isMutating } = useSWRMutation(
    AUTH_ENDPOINTS.LOGIN,
    (_key, { arg }: { arg: LoginRequest }) => loginRequest(arg),
  )

  const submitLogin = async (values: LoginFormValues) => {
    const { remember, ...credentials } = values
    setError(null)
    setInvalidCredentials(false)
    setSubmitting(true)
    try {
      const { data } = await trigger(credentials)
      setSession(data.data, { persist: remember })
      notify('success', 'Logged in successfully', { autoClose: 2000 })
      return data
    } catch (err) {
      setInvalidCredentials(isInvalidCredentials(err))
      setError(getErrorMessage(err, 'An error occurred while logging in'))
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const clearError = () => {
    setError(null)
    setInvalidCredentials(false)
  }

  return {
    submitLogin,
    clearError,
    invalidCredentials,
    isLoading: isSubmitting || isMutating,
  }
}
