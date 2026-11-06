import cn from 'classnames'
import React from 'react'
import { LuCheck } from 'react-icons/lu'

import styles from './StepRail.module.scss'

export type StepRailStep = {
  title: string
  description: string
}

type StepRailProps = {
  steps: StepRailStep[]
  current: number
  label: string
}

export const StepRail = ({ steps, current, label }: StepRailProps) => (
  <ol className={styles.rail} aria-label={label}>
    {steps.map((step, index) => {
      const state =
        index < current ? 'done' : index === current ? 'current' : 'upcoming'
      return (
        <li
          key={step.title}
          className={cn(styles.step, styles[state])}
          aria-current={state === 'current' ? 'step' : undefined}>
          <span className={styles.marker} aria-hidden>
            {state === 'done' ? <LuCheck /> : index + 1}
          </span>
          <span className={styles.text}>
            <span className={styles.title}>{step.title}</span>
            <span className={styles.description}>{step.description}</span>
          </span>
        </li>
      )
    })}
  </ol>
)
