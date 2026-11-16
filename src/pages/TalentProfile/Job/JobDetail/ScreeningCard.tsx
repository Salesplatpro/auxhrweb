import React from 'react'

import { STEP_ICON } from '@/features/talent-applications/stepIcons'
import { STEP_TITLE } from '@/features/talent-applications/steps'
import { ScreeningPlanStep } from '@/features/talent-applications/types'

import styles from './TalentJobDetail.module.scss'

export const ScreeningCard = ({ steps }: { steps: ScreeningPlanStep[] }) => (
  <section className={styles.card}>
    <h2 className={styles.cardTitle}>How you&apos;ll be screened</h2>
    <ul className={styles.screening}>
      {steps.map((step) => (
        <li key={step.key} className={styles.screeningItem}>
          <span className={styles.screeningIcon} aria-hidden>
            {STEP_ICON[step.key]}
          </span>
          {STEP_TITLE[step.key]} · {step.minutes} min
        </li>
      ))}
    </ul>
  </section>
)
