import React, { FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { focusFieldByName } from '@/utils/focusField'

import styles from './AssessmentForm.module.scss'

export type AssessmentQuestion = {
  id: string
  question: string
}

type AssessmentVariant = 'personality' | 'role'

type AssessmentFormProps = {
  variant: AssessmentVariant
  emoji: string
  kicker: string
  title: string
  lead: string
  questions: AssessmentQuestion[]
  answers: Record<string, string>
  onChange: (questionId: string, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isSubmitting: boolean
  placeholder?: string
  optionalIds?: string[]
  maxLength?: number
}

const answeredCount = (
  questions: AssessmentQuestion[],
  answers: Record<string, string>,
) =>
  questions.filter((item) => (answers[item.id] ?? '').trim().length > 0).length

export const allQuestionsAnswered = (
  questions: AssessmentQuestion[],
  answers: Record<string, string>,
) =>
  questions.length > 0 &&
  questions.every((item) => (answers[item.id] ?? '').trim().length > 0)

export const AssessmentForm = ({
  variant,
  emoji,
  kicker,
  title,
  lead,
  questions,
  answers,
  onChange,
  onSubmit,
  isSubmitting,
  placeholder = 'Share a real example…',
  optionalIds = [],
  maxLength,
}: AssessmentFormProps) => {
  const requiredQuestions = questions.filter(
    (item) => !optionalIds.includes(item.id),
  )
  const filled = answeredCount(requiredQuestions, answers)
  const total = requiredQuestions.length
  const progress = total === 0 ? 0 : Math.round((filled / total) * 100)
  const [submitAttempted, setSubmitAttempted] = React.useState(false)
  const isMissing = (id: string) =>
    submitAttempted && !optionalIds.includes(id) && !(answers[id] ?? '').trim()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!allQuestionsAnswered(requiredQuestions, answers)) {
      event.preventDefault()
      setSubmitAttempted(true)
      const firstEmpty = requiredQuestions.find(
        (item) => !(answers[item.id] ?? '').trim(),
      )
      if (firstEmpty) {
        focusFieldByName(`answer-${firstEmpty.id}`)
      }
      return
    }
    onSubmit(event)
  }

  return (
    <form className={styles.shell} onSubmit={handleSubmit} noValidate>
      <header
        className={`${styles.intro} ${
          variant === 'personality' ? styles.personality : styles.role
        }`}>
        <p className={styles.emoji} aria-hidden>
          {emoji}
        </p>
        <p className={styles.kicker}>{kicker}</p>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.lead}>{lead}</p>
        <div className={styles.progress}>
          <div className={styles.progressMeta}>
            <span>
              {filled} of {total} answered
            </span>
            <span>{progress}%</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Questions answered">
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <ol className={styles.list}>
        {questions.map((question, index) => (
          <li key={question.id} className={styles.card}>
            <div className={styles.questionRow}>
              <span className={styles.badge}>{index + 1}</span>
              <p className={styles.question}>{question.question}</p>
            </div>
            <textarea
              className={`${styles.textarea} ${
                isMissing(question.id) ? styles.invalid : ''
              }`}
              id={`answer-${question.id}`}
              name={`answer-${question.id}`}
              value={answers[question.id] ?? ''}
              placeholder={placeholder}
              required={!optionalIds.includes(question.id)}
              maxLength={maxLength}
              aria-invalid={isMissing(question.id) ? true : undefined}
              onChange={(event) => onChange(question.id, event.target.value)}
            />
            {isMissing(question.id) && (
              <p className={styles.fieldError} role="alert">
                Please answer this question to continue.
              </p>
            )}
          </li>
        ))}
      </ol>

      <div className={styles.actions}>
        <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit answers'}
        </Button>
      </div>
    </form>
  )
}

type AssessmentStatusProps = {
  message: string
  error?: boolean
  loading?: boolean
  actionLabel?: string
  onAction?: () => void
}

export const AssessmentStatus = ({
  message,
  error = false,
  loading = false,
  actionLabel,
  onAction,
}: AssessmentStatusProps) => (
  <div className={styles.status}>
    {loading ? <Spinner /> : null}
    <p className={`${styles.statusCopy} ${error ? styles.statusError : ''}`}>
      {message}
    </p>
    {actionLabel && onAction ? (
      <Button type="button" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
)
