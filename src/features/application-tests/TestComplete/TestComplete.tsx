import React from 'react'
import { HiCheck } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import {
  applicationPath,
  STEP_TITLE,
  stepActionPath,
} from '@/features/talent-applications/steps'
import { PipelineStep } from '@/features/talent-applications/types'

import styles from './TestComplete.module.scss'

type TestCompleteProps = {
  applicationId: string
  companyName: string
  testLabel: string
  answered: number
  next: PipelineStep | null
}

export const TestComplete = ({
  applicationId,
  companyName,
  testLabel,
  answered,
  next,
}: TestCompleteProps) => {
  const navigate = useNavigate()
  const nextPath = next ? stepActionPath(applicationId, next) : null
  const nextTitle = next ? STEP_TITLE[next.key] : null

  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.check} aria-hidden>
          <HiCheck />
        </span>
        <h1 className={styles.title}>
          Thanks. Your answers were sent to {companyName}.
        </h1>
        <p className={styles.text}>
          {testLabel} complete · {answered} of {answered} answered.
          {nextTitle && ` Your next step is the ${nextTitle.toLowerCase()}.`}
        </p>
      </div>
      <div className={styles.actions}>
        <Button
          variant="outline"
          size="lg"
          className={styles.action}
          onClick={() => navigate(applicationPath(applicationId))}>
          Back to my application
        </Button>
        {nextPath && nextTitle && (
          <Button
            variant="brand"
            size="lg"
            pill
            className={styles.action}
            onClick={() => navigate(nextPath)}>
            Start {nextTitle.toLowerCase()}
          </Button>
        )}
      </div>
    </section>
  )
}
