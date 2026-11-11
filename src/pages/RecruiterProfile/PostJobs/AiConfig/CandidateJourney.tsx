import cn from 'classnames'
import React from 'react'

import { Pill } from '@/components/ui/Pill'

import styles from './AiConfig.module.scss'
import { AiConfigFieldValues } from './aiConfigModel'
import { candidateJourney } from './journeyStages'
import { NEW_SCREENING_STEPS, ScreeningStepKey } from './screeningSteps'

const TITLE = 'What candidates will go through'

export const CandidateJourney = ({
  values,
}: {
  values: AiConfigFieldValues
}) => {
  const { stages, totalMinutes } = candidateJourney(values)

  return (
    <section className={styles.sideCard} aria-label={TITLE}>
      <h2 className={styles.sideTitle}>{TITLE}</h2>
      <p className={styles.sideHint}>In this order, after they apply</p>
      <ol className={styles.journeyList}>
        {stages.map((stage, index) => {
          const isNew = NEW_SCREENING_STEPS.includes(
            stage.key as ScreeningStepKey,
          )
          return (
            <li
              key={stage.key}
              className={cn(styles.journeyStage, isNew && styles.journeyNew)}>
              <span className={styles.journeyStep} aria-hidden>
                {index + 1}
              </span>
              <span className={styles.journeyStageTitle}>
                {stage.title}
                {isNew && (
                  <Pill tone="success" size="sm">
                    New
                  </Pill>
                )}
              </span>
              <span className={styles.journeyTime}>{stage.timeLabel}</span>
            </li>
          )
        })}
      </ol>
      <div className={styles.journeyTotal}>
        <span>Total time for candidates</span>
        <span>About {totalMinutes} min</span>
      </div>
    </section>
  )
}
