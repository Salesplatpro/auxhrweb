import React, { ReactNode } from 'react'
import { HiArrowLeft, HiArrowRight } from 'react-icons/hi2'

import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'

import { TestKindConfig } from '../kinds'
import styles from './QuestionStep.module.scss'

type QuestionStepProps = {
  kind: TestKindConfig
  context: string
  index: number
  total: number
  question: string
  hint: string
  children: ReactNode
  canGoNext: boolean
  isLast: boolean
  submitting: boolean
  onBack: () => void
  onNext: () => void
}

export const QuestionStep = ({
  kind,
  context,
  index,
  total,
  question,
  hint,
  children,
  canGoNext,
  isLast,
  submitting,
  onBack,
  onNext,
}: QuestionStepProps) => {
  const percent = Math.round(((index + 1) / total) * 100)
  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <div className={styles.labels}>
          <Pill size="sm" icon={kind.icon}>
            {kind.label}
          </Pill>
          <span className={styles.context}>{context}</span>
        </div>
        <div className={styles.progress}>
          <span className={styles.count}>
            Question {index + 1} of {total}
          </span>
          <span className={styles.track}>
            <span className={styles.fill} style={{ width: `${percent}%` }} />
          </span>
          <span className={styles.percent}>{percent}%</span>
        </div>
      </div>
      <div className={styles.body}>
        <h1 className={styles.question}>{question}</h1>
        <p className={styles.hint}>{hint}</p>
        {children}
      </div>
      <div className={styles.nav}>
        <Button
          variant="outline"
          icon={<HiArrowLeft />}
          onClick={onBack}
          disabled={index === 0 || submitting}
          className={styles.back}>
          Back
        </Button>
        <Button
          variant="brand"
          pill
          iconEnd={<HiArrowRight />}
          onClick={onNext}
          disabled={!canGoNext}
          loading={submitting}
          className={styles.next}>
          {isLast ? 'Submit' : 'Next'}
        </Button>
      </div>
    </section>
  )
}
