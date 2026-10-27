import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import {
  JobDetailsJob,
  JobDetailsView,
} from '@/components/features/jobs/JobDetailsView'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import PersonalityTest from '@/pages/TalentProfile/TalentAssessment/PersonalityTest'
import PersonalizedTest from '@/pages/TalentProfile/TalentAssessment/PersonalizedTest'
import {
  useApplyToJobMutation,
  useIndividualJobQuery,
  useJobApplicationQuery,
  useLazyCheckPrescreeningStageQuery,
  usePersonalityTestQuery,
  usePersonalizedTestQuery,
} from '@/redux/api/talent'
import { notify } from '@/utils/toastNotifications'

import { ApplicationSuccessModal } from './ApplicationSuccessModal'
import {
  type PipelineStepId,
  buildPipelineCrumbs,
  canVisitStep,
  firstRemainingStep,
  isStageComplete,
  orderedStageKeys,
  TALENT_OWNED_STAGES,
} from './jobPipeline'
import styles from './JobWorkspace.module.scss'

type ApplicationRecord = {
  id?: string
  currentStage?: string
  stages?: Record<string, string> | null
  personalizedScore?: number | null
  mbtiType?: string | null
  talent?: { prescreeningScore?: number | null }
  personalityAnswers?: Array<{ question: string; answer: string }>
  personalizedAnswers?: Array<{ question: string; answer: string }>
}

type SavedQuestion = {
  id: string
  question: string
  answer?: string | null
}

const successStorageKey = (jobId: string) => `application-success:${jobId}`

const parseStep = (value: string | null): PipelineStepId | null => {
  if (
    value === 'details' ||
    value === 'personality' ||
    value === 'personalized' ||
    value === 'cv_similarity'
  ) {
    return value
  }
  return null
}

const toSavedQuestions = (
  items?: Array<{ question: string; answer: string }> | null,
  fallback?: SavedQuestion[],
): SavedQuestion[] | undefined => {
  if (items?.some((item) => (item.answer ?? '').trim().length > 0)) {
    return items.map((item, index) => ({
      id: `saved-${index}`,
      question: item.question,
      answer: item.answer,
    }))
  }
  return fallback
}

const StageReview = ({
  title,
  meta,
  questions,
}: {
  title: string
  meta?: string
  questions?: SavedQuestion[]
}) => (
  <div className={styles.stagePanel}>
    <h2 className={styles.stageTitle}>{title}</h2>
    {meta ? <p className={styles.stageMeta}>{meta}</p> : null}
    {questions && questions.length > 0 && (
      <ul className={styles.qaList}>
        {questions.map((item, index) => (
          <li key={item.id} className={styles.qaItem}>
            <p className={styles.qaQuestion}>
              {index + 1}. {item.question}
            </p>
            <p className={styles.qaAnswer}>
              {item.answer?.trim() || 'No answer saved'}
            </p>
          </li>
        ))}
      </ul>
    )}
  </div>
)

const IndividualJob = () => {
  const { jobId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const talentId = useAuthStore((state) => state.user)?.id
  const [showSuccess, setShowSuccess] = useState(false)
  const {
    data,
    error,
    isLoading,
    refetch: refetchJob,
  } = useIndividualJobQuery(jobId)
  const job: JobDetailsJob | undefined = data?.data?.job
  const applicationId = job?.applicationId ?? undefined
  const { data: applicationResp, refetch: refetchApplication } =
    useJobApplicationQuery(applicationId, {
      skip: !applicationId,
      refetchOnMountOrArgChange: true,
    })
  const application = (applicationResp?.data?.application ??
    null) as ApplicationRecord | null

  const currentStage =
    application?.currentStage ?? job?.applicationStage ?? null
  const stages = application?.stages ?? job?.applicationStages ?? null
  const crumbs = useMemo(() => buildPipelineCrumbs(stages), [stages])
  const isComplete = currentStage === 'completed'
  const hasApplication = !!applicationId || !!currentStage

  const requestedStep = parseStep(searchParams.get('step'))
  const resolvedStep: PipelineStepId = (() => {
    if (!hasApplication) return 'details'
    if (
      requestedStep &&
      canVisitStep({ step: requestedStep, currentStage, stages })
    ) {
      return requestedStep
    }
    return firstRemainingStep(currentStage, stages)
  })()

  const [applyToJob, { isLoading: applying }] = useApplyToJobMutation()
  const [triggerPrescreeningCheck] = useLazyCheckPrescreeningStageQuery()
  const prescreeningTriggeredFor = useRef<string | null>(null)

  const personalityDone = isStageComplete('personality', currentStage, stages)
  const personalizedDone = isStageComplete('personalized', currentStage, stages)

  const { data: personalityData } = usePersonalityTestQuery(jobId, {
    skip: !jobId || resolvedStep !== 'personality',
  })
  const { data: personalizedData } = usePersonalizedTestQuery(
    { jobId, talentId },
    {
      skip: !jobId || !talentId || resolvedStep !== 'personalized',
    },
  )

  const personalityQuestions = toSavedQuestions(
    application?.personalityAnswers,
    personalityData?.data?.questions as SavedQuestion[] | undefined,
  )
  const personalizedQuestions = toSavedQuestions(
    application?.personalizedAnswers,
    (personalizedData?.data?.questions ??
      personalizedData?.data?.application?.questions) as
      | SavedQuestion[]
      | undefined,
  )

  const showPersonalityReview =
    personalityDone ||
    !!personalityQuestions?.some(
      (item) => (item.answer ?? '').trim().length > 0,
    )
  const showPersonalizedReview =
    personalizedDone ||
    !!personalizedQuestions?.some(
      (item) => (item.answer ?? '').trim().length > 0,
    )

  useEffect(() => {
    if (error) {
      notify('error', 'Error loading job post', { autoClose: 2000 })
    }
  }, [error])

  useEffect(() => {
    if (!applicationId || !jobId) return
    if (
      currentStage === 'prescreening' &&
      prescreeningTriggeredFor.current !== applicationId
    ) {
      prescreeningTriggeredFor.current = applicationId
      triggerPrescreeningCheck(jobId)
    }
  }, [applicationId, currentStage, jobId, triggerPrescreeningCheck])

  const setStep = (step: PipelineStepId) => {
    setSearchParams(step === 'details' ? {} : { step }, { replace: true })
  }

  const talentWorkDone = (
    stage: string | null | undefined,
    stageMap: Record<string, string> | null | undefined,
  ) =>
    orderedStageKeys(stageMap)
      .filter((id) => TALENT_OWNED_STAGES.includes(id))
      .every((id) => isStageComplete(id, stage, stageMap))

  const maybeShowSuccess = (
    stage: string | null | undefined,
    stageMap: Record<string, string> | null | undefined,
  ) => {
    if (!jobId || !talentWorkDone(stage, stageMap)) return
    try {
      const key = successStorageKey(jobId)
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
      setShowSuccess(true)
    } catch {
      setShowSuccess(true)
    }
  }

  const handleApply = async () => {
    if (isComplete || applying || !jobId) return
    try {
      const result = await applyToJob(jobId).unwrap()
      const nextApplication = result?.data?.application as
        | ApplicationRecord
        | undefined
      await refetchJob()
      await refetchApplication()
      const next = firstRemainingStep(
        nextApplication?.currentStage,
        nextApplication?.stages ?? stages,
      )
      setStep(next)
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        'Failed to apply for this job'
      notify('error', message, { autoClose: 2000 })
    }
  }

  const handleStageComplete = async () => {
    const [, appResult] = await Promise.all([
      refetchJob(),
      refetchApplication(),
    ])
    const nextApplication = (appResult.data?.data?.application ??
      application) as ApplicationRecord | null
    const next = firstRemainingStep(
      nextApplication?.currentStage ?? currentStage,
      nextApplication?.stages ?? stages,
    )
    setStep(next)
    maybeShowSuccess(
      nextApplication?.currentStage ?? currentStage,
      nextApplication?.stages ?? stages,
    )
  }

  if (isLoading) return <Spinner fullPage />
  if (!job || !jobId) return null

  const applyAction = isComplete ? (
    <Button fullWidth variant="secondary" disabled>
      Applied ✓
    </Button>
  ) : hasApplication ? null : (
    <Button
      fullWidth
      onClick={handleApply}
      loading={applying}
      data-tour="apply-job">
      Apply for this position
    </Button>
  )

  return (
    <PageShell>
      {hasApplication && (
        <nav className={styles.crumbs} aria-label="Application stages">
          {crumbs.map((crumb, index) => {
            const enabled = canVisitStep({
              step: crumb.id,
              currentStage,
              stages,
            })
            const isCurrent = crumb.id === resolvedStep
            return (
              <React.Fragment key={crumb.id}>
                {index > 0 ? (
                  <span className={styles.crumbSep} aria-hidden>
                    /
                  </span>
                ) : null}
                <button
                  type="button"
                  className={`${styles.crumb} ${
                    isCurrent
                      ? styles.crumbCurrent
                      : enabled
                      ? styles.crumbDone
                      : ''
                  }`}
                  disabled={!enabled}
                  onClick={() => enabled && setStep(crumb.id)}>
                  {crumb.label}
                </button>
              </React.Fragment>
            )
          })}
        </nav>
      )}

      {resolvedStep === 'details' && (
        <JobDetailsView
          jobId={jobId}
          job={job}
          audience="talent"
          action={applyAction}
        />
      )}

      {resolvedStep === 'personality' &&
        (showPersonalityReview ? (
          <StageReview
            title="Personality"
            meta={
              application?.mbtiType
                ? `Result: ${application.mbtiType}`
                : 'Your submitted answers are saved below.'
            }
            questions={personalityQuestions}
          />
        ) : (
          <PersonalityTest
            jobId={jobId}
            onComplete={() => void handleStageComplete()}
          />
        ))}

      {resolvedStep === 'personalized' &&
        talentId &&
        (showPersonalizedReview ? (
          <StageReview
            title="Role assessment"
            meta="Your submitted answers are saved below."
            questions={personalizedQuestions}
          />
        ) : (
          <PersonalizedTest
            jobId={jobId}
            talentId={talentId}
            onComplete={() => void handleStageComplete()}
          />
        ))}

      <ApplicationSuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </PageShell>
  )
}

export default IndividualJob
