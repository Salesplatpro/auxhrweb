import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { PageShell } from '@/components/layout/PageShell'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import {
  initialsOf,
  jobPlace,
  workModeLabel,
} from '@/features/talent-applications/format'
import { PipelineSteps } from '@/features/talent-applications/PipelineSteps/PipelineSteps'
import { nextStepCopy } from '@/features/talent-applications/stepCopy'
import {
  applicationPath,
  STEP_TITLE,
  stepActionPath,
} from '@/features/talent-applications/steps'
import { PipelineStep } from '@/features/talent-applications/types'
import { useApplicationPipelineQuery } from '@/redux/api/talent'

import styles from './ApplicationDetail.module.scss'

const SCORE_ROWS: { key: PipelineStep['key']; label: string }[] = [
  { key: 'skills_test', label: 'Skills test' },
  { key: 'problem_solving', label: 'Problem-solving' },
  { key: 'culture_fit', label: 'Culture-fit' },
]

const scoreValue = (step: PipelineStep) => {
  if (step.state !== 'done') return 'To do'
  if (step.key === 'skills_test' && step.score !== null)
    return `${Math.round(step.score)}%`
  return 'Sent'
}

const nextButtonLabel = (step: PipelineStep) => {
  if (step.key === 'ai_interview') return 'Start interview'
  if (step.key === 'skills_test') return 'Take skills test'
  if (step.key === 'references') return 'Add referees'
  if (step.key === 'checks') return 'Review and answer'
  return `Start ${STEP_TITLE[step.key].toLowerCase()}`
}

const ApplicationDetail = () => {
  const { applicationId = '' } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const { data: pipeline, isLoading } =
    useApplicationPipelineQuery(applicationId)

  if (isLoading) return <Spinner fullPage />
  if (!pipeline) {
    return (
      <PageShell wide>
        <EmptyState
          title="Application not found"
          description="It may have been removed."
        />
      </PageShell>
    )
  }

  const { application, steps, nextStep, currentStep, totalSteps } = pipeline
  const { job } = application
  const company = job.organization?.name ?? ''
  const nextPath = nextStep ? stepActionPath(applicationId, nextStep) : null
  const scores = SCORE_ROWS.flatMap((row) => {
    const step = steps.find((item) => item.key === row.key)
    return step ? [{ ...row, value: scoreValue(step) }] : []
  })
  const references = steps.find((step) => step.key === 'references')

  return (
    <PageShell wide>
      <div className={styles.crumbs}>
        <Breadcrumb
          items={[
            {
              label: 'Applications',
              to: '/talentDashboard/applicationPipeline',
            },
            { label: [job.title, company].filter(Boolean).join(' · ') },
          ]}
        />
      </div>
      <h1 className={styles.mobileTitle}>My application</h1>
      <div className={styles.layout}>
        <section className={styles.main}>
          <header className={styles.head}>
            <span className={styles.logo} aria-hidden>
              {job.organization?.logoUrl ? (
                <img src={job.organization.logoUrl} alt="" />
              ) : (
                initialsOf(company || job.title)
              )}
            </span>
            <div className={styles.headText}>
              <h2 className={styles.title}>{job.title}</h2>
              <p className={styles.meta}>
                {[company, jobPlace(job), workModeLabel(job.workMode)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            {currentStep && (
              <span className={styles.stepBadge}>
                Step {currentStep} of {totalSteps}
              </span>
            )}
          </header>
          <PipelineSteps
            applicationId={applicationId}
            company={company}
            steps={steps}
          />
          {references && references.state === 'done' && (
            <div className={styles.referees}>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`${applicationPath(applicationId)}/references`)
                }>
                View your referees
              </Button>
            </div>
          )}
        </section>

        <aside className={styles.side}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Next step</h2>
            <p className={styles.cardText}>{nextStepCopy(pipeline)}</p>
            {nextStep && nextPath && (
              <Button
                variant="gradient"
                size="lg"
                stretch
                onClick={() => navigate(nextPath)}>
                {nextButtonLabel(nextStep)}
              </Button>
            )}
          </section>
          {scores.length > 0 && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Your scores so far</h2>
              <dl className={styles.scores}>
                {scores.map((row) => (
                  <div key={row.key} className={styles.score}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </aside>
      </div>
    </PageShell>
  )
}

export default ApplicationDetail
