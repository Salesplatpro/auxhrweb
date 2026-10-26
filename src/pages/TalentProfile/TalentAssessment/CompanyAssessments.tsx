import React from 'react'

import CompanyAssessmentTest from './CompanyAssessmentTest'

export type CompanyAssessmentsApplication = {
  id?: string
  problemSolvingSubmitted?: boolean
  cultureFitSubmitted?: boolean
} | null

/**
 * Job page section for the problem-solving and culture-fit tests (plan Day 5).
 * They aren't application stages: they appear once the candidate has applied,
 * and each one renders nothing unless the company switched it on for the job.
 */
const CompanyAssessments = ({
  jobId,
  application,
}: {
  jobId: string
  application: CompanyAssessmentsApplication
}) => {
  if (!application?.id) return null
  return (
    <>
      <CompanyAssessmentTest
        jobId={jobId}
        type="problem-solving"
        submitted={!!application.problemSolvingSubmitted}
      />
      <CompanyAssessmentTest
        jobId={jobId}
        type="culture-fit"
        submitted={!!application.cultureFitSubmitted}
      />
    </>
  )
}

export default CompanyAssessments
