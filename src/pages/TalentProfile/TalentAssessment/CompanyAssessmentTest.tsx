import React, { FormEvent, useState } from 'react'

import {
  type CompanyAssessmentKind,
  useCompanyAssessmentQuestionsQuery,
  useSubmitCompanyAssessmentAnswersMutation,
} from '@/redux/api/talent'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import {
  AssessmentForm,
  AssessmentQuestion,
  AssessmentStatus,
} from './AssessmentForm'

const COPY: Record<
  CompanyAssessmentKind,
  { label: string; emoji: string; kicker: string; title: string; lead: string }
> = {
  'problem-solving': {
    label: 'problem-solving',
    emoji: '🧩',
    kicker: 'Problem-solving test',
    title: 'Show how you think a problem through',
    lead: 'There are no trick questions. Explain what you would do and why — your reasoning matters more than a perfect answer.',
  },
  'culture-fit': {
    label: 'culture-fit',
    emoji: '🤝',
    kicker: 'Culture-fit test',
    title: 'Tell us how you like to work',
    lead: 'These questions come from what this company values. Real examples from your own work are best.',
  },
}

type ErrorWithStatus = { status?: number }
const statusOf = (err: unknown) => (err as ErrorWithStatus | undefined)?.status

export type CompanyAssessmentTestProps = {
  jobId: string
  type: CompanyAssessmentKind
  /** The application says this test is already done. */
  submitted?: boolean
  onSubmitted?: () => void
}

/**
 * Candidate page for the problem-solving or culture-fit test. The company
 * switches each test on per job; when it's off this renders nothing. The
 * candidate never sees a score.
 */
const CompanyAssessmentTest = ({
  jobId,
  type,
  submitted = false,
  onSubmitted,
}: CompanyAssessmentTestProps) => {
  const copy = COPY[type]
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const { data, isLoading, error, refetch } =
    useCompanyAssessmentQuestionsQuery(
      { jobId, type },
      { skip: submitted || !jobId },
    )
  const [submitAnswers, { isLoading: isSubmitting }] =
    useSubmitCompanyAssessmentAnswersMutation()

  if (submitted || done) {
    return (
      <AssessmentStatus
        message={`Your ${copy.label} answers are in. Thanks — the hiring team will review them.`}
      />
    )
  }

  // 400: the company hasn't switched this test on for the job.
  if (error && statusOf(error) === 400) return null

  if (isLoading) {
    return (
      <AssessmentStatus loading message={`Loading your ${copy.label} test…`} />
    )
  }

  if (error) {
    return (
      <AssessmentStatus
        error
        message={getErrorMessage(
          error,
          `Unable to load your ${copy.label} test.`,
        )}
        actionLabel="Retry"
        onAction={() => void refetch()}
      />
    )
  }

  const questions: AssessmentQuestion[] = (
    (data?.data?.questions ?? []) as AssessmentQuestion[]
  ).map(({ id, question }) => ({ id, question }))
  if (questions.length === 0) return null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await submitAnswers({ jobId, type, answers }).unwrap()
      setDone(true)
      onSubmitted?.()
    } catch (err) {
      if (statusOf(err) === 409) {
        setDone(true)
        onSubmitted?.()
        return
      }
      notify(
        'error',
        getErrorMessage(err, `We couldn't send your ${copy.label} answers.`),
        { autoClose: 4000 },
      )
    }
  }

  return (
    <AssessmentForm
      variant="role"
      emoji={copy.emoji}
      kicker={copy.kicker}
      title={copy.title}
      lead={copy.lead}
      questions={questions}
      answers={answers}
      onChange={(questionId, value) =>
        setAnswers((prev) => ({ ...prev, [questionId]: value }))
      }
      onSubmit={(event) => void handleSubmit(event)}
      isSubmitting={isSubmitting}
      placeholder="Write your answer…"
    />
  )
}

export default CompanyAssessmentTest
