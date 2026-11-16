import React from 'react'
import { HiCheck, HiOutlineClock } from 'react-icons/hi2'
import { useNavigate, useParams } from 'react-router-dom'

import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { dayMonth } from '@/features/talent-applications/format'
import { STEP_ICON } from '@/features/talent-applications/stepIcons'
import {
  applicationPath,
  STEP_TITLE,
  stepActionPath,
} from '@/features/talent-applications/steps'
import { PipelineStep } from '@/features/talent-applications/types'
import { useApplicationPipelineQuery } from '@/redux/api/talent'

import styles from './ApplicationSent.module.scss'

const DAY_MS = 24 * 60 * 60 * 1000

const LATER_NAME: Partial<Record<PipelineStep['key'], string>> = {
  cv_match: 'CV match',
  tailored: 'tests',
  problem_solving: 'tests',
  culture_fit: 'tests',
  personality: 'tests',
  ai_interview: 'interview',
}

const joinWords = (words: string[]) =>
  words.length > 1
    ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`
    : words[0] ?? ''

const ApplicationSent = () => {
  const { applicationId = '' } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const { data: pipeline, isLoading } =
    useApplicationPipelineQuery(applicationId)

  if (isLoading || !pipeline) return <Spinner fullPage />

  const { application, nextStep, steps } = pipeline
  const company = application.job.organization?.name ?? 'the company'
  const action = nextStep ? stepActionPath(applicationId, nextStep) : null
  const nextTitle = nextStep ? STEP_TITLE[nextStep.key].toLowerCase() : null
  const daysLeft =
    nextStep?.dueAt &&
    Math.round(
      (new Date(nextStep.dueAt).getTime() -
        new Date(application.appliedAt).getTime()) /
        DAY_MS,
    )
  const later = joinWords([
    ...new Set(
      steps
        .slice(steps.findIndex((step) => step === nextStep) + 1)
        .map((step) => LATER_NAME[step.key])
        .filter((name): name is string => !!name),
    ),
  ])

  return (
    <PageShell wide>
      <section className={styles.card}>
        <span className={styles.check} aria-hidden>
          <HiCheck />
        </span>
        <h1 className={styles.title}>Application sent to {company}</h1>
        {nextStep && nextTitle && (
          <p className={styles.lead}>
            Next step:{' '}
            {nextStep.minutes ? `a ${nextStep.minutes}-minute ` : 'the '}
            {nextTitle} for {application.job.title}.
            {action && daysLeft
              ? ` You can take it now or within ${daysLeft} days.`
              : ''}
          </p>
        )}
        <ul className={styles.timeline}>
          <li className={styles.done}>
            <HiCheck aria-hidden />
            Applied · {dayMonth(application.appliedAt)}
          </li>
          {nextStep && nextTitle && (
            <li className={styles.next}>
              {STEP_ICON[nextStep.key]}
              {STEP_TITLE[nextStep.key]}
              {nextStep.dueAt && ` · due ${dayMonth(nextStep.dueAt)}`}
            </li>
          )}
          {later && (
            <li>
              <HiOutlineClock aria-hidden />
              Then {later}
            </li>
          )}
        </ul>
        <div className={styles.actions}>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(applicationPath(applicationId))}>
            View application
          </Button>
          {action && nextTitle && (
            <Button
              variant="gradient"
              size="lg"
              onClick={() => navigate(action)}>
              Take {nextTitle} now
            </Button>
          )}
        </div>
      </section>
    </PageShell>
  )
}

export default ApplicationSent
