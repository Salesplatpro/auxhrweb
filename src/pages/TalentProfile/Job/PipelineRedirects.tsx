import React from 'react'
import { Navigate, useParams } from 'react-router-dom'

import { Spinner } from '@/components/ui/Spinner'
import { applicationPath } from '@/features/talent-applications/steps'
import { useIndividualJobQuery } from '@/redux/api/talent'

export const RedirectJobToApplication = () => {
  const { jobId } = useParams<{ jobId: string }>()
  const { data, isLoading } = useIndividualJobQuery(jobId)
  if (isLoading) return <Spinner fullPage />
  const applicationId: string | undefined = data?.data?.job?.applicationId
  return (
    <Navigate
      to={
        applicationId
          ? applicationPath(applicationId)
          : `/talentDashboard/job/${jobId}`
      }
      replace
    />
  )
}
