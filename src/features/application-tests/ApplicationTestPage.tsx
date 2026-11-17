import React, { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { applicationPath } from '@/features/talent-applications/steps'
import { AssessmentStatus } from '@/pages/TalentProfile/TalentAssessment/AssessmentForm'
import { useApplicationPipelineQuery } from '@/redux/api/talent'
import { getErrorMessage } from '@/utils/getErrorMessage'

import { ChoiceTest } from './ChoiceTest'
import { isTestKind, TEST_KINDS } from './kinds'
import { draftKey } from './store'
import { TestComplete } from './TestComplete/TestComplete'
import { TestShell } from './TestShell/TestShell'
import { TextTest } from './TextTest'

const ApplicationTestPage = () => {
  const { applicationId = '', kind } = useParams<{
    applicationId: string
    kind: string
  }>()
  const userId = useAuthStore((state) => state.user)?.id ?? ''
  const {
    data: pipeline,
    error,
    isLoading,
    refetch,
  } = useApplicationPipelineQuery(applicationId)
  const [answered, setAnswered] = useState<number | null>(null)

  if (!isTestKind(kind))
    return <Navigate to={applicationPath(applicationId)} replace />
  const config = TEST_KINDS[kind]

  if (isLoading) return <Spinner fullPage />
  if (error || !pipeline) {
    return (
      <TestShell>
        <AssessmentStatus
          error
          message={getErrorMessage(error, 'We couldn’t load your application.')}
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </TestShell>
    )
  }

  const { job } = pipeline.application
  const companyName = job.organization?.name ?? 'the company'
  const shell = (children: React.ReactNode) => (
    <TestShell
      title={`${config.label} · ${job.title}`}
      organization={job.organization}>
      {children}
    </TestShell>
  )

  if (answered !== null) {
    return shell(
      <TestComplete
        applicationId={applicationId}
        companyName={companyName}
        testLabel={config.label}
        answered={answered}
        next={pipeline.nextStep?.key === config.step ? null : pipeline.nextStep}
      />,
    )
  }

  const step = pipeline.steps.find((item) => item.key === config.step)
  if (!step || step.state !== 'current') {
    return <Navigate to={applicationPath(applicationId)} replace />
  }

  const props = {
    jobId: pipeline.application.jobId,
    config,
    context: `${job.title} · ${companyName}`,
    draftKey: draftKey(userId, applicationId, kind),
    onFinished: setAnswered,
  }
  return shell(
    kind === 'problem-solving' || kind === 'culture-fit' ? (
      <ChoiceTest {...props} kind={kind} />
    ) : (
      <TextTest {...props} kind={kind} />
    ),
  )
}

export default ApplicationTestPage
