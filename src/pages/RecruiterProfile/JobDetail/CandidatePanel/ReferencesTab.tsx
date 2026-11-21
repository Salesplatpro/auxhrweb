import React, { useState } from 'react'
import { LuArrowLeft } from 'react-icons/lu'
import useSWR from 'swr'

import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import {
  REFERENCE_STATUS_LABEL,
  relationshipLabel,
} from '@/features/references/referenceRules'
import {
  companyReferencesKey,
  fetchCompanyReferences,
  resendReferenceRequest,
} from '@/features/references/referencesService'
import type { RefereeWithAnswers } from '@/features/references/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './ReferencesTab.module.scss'

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const STATUS_COLOURS = {
  answered: {
    backgroundColor: 'var(--color-positive-tint)',
    color: 'var(--color-positive)',
  },
  sent: {
    backgroundColor: 'var(--color-caution-tint)',
    color: 'var(--color-caution-text)',
  },
  not_sent: {
    backgroundColor: 'var(--color-bg-subtle)',
    color: 'var(--color-text-muted)',
  },
  expired: {
    backgroundColor: 'var(--color-bg-subtle)',
    color: 'var(--color-text-muted)',
  },
} as const

const AnswersView = ({
  referee,
  onBack,
}: {
  referee: RefereeWithAnswers
  onBack: () => void
}) => (
  <div className={styles.stack}>
    <Button
      variant="ghost"
      size="sm"
      icon={<LuArrowLeft size={14} />}
      onClick={onBack}
      className={styles.back}>
      All referees
    </Button>
    <header className={styles.answersHeader}>
      <h3 className={styles.name}>
        {referee.name} · {relationshipLabel(referee.relationship)}
      </h3>
      <StatusBadge
        status={REFERENCE_STATUS_LABEL[referee.status]}
        showDot
        {...STATUS_COLOURS[referee.status]}
      />
    </header>
    {referee.answeredAt && (
      <p className={styles.muted}>Answered {longDate(referee.answeredAt)}</p>
    )}
    {(referee.answers ?? []).map((item) => (
      <section key={item.key}>
        <h4 className={styles.question}>{item.question}</h4>
        <p className={styles.answer}>{item.answer}</p>
      </section>
    ))}
  </div>
)

export const ReferencesTab = ({ applicationId }: { applicationId: string }) => {
  const { data, isLoading, error, mutate } = useSWR(
    companyReferencesKey(applicationId),
    () => fetchCompanyReferences(applicationId),
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  )
  const [openId, setOpenId] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)

  if (isLoading) return <Spinner />
  if (error || !data) {
    return (
      <EmptyState
        title="We could not load the references"
        description="Check your connection and try again."
        action={<Button onClick={() => void mutate()}>Try again</Button>}
      />
    )
  }
  if (data.references.length === 0) {
    return (
      <EmptyState
        title="No referees yet"
        description="The candidate has not named anyone. They add referees from their application."
      />
    )
  }

  const opened = data.references.find((referee) => referee.id === openId)
  if (opened)
    return <AnswersView referee={opened} onBack={() => setOpenId(null)} />

  const resend = async (referee: RefereeWithAnswers) => {
    setResendingId(referee.id)
    try {
      await resendReferenceRequest(referee.id)
      await mutate()
      notify('success', `We emailed ${referee.name} again`)
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
    <div className={styles.stack}>
      <h3 className={styles.sectionTitle}>Referees</h3>
      {data.references.map((referee) => (
        <section key={referee.id} className={styles.card}>
          <div>
            <p className={styles.name}>{referee.name}</p>
            <p className={styles.muted}>
              {relationshipLabel(referee.relationship)} · {referee.email}
            </p>
          </div>
          <div className={styles.side}>
            <StatusBadge
              status={REFERENCE_STATUS_LABEL[referee.status]}
              showDot
              {...STATUS_COLOURS[referee.status]}
            />
            <span className={styles.muted}>
              {shortDate(
                referee.answeredAt ?? referee.sentAt ?? referee.expiresAt,
              )}
            </span>
            {referee.status === 'answered' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenId(referee.id)}>
                View answers
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                loading={resendingId === referee.id}
                onClick={() => void resend(referee)}>
                Resend
              </Button>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
