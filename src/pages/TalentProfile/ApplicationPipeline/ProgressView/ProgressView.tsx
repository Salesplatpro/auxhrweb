import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { PageShell } from '@/components/layout/PageShell'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import {
  HIDDEN_TALENT_STAGES,
  talentFacingStage,
} from '@/pages/TalentProfile/Job/jobPipeline'
import { AllJobTypes } from '@/utils/types'

import resultIcon from '../../../../assets/CheckIcon.svg'
import personalizedIcon from '../../../../assets/personalizedIcon.webp'
import {
  useAllJobApplicationsQuery,
  useJobApplicationQuery,
  useLazyCheckPrescreeningStageQuery,
} from '../../../../redux/api/talent'
import { notify } from '../../../../utils/toastNotifications'
import { ErrorResponse } from '../../utils/type'
import { Application, Progress } from '../../utils/type'
import ProgressError from './ProgressError'
import ProgressHeader from './ProgressHeader'
import ProgressItem from './ProgressItem'
import ProgressSkeleton from './ProgressSkeleton'
import styles from './ProgressView.module.scss'

type StageKey = keyof Application['stages']

export const getProgresses = (application: Application): Progress[] => {
  const stagesMapping = {
    personalized: { icon: personalizedIcon, title: 'Personalized Test' },
    personality: { icon: personalizedIcon, title: 'Personality Test' },
  }

  const stages = (application.stages ?? {}) as Record<StageKey, string>
  const stageKeys = Object.keys(stages) as StageKey[]
  const values = new Set(Object.values(stages))
  const entryStage = stageKeys.find((key) => !values.has(key))

  const orderedStages: StageKey[] = []
  let cursor = entryStage
  const visited = new Set<string>()
  while (cursor && (cursor as string) !== 'completed' && !visited.has(cursor)) {
    visited.add(cursor)
    orderedStages.push(cursor)
    cursor = stages[cursor] as StageKey
  }

  const progresses: Progress[] = []
  const currentStage = application.currentStage
  let currentStageFound = false

  orderedStages.forEach((stage) => {
    if (HIDDEN_TALENT_STAGES.has(stage)) {
      if (stage === currentStage) currentStageFound = true
      return
    }

    let status
    if (stage === currentStage) {
      status = 'current'
      currentStageFound = true
    } else if (!currentStageFound) {
      status = 'completed'
    } else {
      status = 'awaiting'
    }

    const mapping = (
      stagesMapping as Record<string, { icon: string; title: string }>
    )[stage]
    if (mapping) {
      let result: string | null = null
      if (
        stage === 'personality' &&
        status === 'completed' &&
        application.mbtiType
      ) {
        result = application.mbtiType
      }

      progresses.push({
        icon: mapping.icon,
        title: mapping.title,
        status: status,
        result,
      })
    }
  })

  if (talentFacingStage(currentStage, application.stages) === 'completed') {
    const resultStatus =
      application.status === 'shortlisted' || application.status === 'rejected'
        ? application.status
        : 'awaiting-decision'
    progresses.push({
      icon: resultIcon,
      title: 'Result',
      status: resultStatus,
    })
  }

  return progresses
}

const ProgressView: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>()
  const [jobProgress, setJobProgress] = useState<Application | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const prescreeningTriggeredFor = useRef<string | null>(null)

  const {
    data: applicationsData,
    error: applicationsError,
    isLoading: applicationsLoading,
  } = useAllJobApplicationsQuery({ limit: 200 })
  const applicationId = (
    applicationsData?.data?.applications as AllJobTypes[] | undefined
  )?.find((application) => application.job?.id === jobId)?.id

  const {
    data: applicationResp,
    error: applicationError,
    isLoading: applicationLoading,
    isFetching: applicationFetching,
    refetch,
  } = useJobApplicationQuery(applicationId, {
    skip: !applicationId,
    refetchOnMountOrArgChange: true,
  })

  const [
    triggerPrescreeningCheck,
    {
      data: prescreeningCheckData,
      error: prescreeningCheckError,
      isLoading: prescreeningCheckLoading,
    },
  ] = useLazyCheckPrescreeningStageQuery()

  useEffect(() => {
    if (applicationResp) {
      const applicationData = applicationResp.data?.application || null
      setJobProgress(applicationData)

      if (
        applicationData?.currentStage === 'prescreening' &&
        applicationId &&
        prescreeningTriggeredFor.current !== applicationId
      ) {
        prescreeningTriggeredFor.current = applicationId
        triggerPrescreeningCheck(jobId)
      }
    }
    if (applicationError) {
      handleError(applicationError, 'Failed to load application progress')
    }
  }, [
    applicationResp,
    applicationError,
    applicationId,
    jobId,
    triggerPrescreeningCheck,
  ])

  useEffect(() => {
    if (prescreeningCheckData) {
      void refetch()
    }

    if (prescreeningCheckError) {
      handleError(
        prescreeningCheckError,
        'Failed to check Pre-Assessment status',
      )
    }
  }, [prescreeningCheckData, prescreeningCheckError, refetch])

  const handleError = (error: any, defaultMessage: string) => {
    const errorMessage =
      (error?.data as ErrorResponse)?.message || defaultMessage

    notify('error', errorMessage, {
      autoClose: 2000,
    })

    console.error('Error:', error)
  }

  const applicationsReady = !applicationsLoading && !!applicationsData

  if (
    applicationsLoading ||
    (applicationId && applicationLoading && !jobProgress)
  ) {
    return <ProgressSkeleton />
  }

  if (applicationsReady && !applicationId) {
    return (
      <div className={styles.page}>
        <BackButton />
        <ProgressError error={applicationsError || applicationError} />
      </div>
    )
  }

  if (!jobProgress) {
    return (
      <div className={styles.page}>
        <BackButton />
        <ProgressError error={applicationError || applicationsError} />
      </div>
    )
  }

  const progresses = getProgresses(jobProgress)
  const isAdvancingStage =
    prescreeningCheckLoading || (applicationFetching && !applicationLoading)

  const homePage = () => {
    if (location.key !== 'default') {
      navigate(-1)
    }
  }

  const completedStatuses = ['completed', 'shortlisted', 'rejected']
  const completedStages = progresses.filter((progress) =>
    completedStatuses.includes(progress.status),
  ).length
  const totalStages = Math.max(progresses.length, 1)
  const progressPercentage = Math.round((completedStages / totalStages) * 100)

  return (
    <PageShell>
      <BackButton />
      <ProgressHeader
        progressPercentage={progressPercentage}
        jobProgress={jobProgress}
      />

      {isAdvancingStage && (
        <p className={styles.headerSubtitle}>Updating your progress…</p>
      )}

      <div className={styles.itemList}>
        {progresses.map((progress, i) => (
          <ProgressItem
            key={i}
            progress={progress}
            jobId={jobId}
            isLast={i === progresses.length - 1}
          />
        ))}
      </div>

      <div className={styles.footer}>
        <Button onClick={homePage}>Back to Homepage</Button>
      </div>
    </PageShell>
  )
}

export default ProgressView
