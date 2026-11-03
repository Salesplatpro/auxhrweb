import React, { useState } from 'react'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { usePerformanceChange } from '@/features/people/hooks/usePerformance'
import {
  approveCompletion,
  downloadEvidence,
  returnCompletion,
} from '@/features/people/services/peopleService'
import {
  CompletionRequest,
  CompletionReviewResult,
  ManagedPerformance,
} from '@/features/people/types'
import { formatDateOnly } from '@/features/people/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { EvidenceList } from '../completion/EvidenceList'
import styles from './Performance.module.scss'

export const applyReviewResult = (
  current: ManagedPerformance,
  result: CompletionReviewResult,
): ManagedPerformance => ({
  ...current,
  goals: result.goal
    ? current.goals.map((goal) =>
        goal.id === result.goal?.id ? result.goal ?? goal : goal,
      )
    : current.goals,
  completionRequests: result.request
    ? [
        result.request,
        ...current.completionRequests.filter(
          (request) => request.itemId !== result.request?.itemId,
        ),
      ]
    : current.completionRequests,
})

const RequestRow: React.FC<{
  base: string
  request: CompletionRequest
  goalVersion?: number
  isBusy: boolean
  onDecide: (
    name: string,
    action: () => Promise<CompletionReviewResult>,
  ) => Promise<void>
}> = ({ base, request, goalVersion, isBusy, onDecide }) => {
  const [note, setNote] = useState('')
  const [noteMissing, setNoteMissing] = useState(false)

  const download = (file: CompletionRequest['files'][number]) => {
    downloadEvidence(base, request.id, file).catch((err: unknown) =>
      notify('error', getErrorMessage(err, 'Could not download this file')),
    )
  }

  const sendBack = () => {
    if (!note.trim()) {
      setNoteMissing(true)
      return
    }
    void onDecide(request.id, () =>
      returnCompletion(base, request.id, note.trim()),
    )
  }

  return (
    <li className={styles.item}>
      <div className={styles.itemHead}>
        <strong>{request.itemTitle}</strong>
        <span className={styles.pill}>
          {request.itemType === 'goal' ? 'Goal' : 'First-week task'}
        </span>
      </div>
      <p className={styles.muted}>
        Sent {formatDateOnly(request.createdAt.slice(0, 10))}
      </p>
      <p className={styles.preWrap}>{request.summary}</p>
      <EvidenceList request={request} onDownload={download} />
      <label className={styles.field}>
        <span>Note to them (needed to send it back)</span>
        <textarea
          rows={2}
          value={note}
          disabled={isBusy}
          onChange={(event) => {
            setNote(event.target.value)
            setNoteMissing(false)
          }}
        />
      </label>
      {noteMissing && (
        <p className={styles.error} role="alert">
          Add a note saying what they need to change
        </p>
      )}
      <div className={styles.actions}>
        <Button
          size="sm"
          type="button"
          loading={isBusy}
          onClick={() =>
            void onDecide(request.id, () =>
              approveCompletion(base, request.id, {
                version: goalVersion,
                note: note.trim() || null,
              }),
            )
          }>
          Mark complete
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={sendBack}>
          Send back
        </Button>
      </div>
    </li>
  )
}

export const CompletionRequestsCard: React.FC<{
  base: string
  performance: ManagedPerformance
}> = ({ base, performance }) => {
  const { run, updateCache, pending } =
    usePerformanceChange<ManagedPerformance>(base)

  const waiting = performance.completionRequests.filter(
    (request) => request.status === 'pending',
  )
  if (waiting.length === 0) return null

  const decide = async (
    name: string,
    action: () => Promise<CompletionReviewResult>,
  ) => {
    await run(
      name,
      async () => {
        const result = await action()
        await updateCache((current) => applyReviewResult(current, result))
      },
      'Could not save this decision.',
    )
  }

  return (
    <PagePanel
      title="Completion requests"
      hint="Their weekly reports are further down this page.">
      <ul className={styles.list}>
        {waiting.map((request) => (
          <RequestRow
            key={request.id}
            base={base}
            request={request}
            goalVersion={
              performance.goals.find((goal) => goal.id === request.itemId)
                ?.version
            }
            isBusy={pending === request.id}
            onDecide={decide}
          />
        ))}
      </ul>
    </PagePanel>
  )
}
