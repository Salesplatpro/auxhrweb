import cn from 'classnames'
import React from 'react'
import { FaCheck } from 'react-icons/fa6'

import styles from './Stepper.module.scss'

export type StepDef<Id extends string = string> = {
  id: Id
  title: string
  description?: string
}

export type StepperProps<Id extends string = string> = {
  steps: StepDef<Id>[]
  current: Id
  ariaLabel: string
  /** Steps the user may jump back to; anything else renders as plain text. */
  selectable?: Id[]
  onSelect?: (step: Id) => void
  /** One card with the steps joined by a line, instead of a box per step. */
  connected?: boolean
}

/**
 * Generalised from PostJobStepper, whose steps were hard-coded in the module so it
 * could only ever describe one flow.
 */
export function Stepper<Id extends string = string>({
  steps,
  current,
  ariaLabel,
  selectable = [],
  onSelect,
  connected = false,
}: StepperProps<Id>) {
  const currentIndex = steps.findIndex((step) => step.id === current)

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(styles.stepper, connected && styles.connected)}>
      <ol className={styles.list}>
        {steps.map((step, index) => {
          const isDone = index < currentIndex
          const isCurrent = index === currentIndex
          const canSelect =
            !isCurrent && !!onSelect && selectable.includes(step.id)
          const itemClass = cn(
            styles.item,
            isDone && styles.done,
            isCurrent && styles.current,
          )

          const content = (
            <>
              <span className={styles.marker} aria-hidden>
                {isDone ? <FaCheck /> : index + 1}
              </span>
              <span className={styles.copy}>
                <span className={styles.title}>{step.title}</span>
                {step.description && (
                  <span className={styles.description}>{step.description}</span>
                )}
              </span>
            </>
          )

          return (
            <li
              key={step.id}
              className={itemClass}
              aria-current={isCurrent ? 'step' : undefined}>
              {canSelect ? (
                <button
                  type="button"
                  className={styles.stepButton}
                  onClick={() => onSelect?.(step.id)}>
                  {content}
                </button>
              ) : (
                <span className={styles.stepStatic}>{content}</span>
              )}
              {connected && index < steps.length - 1 && (
                <span className={styles.line} aria-hidden />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
