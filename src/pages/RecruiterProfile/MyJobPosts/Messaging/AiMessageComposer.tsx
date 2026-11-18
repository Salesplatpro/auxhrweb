import React, { useEffect, useState } from 'react'
import Modal from 'react-responsive-modal'

import { CheckBox } from '@/components/forms/CheckBox'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import {
  ApplicantMessageDraft,
  draftApplicantMessages,
} from '@/features/applications/services/applicationService'
import { useBroadcastMessage } from '@/features/messaging/hooks/useBroadcastMessage'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './AiMessageComposer.module.scss'

export interface AiMessageComposerTarget {
  id: string
  talentId: string
  talentName: string
}

interface AiMessageComposerProps {
  open: boolean
  onClose: () => void
  jobId: string
  targets: AiMessageComposerTarget[]
  onSent?: () => void
}

type EditableDraft = ApplicantMessageDraft & { included: boolean }

// AI drafts one personalized message per candidate — grounded in their own
// match evidence — the recruiter reviews and edits each before anything
// sends, then chooses to also email alongside the in-app message. Mirrors
// the admin onboarding follow-up's draft-then-send shape, adapted for
// multiple recipients at once.
export const AiMessageComposer = ({
  open,
  onClose,
  jobId,
  targets,
  onSent,
}: AiMessageComposerProps) => {
  const [intent, setIntent] = useState('')
  const [isDrafting, setIsDrafting] = useState(false)
  const [drafts, setDrafts] = useState<EditableDraft[] | null>(null)
  const [sendEmail, setSendEmail] = useState(true)
  const { sendBroadcast, isBroadcasting } = useBroadcastMessage()

  useEffect(() => {
    if (!open) {
      setIntent('')
      setDrafts(null)
    }
  }, [open])

  const handleDraft = async () => {
    setIsDrafting(true)
    try {
      const result = await draftApplicantMessages(
        jobId,
        targets.map((t) => t.id),
        intent.trim() || undefined,
      )
      setDrafts(result.map((draft) => ({ ...draft, included: !draft.error })))
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to draft messages'), {
        autoClose: 2500,
      })
    } finally {
      setIsDrafting(false)
    }
  }

  const updateDraft = (
    applicationId: string,
    patch: Partial<EditableDraft>,
  ) => {
    setDrafts(
      (prev) =>
        prev?.map((draft) =>
          draft.applicationId === applicationId
            ? { ...draft, ...patch }
            : draft,
        ) ?? null,
    )
  }

  const includedDrafts = (drafts ?? []).filter(
    (draft) => draft.included && draft.body?.trim(),
  )

  const handleSend = async () => {
    if (!drafts || includedDrafts.length === 0) return
    const firstTarget = targets[0]
    if (!firstTarget) return

    try {
      const result = await sendBroadcast({
        application: firstTarget.id,
        messages: includedDrafts.map((draft) => ({
          applicationId: draft.applicationId,
          subject: draft.subject,
          content: draft.body ?? '',
        })),
        sendEmail,
      })
      notify(
        'success',
        `Sent to ${result.sent} talent${result.sent === 1 ? '' : 's'}${
          sendEmail ? `, emailed ${result.emailed}` : ''
        }`,
        { autoClose: 2500 },
      )
      onSent?.()
      onClose()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to send messages'), {
        autoClose: 2500,
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      center
      classNames={{ overlay: 'dashboard-modal-overlay', modal: styles.modal }}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          Message {targets.length} talent{targets.length === 1 ? '' : 's'} with
          AI
        </h2>
        <p className={styles.subtitle}>
          AI drafts a separate message for each candidate, grounded in their own
          AI match evidence — review and edit before sending.
        </p>

        {!drafts && (
          <div className={styles.intentRow}>
            <div className={styles.intentField}>
              <label className={styles.label} htmlFor="ai-message-intent">
                What should this message do? (optional)
              </label>
              <input
                id="ai-message-intent"
                className={styles.input}
                placeholder="e.g. Invite to a first interview next week"
                value={intent}
                onChange={(event) => setIntent(event.target.value)}
              />
            </div>
            <Button
              variant="primary"
              loading={isDrafting}
              onClick={handleDraft}>
              Draft with AI
            </Button>
          </div>
        )}

        {isDrafting && !drafts && (
          <div className={styles.loading}>
            <Spinner />
          </div>
        )}

        {drafts && (
          <>
            <div className={styles.draftList}>
              {drafts.map((draft) => (
                <div key={draft.applicationId} className={styles.draftCard}>
                  <div className={styles.draftHeader}>
                    <CheckBox
                      name={`include-${draft.applicationId}`}
                      label={draft.talentName}
                      checked={draft.included}
                      onChange={(event) =>
                        updateDraft(draft.applicationId, {
                          included: event.target.checked,
                        })
                      }
                    />
                    {draft.error && (
                      <span className={styles.draftError}>{draft.error}</span>
                    )}
                  </div>
                  <input
                    className={styles.subjectInput}
                    placeholder="Subject"
                    value={draft.subject ?? ''}
                    onChange={(event) =>
                      updateDraft(draft.applicationId, {
                        subject: event.target.value,
                      })
                    }
                  />
                  <textarea
                    className={styles.bodyTextarea}
                    placeholder="Message"
                    value={draft.body ?? ''}
                    onChange={(event) =>
                      updateDraft(draft.applicationId, {
                        body: event.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div className={styles.emailToggle}>
              <CheckBox
                name="send-email"
                label="Also email each candidate (not just in-app)"
                checked={sendEmail}
                onChange={(event) => setSendEmail(event.target.checked)}
              />
            </div>
          </>
        )}

        <div className={styles.actions}>
          <span className={styles.summary}>
            {drafts
              ? `${includedDrafts.length} of ${drafts.length} ready to send`
              : ''}
          </span>
          <div className={styles.actionButtons}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {drafts && (
              <Button
                variant="primary"
                loading={isBroadcasting}
                disabled={includedDrafts.length === 0}
                onClick={handleSend}>
                Send to {includedDrafts.length}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
