import useSWR from 'swr'

import {
  checksKey,
  consentKey,
  readApplicationChecks,
  readCheckConsent,
} from './checkService'

export const useBackgroundChecks = (applicationId: string) => {
  const consent = useSWR(
    consentKey(applicationId),
    () => readCheckConsent(applicationId),
    { shouldRetryOnError: false },
  )
  const checks = useSWR(
    checksKey(applicationId),
    () => readApplicationChecks(applicationId),
    { shouldRetryOnError: false },
  )

  return {
    consent: consent.data,
    checks: checks.data,
    error: consent.error ?? checks.error,
    mutateChecks: checks.mutate,
  }
}
