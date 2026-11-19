import React, { useEffect, useState } from 'react'
import { Modal } from 'react-responsive-modal'

import { Alert } from '@/components/feedback/Alert'
import { Button } from '@/components/ui'
import { sendMessage } from '@/features/messaging/services/messagingService'
import type { TalentSearchResult } from '@/features/scout/types'
import { useMessageScoutCandidateMutation } from '@/redux/api/recruiter'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './MessageCandidateModal.module.scss'

export type MessageCandidateModalProps = {
  target: TalentSearchResult | null
  onClose: () => void
}

/** A first message grounded in what the search actually found, ready to edit. */
const openingDraft = (target: TalentSearchResult): string => {
  const firstName = target.name.split(' ')[0] ?? 'there'
  const evidence = target.strengths?.[0]
  return [
    `Hi ${firstName},`,
    '',
    evidence
      ? `Your background stood out to me — ${evidence
          .charAt(0)
          .toLowerCase()}${evidence.slice(1)}`
      : 'Your background stood out to me while I was looking for someone for a role on my team.',
    '',
    'Would you be open to a short chat about a role I am hiring for?',
  ].join('\n')
}

export const MessageCandidateModal = ({
  target,
  onClose,
}: MessageCandidateModalProps) => {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messageCandidate] = useMessageScoutCandidateMutation()

  useEffect(() => {
    setContent(target ? openingDraft(target) : '')
  }, [target])

  if (!target) return null

  const submit = async () => {
    const body = content.trim()
    if (!body) return

    setIsSending(true)
    try {
      if (target.source === 'registered') {
        await sendMessage({ content: body, recipient: target.id })
      } else {
        // A sourced candidate has no account of their own, so this goes through the
        // scout endpoint, which resolves them to a talent by email (and tells us
        // what to do instead when there is no account yet).
        await messageCandidate({
          candidateId: target.id,
          content: body,
        }).unwrap()
      }
      notify('success', `Message sent to ${target.name}`)
      onClose()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not send that message'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      center
      classNames={{ overlay: 'dashboard-modal-overlay', modal: styles.modal }}>
      <h2 className={styles.title}>Message {target.name}</h2>
      <p className={styles.subtitle}>
        We&apos;ve drafted an opener from what their CV says. Edit it before you
        send — a message that sounds like you gets far better replies.
      </p>

      {target.source === 'sourced' && (
        <Alert variant="info">
          This candidate was sourced from a CV. If they haven&apos;t signed up
          yet we&apos;ll tell you, so you can email them instead.
        </Alert>
      )}

      <label className={styles.label} htmlFor="scout-message">
        Your message
      </label>
      <textarea
        id="scout-message"
        className={styles.textarea}
        value={content}
        rows={10}
        onChange={(event) => setContent(event.target.value)}
      />

      <div className={styles.actions}>
        <Button variant="outline" onClick={onClose} disabled={isSending}>
          Cancel
        </Button>
        <Button onClick={submit} loading={isSending} disabled={!content.trim()}>
          Send message
        </Button>
      </div>
    </Modal>
  )
}
