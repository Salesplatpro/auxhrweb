import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/feedback/Alert'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { TextArea } from '@/components/forms/TextArea'
import { PRE_ASSESSMENT_PATH } from '@/features/pre-assessment/constants'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { jobPlace } from '@/features/talent-applications/format'
import { STEP_TITLE } from '@/features/talent-applications/steps'
import { useApplyToJobMutation } from '@/redux/api/talent'
import { getErrorCode, getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './ApplyModal.module.scss'
import type { TalentJob } from './TalentJobDetail'

const NOTE_LIMIT = 1000
const PROFILE_PATH = '/talentDashboard/talentProfile'

type ApplyModalProps = {
  open: boolean
  job: TalentJob
  onClose: () => void
  onApplied: (applicationId: string) => void
}

const updatedOn = (date?: string | null) =>
  date
    ? new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })
    : null

export const ApplyModal = ({
  open,
  job,
  onClose,
  onApplied,
}: ApplyModalProps) => {
  const { profile } = useProfile()
  const [note, setNote] = useState('')
  const [needsAssessment, setNeedsAssessment] = useState(false)
  const [applyToJob, { isLoading }] = useApplyToJobMutation()
  const company = job.organization?.name ?? 'the company'
  const cvName = profile?.cvFileName
  // The skills test is taken before applying, so the next step is the first test after it.
  const first = job.screening.find(
    (step) => step.key !== 'skills_test' && step.minutes > 0,
  )
  const nextStep = first
    ? `After you apply you'll take a ${first.minutes}-minute ${STEP_TITLE[
        first.key
      ].toLowerCase()}. `
    : ''

  const submit = async () => {
    if (!cvName || needsAssessment) return
    try {
      const result = await applyToJob({
        jobId: job.id,
        note: note.trim() || undefined,
      }).unwrap()
      onApplied(result.data.application.id)
    } catch (error) {
      if (getErrorCode(error) === 'PRE_ASSESSMENT_REQUIRED') {
        setNeedsAssessment(true)
        return
      }
      notify(
        'error',
        getErrorMessage(error, 'We couldn’t send your application. Try again.'),
      )
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title={`Apply to ${job.role.name}`}
      description={[company, jobPlace(job)].filter(Boolean).join(' · ')}
      confirmLabel="Submit application"
      variant="gradient"
      isConfirming={isLoading}
      onConfirm={() => void submit()}
      onCancel={onClose}>
      <div className={styles.field}>
        <span className={styles.label}>CV</span>
        {cvName ? (
          <div className={styles.cv}>
            <span className={styles.cvType} aria-hidden>
              {cvName.split('.').pop()?.toUpperCase()}
            </span>
            <span className={styles.cvText}>
              <span className={styles.cvName}>{cvName}</span>
              <span className={styles.cvMeta}>
                From your profile
                {updatedOn(profile?.cvUploadedAt) &&
                  ` · updated ${updatedOn(profile?.cvUploadedAt)}`}
              </span>
            </span>
            <Link to={PROFILE_PATH} className={styles.change}>
              Change
            </Link>
          </div>
        ) : (
          <p className={styles.cvMissing}>
            Add your CV to your <Link to={PROFILE_PATH}>profile</Link> before
            applying.
          </p>
        )}
      </div>
      <TextArea
        title={`Short note to ${company} (optional)`}
        name="note"
        value={note}
        rows={4}
        maxLength={NOTE_LIMIT}
        onChange={(event) => setNote(event.target.value)}
      />
      {needsAssessment ? (
        <Alert variant="warning">
          Take your <Link to={PRE_ASSESSMENT_PATH}>pre-assessment</Link> first.
          You only take it once to apply to any job.
        </Alert>
      ) : (
        <Alert variant="info">
          {nextStep}Your answers and CV are shared only with {company}.
        </Alert>
      )}
    </ConfirmDialog>
  )
}
