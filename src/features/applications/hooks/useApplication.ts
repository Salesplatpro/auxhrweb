import useSWR from 'swr'

import {
  applicationKey,
  fetchApplication,
} from '../services/applicationService'

type ApplicationEnvelope = {
  data?: {
    application?: {
      currentStage?: string
      matchVerdict?: string | null
      matchVerdictStatus?: string | null
      personalityFitPending?: boolean
    }
  }
}

export const useApplication = (applicationId?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    applicationId ? applicationKey(applicationId) : null,
    () => fetchApplication(applicationId!),
    {
      refreshInterval: (latest: ApplicationEnvelope | undefined) => {
        const application = latest?.data?.application
        if (application?.personalityFitPending) return 3000
        if (
          application?.currentStage === 'completed' &&
          !application.matchVerdict &&
          application.matchVerdictStatus === 'pending'
        ) {
          return 3000
        }
        return 0
      },
    },
  )

  return { data, error, isLoading, mutate }
}
