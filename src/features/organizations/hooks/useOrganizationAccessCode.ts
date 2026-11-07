import { useRef, useState } from 'react'
import useSWR from 'swr'

import { getErrorMessage, getErrorStatus } from '@/utils/getErrorMessage'

import {
  accessCodeEndpoint,
  disableOrganizationAccessCode,
  fetchOrganizationAccessCode,
  rotateOrganizationAccessCode,
} from '../services/organizationService'

export const useOrganizationAccessCode = (organizationId: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    accessCodeEndpoint(organizationId),
    () =>
      fetchOrganizationAccessCode(organizationId).then((res) => res.data.code),
  )
  const [isWorking, setIsWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const act = async (task: () => Promise<string | null>, fallback: string) => {
    if (inFlight.current) return
    inFlight.current = true
    setIsWorking(true)
    setActionError(null)
    try {
      const code = await task()
      await mutate(code, { revalidate: false })
    } catch (err) {
      setActionError(getErrorMessage(err, fallback))
    } finally {
      inFlight.current = false
      setIsWorking(false)
    }
  }

  const rotate = () =>
    act(
      () =>
        rotateOrganizationAccessCode(organizationId).then(
          (res) => res.data.code,
        ),
      'We could not create a code. Try again.',
    )

  const disable = () =>
    act(
      () => disableOrganizationAccessCode(organizationId).then(() => null),
      'We could not turn the code off. Try again.',
    )

  return {
    code: data ?? null,
    isLoading,
    loadError: error,
    isUnavailable: getErrorStatus(error) === 404,
    actionError,
    isWorking,
    rotate,
    disable,
    retry: () => void mutate(),
  }
}
