import cn from 'classnames'
import React from 'react'
import { LuCheck } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'

import { actionLabel, stepDescription } from '../stepCopy'
import { STEP_TITLE, stepActionPath, TEST_KIND_BY_STEP } from '../steps'
import { PipelineStep } from '../types'
import styles from './PipelineSteps.module.scss'

type PipelineStepsProps = {
  applicationId: string
  company: string
  steps: PipelineStep[]
}

export const PipelineSteps = ({
  applicationId,
  company,
  steps,
}: PipelineStepsProps) => {
  const navigate = useNavigate()
  return (
    <ol className={styles.steps} aria-label="Application steps">
      {steps.map((step) => {
        const path = stepActionPath(applicationId, step)
        const label = actionLabel(step)
        const showAction =
          !!label &&
          (step.state === 'current'
            ? !!path
            : step.state === 'upcoming' && !!TEST_KIND_BY_STEP[step.key])
        return (
          <li
            key={step.key}
            className={cn(styles.step, styles[step.state])}
            aria-current={step.state === 'current' ? 'step' : undefined}>
            <span className={styles.marker} aria-hidden>
              {step.state === 'done' && <LuCheck />}
            </span>
            <div className={styles.body}>
              <span className={styles.text}>
                <span className={styles.title}>{STEP_TITLE[step.key]}</span>
                <span className={styles.description}>
                  {stepDescription(step, company)}
                </span>
              </span>
              {showAction && (
                <Button
                  variant={step.state === 'current' ? 'gradient' : 'outline'}
                  disabled={step.state !== 'current'}
                  className={styles.action}
                  onClick={() => path && navigate(path)}>
                  {label}
                </Button>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
