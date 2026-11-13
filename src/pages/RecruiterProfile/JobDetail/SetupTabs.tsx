import React from 'react'
import { LuPencil } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'

import type { JobDetailsJob } from '@/components/features/jobs/JobDetailsView'
import { PagePanel, StatCard, StatGrid } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useGetAiConfigQuery } from '@/redux/api/recruiter'
import type { JobSummary } from '@/utils/recruiterJobPostsTypes'

import { JobStatusControl } from '../EditJob/JobStatusControl'
import {
  AiConfigApiRecord,
  aiConfigFromApi,
} from '../PostJobs/AiConfig/aiConfigPayload'
import { CandidateJourney } from '../PostJobs/AiConfig/CandidateJourney'
import styles from './JobDetail.module.scss'

type SetupTabProps = {
  jobId: string
  job: JobDetailsJob
}

const aiConfigIdOf = (job: JobDetailsJob) =>
  job.aiConfigId ?? job.aiConfig?.id ?? ''

const useJobAiConfig = (job: JobDetailsJob) => {
  const aiConfigId = aiConfigIdOf(job)
  const { data, isLoading } = useGetAiConfigQuery(aiConfigId, {
    skip: !aiConfigId,
  })
  const config = data?.data?.aiConfig as AiConfigApiRecord | undefined
  return { config, isLoading }
}

const EditButton = ({ jobId, label }: { jobId: string; label: string }) => {
  const navigate = useNavigate()
  return (
    <Button
      variant="outline"
      size="sm"
      icon={<LuPencil size={14} />}
      onClick={() => navigate(`/recruiterDashboard/editJob/${jobId}`)}>
      {label}
    </Button>
  )
}

const percent = (value?: number | null) => (value == null ? '—' : `${value}%`)

export const PreScreeningTab = ({
  jobId,
  job,
  summary,
}: SetupTabProps & { summary?: JobSummary }) => {
  const { config, isLoading } = useJobAiConfig(job)
  if (isLoading) return <Spinner />

  return (
    <div className={styles.tabBody}>
      <PagePanel
        title="Pre-screening"
        hint="The bar candidates must clear before anyone reviews them"
        action={<EditButton jobId={jobId} label="Edit" />}>
        <div className={styles.stack}>
          <StatGrid columns={4}>
            <StatCard
              label="Skills test pass mark"
              value={
                config?.prescreeningAssessment
                  ? percent(config.minPrescreeningScore ?? 0)
                  : 'Off'
              }
            />
            <StatCard
              label="CV match pass mark"
              value={
                config?.cvSimilarity
                  ? percent(config.minCvSimilarityScore ?? 0)
                  : 'Off'
              }
            />
            <StatCard
              label="Pre-screened"
              value={String(summary?.passRate.preScreened ?? 0)}
            />
            <StatCard
              label="Pass rate"
              value={percent(summary?.passRate.value)}
            />
          </StatGrid>
        </div>
      </PagePanel>
    </div>
  )
}

export const AiConfigurationTab = ({ jobId, job }: SetupTabProps) => {
  const { config, isLoading } = useJobAiConfig(job)
  if (isLoading) return <Spinner />

  return (
    <div className={styles.tabBody}>
      {config ? (
        <CandidateJourney values={aiConfigFromApi(config)} />
      ) : (
        <p className={styles.muted}>This job has no AI screening set up yet.</p>
      )}
      <div className={styles.actionsRow}>
        <EditButton jobId={jobId} label="Edit AI configuration" />
      </div>
    </div>
  )
}

export const SettingsTab = ({ jobId, job }: SetupTabProps) => (
  <div className={styles.tabBody}>
    <JobStatusControl
      jobId={jobId}
      status={job.status ?? 'draft'}
      aiConfigId={aiConfigIdOf(job) || null}
    />
    <div className={styles.actionsRow}>
      <EditButton jobId={jobId} label="Edit job details" />
    </div>
  </div>
)
