import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'

import { Spinner } from '@/components/ui/Spinner'
import {
  AssessmentForm,
  AssessmentStatus,
} from '@/pages/TalentProfile/TalentAssessment/AssessmentForm'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './RefereePage.module.scss'
import {
  ANSWER_MAX_LENGTH,
  answersComplete,
  answersWithinLimit,
  LinkProblem,
  linkProblemFor,
} from './referenceResponse'
import { fetchRefereeRequest, submitRefereeAnswers } from './referencesService'
import type { RefereeRequest } from './types'

const PROBLEM_COPY: Record<LinkProblem, { title: string; body: string }> = {
  expired: {
    title: 'This link no longer works',
    body: 'This link has expired or was already used. Ask the person who sent it to send it again.',
  },
  missing: {
    title: 'We cannot find this link',
    body: 'Check the link in the email, or ask the person who sent it to send it again.',
  },
}

const LinkProblemMessage = ({ problem }: { problem: LinkProblem }) => (
  <div className={styles.page}>
    <div className={styles.message}>
      <h1>{PROBLEM_COPY[problem].title}</h1>
      <p>{PROBLEM_COPY[problem].body}</p>
    </div>
  </div>
)

const RefereeForm = ({
  request,
  token,
  onProblem,
}: {
  request: RefereeRequest
  token: string
  onProblem: (problem: LinkProblem) => void
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const questions = request.questions.map(({ key, question }) => ({
    id: key,
    question,
  }))
  const optionalIds = request.questions
    .filter((item) => !item.required)
    .map((item) => item.key)

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <AssessmentStatus
            message={`Thanks, ${request.refereeName}. Your answers are in.`}
          />
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (
      !answersComplete(request.questions, answers) ||
      !answersWithinLimit(answers)
    ) {
      return
    }
    const payload = Object.fromEntries(
      request.questions
        .map((item) => [item.key, (answers[item.key] ?? '').trim()])
        .filter(([, value]) => value.length > 0),
    )
    setIsSubmitting(true)
    try {
      await submitRefereeAnswers(token, payload)
      setDone(true)
    } catch (error) {
      const problem = linkProblemFor(
        (error as { response?: { status?: number } })?.response?.status,
      )
      if (problem) {
        onProblem(problem)
      } else {
        notify(
          'error',
          getErrorMessage(error, "We couldn't send your answers. Try again."),
          { autoClose: 4000 },
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AssessmentForm
          variant="role"
          emoji="🤝"
          kicker={request.companyName ?? 'Reference request'}
          title={`${request.candidateName} asked for a reference`}
          lead={`Hi ${
            request.refereeName
          }. Answer the questions below about working with ${
            request.candidateName
          }${
            request.jobTitle ? ` on ${request.jobTitle}` : ''
          }. The link works once.`}
          questions={questions}
          answers={answers}
          onChange={(questionId, value) =>
            setAnswers((prev) => ({ ...prev, [questionId]: value }))
          }
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}
          isSubmitting={isSubmitting}
          placeholder="Write your answer…"
          optionalIds={optionalIds}
          maxLength={ANSWER_MAX_LENGTH}
        />
      </div>
    </div>
  )
}

export const RefereePage = () => {
  const { token = '' } = useParams<{ token: string }>()
  const [problem, setProblem] = useState<LinkProblem | null>(null)
  const { data, error, isLoading } = useSWR(
    `/references/respond/${token}`,
    () => fetchRefereeRequest(token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    },
  )

  if (isLoading) return <Spinner fullPage />
  const loadProblem = linkProblemFor(
    (error as { response?: { status?: number } })?.response?.status,
  )
  if (problem ?? loadProblem)
    return <LinkProblemMessage problem={(problem ?? loadProblem)!} />
  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.message}>
          <h1>We could not open this link</h1>
          <p>Try again in a moment.</p>
        </div>
      </div>
    )
  }
  return <RefereeForm request={data} token={token} onProblem={setProblem} />
}
