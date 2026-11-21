import React, { useState } from 'react'
import { LuBriefcase, LuCheck, LuClock3, LuMail } from 'react-icons/lu'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'

import { TextArea } from '@/components/forms/TextArea'
import { PublicShell } from '@/components/layout/PublicShell'
import { Button } from '@/components/ui/Button'
import { CheckList } from '@/components/ui/CheckList'
import { IconBadge } from '@/components/ui/IconBadge'
import { Spinner } from '@/components/ui/Spinner'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './RefereePage.module.scss'
import {
  ANSWER_MAX_LENGTH,
  answersComplete,
  answersWithinLimit,
  goneDetailsFrom,
  LinkGoneDetails,
  LinkProblem,
  linkProblemFor,
} from './referenceResponse'
import { fetchRefereeRequest, submitRefereeAnswers } from './referencesService'
import type { RefereeRequest } from './types'

type Problem = { kind: LinkProblem; details: LinkGoneDetails | null }

const statusOf = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status

const toProblem = (error: unknown): Problem | null => {
  const kind = linkProblemFor(statusOf(error))
  return kind ? { kind, details: goneDetailsFrom(error) } : null
}

const LinkProblemMessage = ({ problem }: { problem: Problem }) => {
  const { details } = problem
  const company = details?.companyName ?? 'the company'
  const shell = {
    companyName: details?.companyName,
    title: details?.jobTitle ? `Reference · ${details.jobTitle}` : 'Reference',
  }
  const expired = problem.kind === 'expired'
  return (
    <PublicShell {...shell} width="narrow">
      <section className={styles.message}>
        <IconBadge icon={<LuClock3 />} tone="warning" size="lg" />
        <h1>
          {expired ? 'This link no longer works' : 'We cannot find this link'}
        </h1>
        <p>
          {expired
            ? `It has expired or you already sent your answers. Ask ${company} to send it again.`
            : 'Check the link in the email, or ask the person who sent it to send it again.'}
        </p>
        {details?.companyEmail && (
          <Button
            variant="outline"
            icon={<LuMail aria-hidden />}
            onClick={() => {
              window.location.href = `mailto:${details.companyEmail}`
            }}>
            Email {company}
          </Button>
        )}
      </section>
    </PublicShell>
  )
}

const ThankYou = ({ request }: { request: RefereeRequest }) => (
  <PublicShell
    companyName={request.companyName}
    title={`Reference · ${request.jobTitle}`}
    width="narrow">
    <section className={styles.message}>
      <IconBadge icon={<LuCheck />} tone="success" size="lg" />
      <h1>
        Thank you, {request.refereeName.split(' ')[0]}. Your answers are sent.
      </h1>
      <p>
        {request.companyName ?? 'The company'} will read them when they review{' '}
        {request.candidateName}. You do not need to do anything else.
      </p>
      <CheckList
        variant="summary"
        items={[
          {
            label: `${request.questions.length} of ${request.questions.length} questions answered`,
          },
          { label: 'Your answers are kept private to the hiring team' },
          { label: 'You can close this page' },
        ]}
        className={styles.summary}
      />
    </section>
  </PublicShell>
)

const RefereeForm = ({
  request,
  token,
  onProblem,
}: {
  request: RefereeRequest
  token: string
  onProblem: (problem: Problem) => void
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const shell = {
    companyName: request.companyName,
    title: `Reference · ${request.jobTitle}`,
  }
  const set = (key: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }))

  if (done) return <ThankYou request={request} />

  const ready =
    answersComplete(request.questions, answers) && answersWithinLimit(answers)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!ready) return
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
      const problem = toProblem(error)
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
    <PublicShell {...shell}>
      <h1 className={styles.title}>A reference for {request.candidateName}</h1>
      <p className={styles.lead}>
        {request.candidateName} applied for {request.jobTitle}
        {request.companyName ? ` at ${request.companyName}` : ''} and named you
        as a referee. Six short questions, about 5 minutes. No login needed.
      </p>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {request.questions.map((item, index) => (
          <section key={item.key} className={styles.card}>
            <h2 className={styles.question}>
              {index + 1}. {item.question}
            </h2>
            {item.type === 'yesno' ? (
              <div
                className={styles.choices}
                role="radiogroup"
                aria-label={item.question}>
                {['Yes', 'No'].map((choice) => (
                  <Button
                    key={choice}
                    type="button"
                    role="radio"
                    aria-checked={answers[item.key] === choice}
                    variant={answers[item.key] === choice ? 'ink' : 'outline'}
                    pill
                    onClick={() => set(item.key, choice)}>
                    {choice}
                  </Button>
                ))}
              </div>
            ) : (
              <TextArea
                title={item.question}
                name={item.key}
                value={answers[item.key] ?? ''}
                onChange={(event) => set(item.key, event.target.value)}
                placeholder={
                  item.required ? 'Write a few sentences' : 'Optional'
                }
                rows={4}
                maxLength={ANSWER_MAX_LENGTH}
                required={item.required}
              />
            )}
          </section>
        ))}
        <footer className={styles.footer}>
          <p>
            <LuBriefcase aria-hidden /> Your answers go only to the hiring team
            {request.companyName ? ` at ${request.companyName}` : ''}.
          </p>
          <Button
            type="submit"
            variant="ink"
            pill
            disabled={!ready}
            loading={isSubmitting}>
            Submit
          </Button>
        </footer>
      </form>
    </PublicShell>
  )
}

export const RefereePage = () => {
  const { token = '' } = useParams<{ token: string }>()
  const [problem, setProblem] = useState<Problem | null>(null)
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
  const shown = problem ?? (error ? toProblem(error) : null)
  if (shown) return <LinkProblemMessage problem={shown} />
  if (error || !data) {
    return (
      <PublicShell width="narrow">
        <section className={styles.message}>
          <h1>We could not open this link</h1>
          <p>Try again in a moment.</p>
        </section>
      </PublicShell>
    )
  }
  return <RefereeForm request={data} token={token} onProblem={setProblem} />
}
