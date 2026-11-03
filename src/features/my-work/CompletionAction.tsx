import React, { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { EvidenceList } from '@/features/people/components/completion/EvidenceList'
import {
  downloadMyEvidence,
  submitCompletionRequest,
  withdrawCompletionRequest,
} from '@/features/people/services/peopleService'
import { CompletionRequest } from '@/features/people/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './MyWork.module.scss'

const MAX_SUMMARY = 4000
const MAX_FILES = 3
const MAX_LINKS = 5
const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPTED_FILES = '.pdf,.jpg,.jpeg,.png,.docx'

const splitLinks = (text: string) =>
  text
    .split('\n')
    .map((link) => link.trim())
    .filter(Boolean)

const evidenceProblem = (
  summary: string,
  files: File[],
  links: string[],
): string | null => {
  if (!summary.trim()) return 'Write a short summary of what you did.'
  if (files.length === 0 && links.length === 0) {
    return 'Add a file or a link as evidence.'
  }
  if (files.length > MAX_FILES) return `Add at most ${MAX_FILES} files.`
  if (files.some((file) => file.size > MAX_FILE_BYTES)) {
    return 'Each file must be 10 MB or smaller.'
  }
  if (links.length > MAX_LINKS) return `Add at most ${MAX_LINKS} links.`
  if (links.some((link) => !link.startsWith('https://'))) {
    return 'Links must start with https://'
  }
  return null
}

const RequestForm: React.FC<{
  staffId: string
  itemType: CompletionRequest['itemType']
  itemId: string
  title: string
  onClose: () => void
  onSubmitted: (request: CompletionRequest) => void
}> = ({ staffId, itemType, itemId, title, onClose, onSubmitted }) => {
  const [summary, setSummary] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [linksText, setLinksText] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const send = async () => {
    const links = splitLinks(linksText)
    const found = evidenceProblem(summary, files, links)
    setProblem(found)
    if (found) return

    const form = new FormData()
    form.append('itemType', itemType)
    form.append('itemId', itemId)
    form.append('summary', summary.trim())
    links.forEach((link) => form.append('links', link))
    files.forEach((file) => form.append('files', file))

    setIsSending(true)
    try {
      onSubmitted(await submitCompletionRequest(staffId, form))
      notify('success', 'Sent for review')
      onClose()
    } catch (err) {
      setProblem(getErrorMessage(err, 'Could not send this. Please try again.'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Request completion"
      subtitle={title}
      actions={
        <Button type="button" loading={isSending} onClick={() => void send()}>
          Send for review
        </Button>
      }>
      <div className={styles.completionForm}>
        <label className={styles.completionField}>
          <span>What did you do?</span>
          <textarea
            rows={5}
            maxLength={MAX_SUMMARY}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
          />
        </label>
        <label className={styles.completionField}>
          <span>Files (PDF, JPG, PNG or Word, up to {MAX_FILES})</span>
          <input
            type="file"
            multiple
            accept={ACCEPTED_FILES}
            onChange={(event) => setFiles([...(event.target.files ?? [])])}
          />
        </label>
        <label className={styles.completionField}>
          <span>Links, one per line (up to {MAX_LINKS})</span>
          <textarea
            rows={3}
            placeholder="https://"
            value={linksText}
            onChange={(event) => setLinksText(event.target.value)}
          />
        </label>
        {problem && (
          <p className={styles.completionProblem} role="alert">
            {problem}
          </p>
        )}
      </div>
    </Drawer>
  )
}

/** What the employee can do about one goal or task, given where it has got to. */
export const CompletionAction: React.FC<{
  staffId: string
  itemType: CompletionRequest['itemType']
  itemId: string
  title: string
  request: CompletionRequest | undefined
  isComplete: boolean
  completedByName: string | null
  onChanged: (request: CompletionRequest | null) => void
}> = ({
  staffId,
  itemType,
  itemId,
  title,
  request,
  isComplete,
  completedByName,
  onChanged,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  if (isComplete) {
    return (
      <p className={styles.completionState}>
        Complete{completedByName ? `, marked by ${completedByName}` : ''}
      </p>
    )
  }

  const form = isFormOpen && (
    <RequestForm
      staffId={staffId}
      itemType={itemType}
      itemId={itemId}
      title={title}
      onClose={() => setIsFormOpen(false)}
      onSubmitted={onChanged}
    />
  )

  if (request?.status === 'pending') {
    const withdraw = async () => {
      setIsWithdrawing(true)
      try {
        await withdrawCompletionRequest(staffId, request.id)
        onChanged(null)
      } catch (err) {
        notify('error', getErrorMessage(err, 'Could not withdraw this'))
      } finally {
        setIsWithdrawing(false)
      }
    }
    return (
      <div className={styles.completion}>
        <p className={styles.completionState}>Waiting for review</p>
        <p className={styles.muted}>{request.summary}</p>
        <EvidenceList
          request={request}
          onDownload={(file) => {
            downloadMyEvidence(staffId, request.id, file).catch(
              (err: unknown) =>
                notify(
                  'error',
                  getErrorMessage(err, 'Could not download this file'),
                ),
            )
          }}
        />
        <Button
          size="sm"
          type="button"
          variant="outline"
          loading={isWithdrawing}
          onClick={() => void withdraw()}>
          Withdraw
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.completion}>
      {request?.status === 'returned' && (
        <p className={styles.completionProblem}>
          Sent back
          {request.reviewedByName ? ` by ${request.reviewedByName}` : ''}
          {request.reviewNote ? `: ${request.reviewNote}` : ''}
        </p>
      )}
      <Button
        size="sm"
        type="button"
        variant="outline"
        onClick={() => setIsFormOpen(true)}>
        {request?.status === 'returned' ? 'Send again' : 'Request completion'}
      </Button>
      {form}
    </div>
  )
}
