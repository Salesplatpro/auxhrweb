import React, { useState } from 'react'
import { LuArrowLeft } from 'react-icons/lu'
import useSWR from 'swr'

import { ConfirmDialog } from '@/components/feedback'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import {
  allRestricted,
  canOrder,
  CHECK_ROWS,
  eventTitle,
  isOpen,
  OVERALL_LABEL,
  OVERALL_MEANING,
  OVERALL_TONE,
  STATUS_LABEL,
  STATUS_TONE,
  TONE_COLOURS,
} from '@/features/checks/checkRules'
import {
  checksKey,
  fetchCheckHistory,
  fetchChecks,
  fetchIdNumber,
  orderCheck,
  requestConsent,
} from '@/features/checks/checksService'
import type {
  ApplicationCheck,
  CheckType,
  OpenCheck,
} from '@/features/checks/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { ResultModal } from './ResultModal'
import styles from './VerificationTab.module.scss'

const stamp = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const tone = (key: 'positive' | 'caution' | 'danger' | 'neutral') =>
  TONE_COLOURS[key]

const History = ({
  check,
  onBack,
}: {
  check: OpenCheck
  onBack: () => void
}) => {
  const { data, isLoading, error, mutate } = useSWR(
    `/checks/${check.id}/history`,
    () => fetchCheckHistory(check.id),
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  )
  const title = CHECK_ROWS.find((row) => row.type === check.type)?.title
  return (
    <div className={styles.stack}>
      <Button
        variant="ghost"
        size="sm"
        icon={<LuArrowLeft size={14} />}
        onClick={onBack}
        className={styles.back}>
        All checks
      </Button>
      <h3 className={styles.title}>History · {title} check</h3>
      <p className={styles.muted}>
        Every order, change and view, with who did it and when.
      </p>
      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <EmptyState
          title="We could not load the history"
          action={<Button onClick={() => void mutate()}>Try again</Button>}
        />
      ) : (
        <ul className={styles.history}>
          {data.events.map((event) => (
            <li key={event.id}>
              <p className={styles.rowTitle}>
                {eventTitle(event.kind, event.detail)}
              </p>
              <p className={styles.muted}>
                {event.actorName ?? 'Someone'} · {stamp(event.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const Result = ({ check }: { check: OpenCheck }) => {
  const [idNumber, setIdNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const reveal = async () => {
    setLoading(true)
    try {
      const result = await fetchIdNumber(check.id)
      setIdNumber(`${result.idKind.toUpperCase()} ${result.idNumber}`)
    } catch (revealError) {
      notify(
        'error',
        getErrorMessage(revealError, "We couldn't show the ID number."),
        { autoClose: 4000 },
      )
    } finally {
      setLoading(false)
    }
  }

  if (!check.completedAt) return null
  return (
    <div className={styles.result}>
      {check.type === 'identity' ? (
        <>
          <p>Name on the ID: {check.nameOnId}</p>
          <p>Name given: {check.nameGiven}</p>
          <p>Result: {check.resultText?.toLowerCase()}</p>
          {idNumber ? (
            <p>{idNumber}</p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              loading={loading}
              onClick={() => void reveal()}>
              Show ID number
            </Button>
          )}
        </>
      ) : (
        <>
          <p>Confirmed by: {check.confirmedBy}</p>
          {check.confirmedOn && <p>Date: {day(check.confirmedOn)}</p>}
          {check.note && <p>{check.note}</p>}
        </>
      )}
    </div>
  )
}

export const VerificationTab = ({
  applicationId,
  candidateName,
}: {
  applicationId: string
  candidateName: string
}) => {
  const firstName = candidateName.split(' ')[0] ?? candidateName
  const { data, isLoading, error, mutate } = useSWR(
    checksKey(applicationId),
    () => fetchChecks(applicationId),
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  )
  const [ordering, setOrdering] = useState<CheckType | null>(null)
  const [isOrdering, setIsOrdering] = useState(false)
  const [entering, setEntering] = useState<OpenCheck | null>(null)
  const [historyOf, setHistoryOf] = useState<OpenCheck | null>(null)
  const [asking, setAsking] = useState(false)

  if (isLoading) return <Spinner />
  if (error || !data) {
    return (
      <EmptyState
        title="We could not load the checks"
        description="Check your connection and try again."
        action={<Button onClick={() => void mutate()}>Try again</Button>}
      />
    )
  }
  if (historyOf)
    return <History check={historyOf} onBack={() => setHistoryOf(null)} />

  const ready = canOrder(data.consent)
  const byType = new Map<CheckType, ApplicationCheck>(
    data.checks.map((check) => [check.type, check]),
  )

  const order = async () => {
    if (!ordering) return
    setIsOrdering(true)
    try {
      await orderCheck(applicationId, ordering)
      await mutate()
      notify('success', 'Check ordered')
      setOrdering(null)
    } catch (orderError) {
      notify(
        'error',
        getErrorMessage(orderError, "We couldn't order that check."),
        { autoClose: 4000 },
      )
    } finally {
      setIsOrdering(false)
    }
  }

  const ask = async () => {
    setAsking(true)
    try {
      await requestConsent(applicationId)
      await mutate()
      notify('success', `We asked ${firstName} to agree to checks`)
    } catch (askError) {
      notify(
        'error',
        getErrorMessage(askError, "We couldn't send the request."),
        { autoClose: 4000 },
      )
    } finally {
      setAsking(false)
    }
  }

  const summary = ready ? (
    <>
      <StatusBadge
        status={OVERALL_LABEL[data.overallStatus]}
        showDot
        {...tone(OVERALL_TONE[data.overallStatus])}
      />
      <p className={styles.body}>{OVERALL_MEANING[data.overallStatus]}</p>
    </>
  ) : (
    <>
      <StatusBadge status="Waiting" showDot {...tone('neutral')} />
      <p className={styles.body}>
        {data.consent === 'declined'
          ? `${firstName} declined checks, so none can be ordered.`
          : data.consent === 'requested'
          ? `Waiting for ${firstName} to agree to checks. You can order once they agree.`
          : `${firstName} has not been asked yet. You can order once they agree.`}
      </p>
      {data.consent === 'not_requested' && (
        <Button
          variant="outline"
          size="sm"
          loading={asking}
          onClick={() => void ask()}>
          Ask for consent
        </Button>
      )}
    </>
  )

  if (ready && allRestricted(data.checks)) {
    return (
      <section className={styles.card}>
        <StatusBadge status="No access" showDot {...tone('danger')} />
        <h3 className={styles.title}>You cannot see this result</h3>
        <p className={styles.body}>
          Only the person who ordered this check and the company owner can see
          the result.
        </p>
        <p className={styles.muted}>
          Ask {data.ownerName || 'the company owner'} if you need it.
        </p>
      </section>
    )
  }

  return (
    <div className={styles.stack}>
      <section className={styles.card}>{summary}</section>
      {CHECK_ROWS.map((row) => {
        const check = byType.get(row.type)
        const open = check && isOpen(check) ? check : null
        const criminalOff = row.type === 'criminal' && !data.criminalAvailable
        return (
          <section key={row.type} className={styles.card}>
            <div className={styles.row}>
              <div>
                <h3 className={styles.rowTitle}>{row.title}</h3>
                <p className={styles.muted}>
                  {criminalOff
                    ? 'Not available in this country'
                    : row.description}
                </p>
              </div>
              {!criminalOff && (
                <div className={styles.side}>
                  {check?.restricted ? (
                    <StatusBadge status="Ordered" {...tone('neutral')} />
                  ) : open ? (
                    <StatusBadge
                      status={STATUS_LABEL[open.status]}
                      showDot
                      {...tone(STATUS_TONE[open.status])}
                    />
                  ) : (
                    <StatusBadge
                      status="Not ordered"
                      showDot
                      {...tone('neutral')}
                    />
                  )}
                  {!check && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!ready}
                      onClick={() => setOrdering(row.type)}>
                      Order
                    </Button>
                  )}
                  {open && !open.completedAt && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEntering(open)}>
                      Enter result
                    </Button>
                  )}
                  {open && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHistoryOf(open)}>
                      History
                    </Button>
                  )}
                </div>
              )}
            </div>
            {open && <Result check={open} />}
          </section>
        )
      })}

      <ConfirmDialog
        open={ordering !== null}
        title={`Order ${ordering ?? ''} check?`}
        description={`For ${candidateName}. The order is written to the check's history.`}
        confirmLabel="Order"
        variant="ink"
        isConfirming={isOrdering}
        onConfirm={() => void order()}
        onCancel={() => setOrdering(null)}
      />
      {entering && (
        <ResultModal
          check={entering}
          candidateName={candidateName}
          onCancel={() => setEntering(null)}
          onSaved={async () => {
            setEntering(null)
            await mutate()
            notify('success', 'Result saved')
          }}
        />
      )}
    </div>
  )
}
