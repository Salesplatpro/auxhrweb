import 'react-responsive-modal/styles.css'

import React, { useCallback, useEffect, useId, useState } from 'react'
import { FaCheck } from 'react-icons/fa6'
import { Modal } from 'react-responsive-modal'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { STAGE_LABEL } from '@/features/admin/applicationFollowUp'
import {
  draftApplicationFollowUpEmail,
  fetchApplicationFollowUp,
  sendApplicationFollowUpEmail,
} from '@/features/admin/services/adminService'
import { ApplicationFollowUp } from '@/features/admin/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from '../Onboarding/Onboarding.module.scss'

const statusOf = (err: unknown) =>
  (err as { response?: { status?: number } })?.response?.status

type ApplicationFollowUpDrawerProps = {
  applicationId: string | null
  talentName: string
  onClose: () => void
  /** Called after an email is sent, so the list can refresh its row. */
  onSent?: () => void
}

export const ApplicationFollowUpDrawer = ({
  applicationId,
  talentName,
  onClose,
  onSent,
}: ApplicationFollowUpDrawerProps) => {
  const titleId = useId()
  const subjectId = useId()
  const bodyId = useId()
  const [followUp, setFollowUp] = useState<ApplicationFollowUp | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirmResend, setConfirmResend] = useState(false)

  const load = useCallback(async () => {
    if (!applicationId) return
    setLoading(true)
    setLoadError(null)
    try {
      setFollowUp(await fetchApplicationFollowUp(applicationId))
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Could not load this application.'))
    } finally {
      setLoading(false)
    }
  }, [applicationId])

  useEffect(() => {
    setFollowUp(null)
    setSubject('')
    setBody('')
    void load()
  }, [load])

  const writeWithAi = async () => {
    if (!applicationId) return
    setDrafting(true)
    try {
      const draft = await draftApplicationFollowUpEmail(applicationId)
      setSubject(draft.subject)
      setBody(draft.body)
    } catch (err) {
      notify('error', getErrorMessage(err, 'The AI could not write an email.'))
    } finally {
      setDrafting(false)
    }
  }

  const send = async (confirm = false) => {
    if (!applicationId) return
    setSending(true)
    try {
      const email = await sendApplicationFollowUpEmail(applicationId, {
        subject: subject.trim(),
        body: body.trim(),
        ...(confirm ? { confirm: true } : {}),
      })
      setFollowUp((current) =>
        current
          ? {
              ...current,
              followUp: 'emailed',
              emails: [email, ...current.emails],
            }
          : current,
      )
      setSubject('')
      setBody('')
      setConfirmResend(false)
      notify('success', `Follow-up sent to ${talentName}.`)
      onSent?.()
    } catch (err) {
      if (statusOf(err) === 409) {
        setConfirmResend(true)
        return
      }
      setConfirmResend(false)
      notify('error', getErrorMessage(err, 'The email could not be sent.'))
      void load()
    } finally {
      setSending(false)
    }
  }

  const canSend = !!subject.trim() && !!body.trim() && !sending

  return (
    <Modal
      open={!!applicationId}
      onClose={onClose}
      ariaLabelledby={titleId}
      classNames={{
        overlay: 'dashboard-modal-overlay',
        modalContainer: styles.drawerContainer,
        modal: styles.drawer,
      }}>
      <h2 id={titleId} className={styles.drawerTitle}>
        Follow up with {talentName}
      </h2>

      {loading && !followUp && (
        <div className={styles.center}>
          <Spinner />
        </div>
      )}

      {loadError && (
        <div className={styles.errorBox} role="alert">
          <p>{loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}>
            Try again
          </Button>
        </div>
      )}

      {followUp && (
        <>
          <section className={styles.block} aria-label="Application progress">
            <p className={styles.blockTitle}>
              {followUp.stuck
                ? `Stuck in: ${followUp.jobTitle}`
                : `Progressed: ${followUp.jobTitle}`}
            </p>
            {followUp.companyName && (
              <p className={styles.hint}>{followUp.companyName}</p>
            )}
            <ol className={styles.steps}>
              {followUp.steps.map((step) => {
                const state = step.done
                  ? 'done'
                  : step.current
                  ? 'current'
                  : 'todo'
                return (
                  <li
                    key={step.key}
                    className={`${styles.step} ${styles[`step_${state}`]}`}>
                    <span className={styles.stepMark} aria-hidden>
                      {step.done ? <FaCheck /> : null}
                    </span>
                    <span>
                      {step.label}
                      <span className={styles.srOnly}>
                        {state === 'done'
                          ? ' (done)'
                          : state === 'current'
                          ? ' (stuck here)'
                          : ' (not yet)'}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ol>
            {followUp.nextSteps && (
              <p className={styles.hint}>
                The email links to “{followUp.nextSteps.ctaLabel}”.
              </p>
            )}
          </section>

          <section className={styles.block} aria-label="Follow-ups sent">
            <p className={styles.blockTitle}>Follow-ups sent</p>
            {followUp.emails.length === 0 ? (
              <p className={styles.muted}>No follow-ups sent yet.</p>
            ) : (
              <ul className={styles.history}>
                {followUp.emails.map((email) => (
                  <li key={email.id} className={styles.historyItem}>
                    <details>
                      <summary className={styles.historySummary}>
                        <span className={styles.historySubject}>
                          Step {email.step}: {email.subject}
                        </span>
                        <span className={styles.historyMeta}>
                          <time dateTime={email.createdAt}>
                            {new Date(email.createdAt).toLocaleString()}
                          </time>
                          <span
                            className={`${styles.badge} ${
                              email.status === 'sent'
                                ? styles.success
                                : styles.danger
                            }`}>
                            {email.status === 'sent' ? 'Sent' : 'Failed'}
                          </span>
                          {email.source === 'auto' && (
                            <span className={styles.badge}>Automatic</span>
                          )}
                        </span>
                      </summary>
                      <p className={styles.historyBody}>{email.body}</p>
                      {email.error && (
                        <p className={styles.historyError}>
                          Error: {email.error}
                        </p>
                      )}
                      <p className={styles.hint}>
                        Sent at step: {STAGE_LABEL[email.stage]}
                      </p>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {followUp.stuck && (
            <section className={styles.block} aria-label="Write an email">
              <div className={styles.composeHeader}>
                <p className={styles.blockTitle}>
                  {followUp.emails.length > 0
                    ? `Send follow-up #${followUp.emails.length + 1}`
                    : 'Send an email'}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={drafting}
                  onClick={() => void writeWithAi()}>
                  {subject || body ? 'Regenerate' : 'Write email with AI'}
                </Button>
              </div>
              <label htmlFor={subjectId} className={styles.label}>
                Subject
              </label>
              <input
                id={subjectId}
                className={styles.input}
                value={subject}
                maxLength={150}
                onChange={(event) => setSubject(event.target.value)}
              />
              <label htmlFor={bodyId} className={styles.label}>
                Message
              </label>
              <textarea
                id={bodyId}
                className={styles.textarea}
                value={body}
                maxLength={5000}
                onChange={(event) => setBody(event.target.value)}
              />
              <p className={styles.hint}>
                A button to the right page is added under your message.
              </p>
              <div className={styles.composeActions}>
                <Button
                  type="button"
                  variant="primary"
                  loading={sending}
                  disabled={!canSend}
                  onClick={() => void send()}>
                  Send email
                </Button>
              </div>
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmResend}
        title="Send another email?"
        message={`${talentName} was emailed about this application less than 24 hours ago. Send this one anyway?`}
        confirmLabel="Send anyway"
        isConfirming={sending}
        onConfirm={() => void send(true)}
        onCancel={() => setConfirmResend(false)}
      />
    </Modal>
  )
}
