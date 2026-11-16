import React from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'

/** Old applicant links (notifications, chat, dashboard) open the job's Candidates tab. */
export const ApplicantsRedirect = () => {
  const { jobId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const next = new URLSearchParams({ tab: 'candidates' })
  const applicationId = searchParams.get('applicationId')
  if (applicationId) next.set('applicationId', applicationId)
  return (
    <Navigate to={`/recruiterDashboard/jobdetail/${jobId}?${next}`} replace />
  )
}
