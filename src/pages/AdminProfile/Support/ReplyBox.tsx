import axios from 'axios'
import cn from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { HiOutlinePaperAirplane, HiOutlineSparkles } from 'react-icons/hi2'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { SUPPORT_MESSAGE_MAX_LENGTH } from '@/features/support/constants'
import {
  draftSupportReplyWithAi,
  saveSupportDraft,
  sendSupportReply,
} from '@/features/support/services/supportService'
import { SupportRequestWithUser } from '@/features/support/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './Support.module.scss'

export const AUTOSAVE_MS = 1500

const isConflict = (err: unknown) =>
  axios.isAxiosError(err) && err.response?.status === 409

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const SAVE_LABEL: Record<SaveState, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Draft saved',
  error: 'Couldn’t save draft',
}

interface ReplyBoxProps {
  request: SupportRequestWithUser
  stillDrafting: boolean
  onRequestChange: (request: SupportRequestWithUser) => void
  onSent: () => Promise<unknown>
}

const AiNote = ({ note }: { note: string | null }) =>
  note ? (
    <p className={styles.aiNote}>
      <span className={styles.aiNoteLabel}>
        AI note, written from the user’s message:
      </span>{' '}
      {note}
    </p>
  ) : null

const AiStrip = ({
  request,
  stillDrafting,
}: {
  request: SupportRequestWithUser
  stillDrafting: boolean
}) => {
  switch (request.aiDraftStatus) {
    case 'pending':
      return (
        <div
          className={cn(styles.aiStrip, styles.aiStripWorking)}
          role="status">
          <p className={styles.aiTitle}>
            {stillDrafting
              ? 'Still drafting. Refresh the page later.'
              : 'AI is drafting a reply…'}
          </p>
          {request.aiDraftAttempts > 0 && request.aiDraftLastError && (
            <p className={styles.aiNote}>
              Retrying after an error: {request.aiDraftLastError}
            </p>
          )}
        </div>
      )
    case 'drafted':
      return (
        <div className={cn(styles.aiStrip, styles.aiStripReady)} role="status">
          <p className={styles.aiTitle}>
            AI draft ready: review it before sending.
          </p>
          <AiNote note={request.aiNote} />
        </div>
      )
    case 'complex':
      return (
        <div
          className={cn(styles.aiStrip, styles.aiStripComplex)}
          role="status">
          <p className={styles.aiTitle}>
            Left for you: this one needs your judgement.
          </p>
          <AiNote note={request.aiNote} />
        </div>
      )
    case 'failed':
      return (
        <div className={cn(styles.aiStrip, styles.aiStripFailed)} role="status">
          <p className={styles.aiTitle}>
            The AI couldn’t draft this. Use Draft with AI to try again.
          </p>
        </div>
      )
    default:
      return null
  }
}

/**
 * The reply box. Drafts save on their own: one save at a time, the newest text next, and
 * nothing after Send. The AI's suggestion never replaces what the admin has typed.
 */
export const ReplyBox = ({
  request,
  stillDrafting,
  onRequestChange,
  onSent,
}: ReplyBoxProps) => {
  const [text, setText] = useState(request.draftReply ?? request.aiDraft ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [drafting, setDrafting] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [sending, setSending] = useState(false)

  const textRef = useRef(text)
  const touched = useRef(Boolean(request.draftReply))
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlight = useRef(false)
  const queued = useRef<string | null>(null)
  const lastSaved = useRef(request.draftReply ?? '')
  const stopped = useRef(false)

  const save = async (value: string): Promise<void> => {
    if (stopped.current) return
    if (inFlight.current) {
      queued.current = value
      return
    }
    if (value === lastSaved.current) return
    inFlight.current = true
    setSaveState('saving')
    try {
      await saveSupportDraft(request.id, value)
      lastSaved.current = value
      if (!stopped.current) setSaveState('saved')
    } catch (err) {
      if (!stopped.current && !isConflict(err)) setSaveState('error')
    } finally {
      inFlight.current = false
      const next = queued.current
      queued.current = null
      if (next !== null) await save(next)
    }
  }

  const cancelTimer = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }

  const schedule = (value: string) => {
    cancelTimer()
    timer.current = setTimeout(() => {
      timer.current = null
      void save(value)
    }, AUTOSAVE_MS)
  }

  const flush = () => {
    if (!timer.current) return
    cancelTimer()
    void save(textRef.current)
  }

  const change = (value: string) => {
    textRef.current = value
    touched.current = true
    setText(value)
    schedule(value)
  }

  useEffect(() => () => flush(), [])

  useEffect(() => {
    if (request.aiDraft && !touched.current && !textRef.current.trim()) {
      textRef.current = request.aiDraft
      setText(request.aiDraft)
    }
  }, [request.aiDraft])

  const writeWithAi = async () => {
    setConfirmReplace(false)
    setDrafting(true)
    try {
      const updated = await draftSupportReplyWithAi(request.id)
      onRequestChange(updated)
      if (updated.aiDraft) change(updated.aiDraft)
    } catch (err) {
      notify(
        'error',
        getErrorMessage(
          err,
          'The AI couldn’t write a draft right now. Please try again.',
        ),
      )
    } finally {
      setDrafting(false)
    }
  }

  const send = async () => {
    const value = text.trim()
    if (!value || sending) return
    stopped.current = true
    cancelTimer()
    queued.current = null
    setSending(true)
    try {
      const updated = await sendSupportReply(request.id, value)
      onRequestChange(updated)
      if (updated.replyEmailStatus === 'failed') {
        notify(
          'warning',
          'Reply saved, but the email didn’t send. You can retry it.',
        )
      } else {
        notify('success', 'Reply sent')
      }
      await onSent()
    } catch (err) {
      if (isConflict(err)) {
        await onSent()
        return
      }
      stopped.current = false
      notify(
        'error',
        getErrorMessage(err, 'The reply didn’t send. Please try again.'),
      )
    } finally {
      setSending(false)
    }
  }

  const showUseAiDraft =
    !!request.aiDraft && text.trim() !== request.aiDraft.trim()
  const aiBusy = drafting || request.aiDraftBusy

  return (
    <form
      className={styles.replyBox}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void send()
      }}>
      <AiStrip request={request} stillDrafting={stillDrafting} />

      <label htmlFor="support-reply" className={styles.replyLabel}>
        Your reply to {request.user.firstName}
      </label>
      <textarea
        id="support-reply"
        className={styles.replyInput}
        rows={7}
        value={text}
        maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
        placeholder="Write your reply. It goes to them in the app and by email."
        onChange={(event) => change(event.target.value)}
        onBlur={flush}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            void send()
          }
        }}
      />

      <div className={styles.replyFooter}>
        <span
          className={cn(
            styles.saveState,
            saveState === 'error' && styles.saveError,
          )}
          aria-live="polite">
          {SAVE_LABEL[saveState]}
        </span>
        <div className={styles.replyActions}>
          {showUseAiDraft && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => change(request.aiDraft as string)}>
              Use AI draft
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={drafting}
            disabled={aiBusy || sending}
            icon={<HiOutlineSparkles size={16} />}
            onClick={() =>
              text.trim() ? setConfirmReplace(true) : void writeWithAi()
            }>
            Draft with AI
          </Button>
          <Button
            type="submit"
            size="sm"
            loading={sending}
            disabled={!text.trim()}
            icon={<HiOutlinePaperAirplane size={16} />}>
            Send reply
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReplace}
        title="Replace your reply?"
        message="The AI will write a new draft and it will replace what is in the reply box."
        confirmLabel="Replace it"
        onConfirm={() => void writeWithAi()}
        onCancel={() => setConfirmReplace(false)}
      />
    </form>
  )
}
