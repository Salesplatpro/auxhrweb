import React, { useState } from 'react'
import { LuArrowRight, LuUserX } from 'react-icons/lu'

import { ConfirmDialog } from '@/components/feedback'
import { CheckBox } from '@/components/forms/CheckBox'
import { TextArea } from '@/components/forms/TextArea'
import { IconBadge } from '@/components/ui/IconBadge'
import {
  advanceApplication,
  updateApplicationStatus,
} from '@/features/applications/services/applicationService'
import { getErrorMessage } from '@/utils/getErrorMessage'
import type { NextStep } from '@/utils/recruiterJobPostsTypes'
import { notify } from '@/utils/toastNotifications'

import styles from './CandidatePanel.module.scss'

const EMAIL_MAX = 2000

const NEXT_STEP_LABEL: Record<NextStep, string> = {
  ai_interview: 'Recorded AI interview',
  shortlisted: 'Shortlisted',
}

type Candidate = {
  applicationId: string
  firstName: string
  fullName: string
}

type DecisionModalProps = Candidate & {
  open: boolean
  onCancel: () => void
  onDone: () => void | Promise<void>
}

export const MoveForwardModal = ({
  open,
  applicationId,
  firstName,
  fullName,
  nextStep,
  onCancel,
  onDone,
}: DecisionModalProps & { nextStep: NextStep }) => {
  const [sendInvite, setSendInvite] = useState(true)
  const [saving, setSaving] = useState(false)
  const nextLabel = NEXT_STEP_LABEL[nextStep]

  const confirm = async () => {
    setSaving(true)
    try {
      const result = await advanceApplication(applicationId, sendInvite)
      if (result.interview === 'failed') {
        notify(
          'warning',
          `${fullName} is shortlisted, but the interview questions couldn't be written`,
          {
            description: 'Try Move forward again in a few minutes.',
            autoClose: 5000,
          },
        )
      } else {
        notify(
          'success',
          `${fullName} moved to ${NEXT_STEP_LABEL[result.nextStep]}`,
          {
            description:
              result.interview === 'invited'
                ? `We emailed ${firstName} the interview invite.`
                : undefined,
            autoClose: 4000,
          },
        )
      }
      await onDone()
    } catch (err) {
      notify('error', getErrorMessage(err, `Couldn't move ${fullName} forward`))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      variant="ink"
      icon={<IconBadge icon={<LuArrowRight />} tone="violet" size="lg" />}
      title={`Move ${fullName} forward?`}
      description="They move to the next step of this job."
      confirmLabel="Move forward"
      isConfirming={saving}
      onConfirm={() => void confirm()}
      onCancel={onCancel}>
      <div className={styles.nextStep}>
        <p>
          <LuArrowRight aria-hidden /> Next step: <strong>{nextLabel}</strong>
        </p>
        {nextStep === 'ai_interview' && (
          <CheckBox
            name="send-interview-invite"
            checked={sendInvite}
            label={`Email ${firstName} the interview invite now`}
            onChange={(event) => setSendInvite(event.target.checked)}
          />
        )}
      </div>
    </ConfirmDialog>
  )
}

export const RejectModal = ({
  open,
  applicationId,
  firstName,
  fullName,
  jobTitle,
  companyName,
  senderName,
  onCancel,
  onDone,
}: DecisionModalProps & {
  jobTitle: string
  companyName?: string
  senderName?: string
}) => {
  const [send, setSend] = useState(true)
  const [body, setBody] = useState(
    () =>
      `Hi ${firstName}, thank you for applying for ${jobTitle}${
        companyName ? ` at ${companyName}` : ''
      }. We have decided not to move forward with your application this time. We wish you all the best.${
        senderName ? ` ${senderName}` : ''
      }`,
  )
  const [saving, setSaving] = useState(false)

  const confirm = async () => {
    if (send && !body.trim()) {
      notify('error', 'Write the email, or untick Send this email')
      return
    }
    setSaving(true)
    try {
      await updateApplicationStatus(applicationId, 'rejected', {
        send,
        body: send ? body.trim() : '',
      })
      notify('success', `${fullName} was rejected`, {
        description: send ? `We emailed ${firstName}.` : undefined,
      })
      await onDone()
    } catch (err) {
      notify('error', getErrorMessage(err, `Couldn't reject ${fullName}`))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      variant="danger"
      icon={<IconBadge icon={<LuUserX />} tone="danger" size="lg" />}
      title={`Reject ${fullName}?`}
      description={`They'll be moved to Rejected for ${jobTitle}.`}
      confirmLabel={send ? 'Reject and send' : 'Reject'}
      isConfirming={saving}
      onConfirm={() => void confirm()}
      onCancel={onCancel}>
      <TextArea
        title={`Email ${firstName} (you can edit it)`}
        name="rejection-email"
        value={body}
        rows={5}
        maxLength={EMAIL_MAX}
        disabled={!send}
        onChange={(event) => setBody(event.target.value)}
      />
      <CheckBox
        name="send-rejection-email"
        checked={send}
        label="Send this email"
        onChange={(event) => setSend(event.target.checked)}
      />
    </ConfirmDialog>
  )
}
