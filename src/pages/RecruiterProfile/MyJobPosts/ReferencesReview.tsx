import React, { useState } from 'react'
import useSWR from 'swr'

import { PagePanel } from '@/components/layout/PagePanel'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  answeredSummary,
  canResend,
  resendMessage,
} from '@/features/references/referenceReview'
import { REFERENCE_STATUS_LABEL } from '@/features/references/referenceRules'
import {
  readReferences,
  resendReference,
} from '@/features/references/referencesService'
import type { ReviewedReferee } from '@/features/references/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import chatStyles from './AssessmentChat.module.scss'
import styles from './ReferencesReview.module.scss'

const statusOf = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status

const RefereeAnswers = ({ referee }: { referee: ReviewedReferee }) => (
  <div className={chatStyles.thread}>
    {(referee.answers ?? []).map((item) => (
      <React.Fragment key={item.key}>
        <div className={`${chatStyles.row} ${chatStyles.received}`}>
          <div className={chatStyles.bubble}>
            <span className={chatStyles.role}>Question</span>
            <p className={chatStyles.content}>{item.question}</p>
          </div>
        </div>
        <div className={`${chatStyles.row} ${chatStyles.own}`}>
          <div className={chatStyles.bubble}>
            <span className={chatStyles.role}>{referee.name}</span>
            <p className={chatStyles.content}>{item.answer?.trim() || '—'}</p>
          </div>
        </div>
      </React.Fragment>
    ))}
  </div>
)

export const ReferencesReview = ({
  applicationId,
  readOnly = false,
}: {
  applicationId: string
  readOnly?: boolean
}) => {
  const key = `/references/applications/${applicationId}/answers`
  const { data, error, mutate } = useSWR(
    key,
    () => readReferences(applicationId),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const [resendingId, setResendingId] = useState<string | null>(null)

  if (statusOf(error) === 403) return null

  const references = data?.references ?? []
  const summary = answeredSummary(references)

  const handleResend = async (referee: ReviewedReferee) => {
    setResendingId(referee.id)
    try {
      const resent = await resendReference(referee.id)
      await mutate()
      notify(
        resent.status === 'not_sent' ? 'error' : 'success',
        resendMessage(resent.status, referee.name),
      )
    } catch (resendError) {
      notify(
        'error',
        getErrorMessage(resendError, "We couldn't resend that request."),
        { autoClose: 4000 },
      )
    } finally {
      setResendingId(null)
    }
  }

  return (
    <PagePanel title="References" hint={summary ?? undefined}>
      {error ? (
        <p className={styles.error}>Unable to load references.</p>
      ) : !data ? null : references.length === 0 ? (
        <p className={styles.empty}>No one has been asked for a reference.</p>
      ) : (
        <ul className={styles.list}>
          {references.map((referee) => (
            <li key={referee.id} className={styles.referee}>
              <div className={styles.head}>
                <div>
                  <p className={styles.name}>{referee.name}</p>
                  <p className={styles.meta}>
                    {referee.relationship} · {referee.email}
                  </p>
                </div>
                <StatusBadge status={REFERENCE_STATUS_LABEL[referee.status]} />
              </div>
              {referee.status === 'answered' && (
                <RefereeAnswers referee={referee} />
              )}
              {!readOnly && canResend(referee.status) && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={resendingId === referee.id}
                    onClick={() => void handleResend(referee)}>
                    Resend request
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </PagePanel>
  )
}
