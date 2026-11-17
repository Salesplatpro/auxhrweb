import React, { useState } from 'react'
import { LuUserX } from 'react-icons/lu'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Select } from '@/components/forms/Select'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { END_REASONS, EndReason, StaffMember } from '@/features/people/types'
import { toDateOnly, todayDateOnly } from '@/features/people/utils/formatDate'
import { nameParts } from '@/features/people/utils/nameParts'

import styles from './EndEmploymentDialog.module.scss'

const oneYearFromToday = () => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return toDateOnly(date)
}

interface EndFormProps {
  staff: StaffMember
  isEnding: boolean
  onConfirm: (endDate: string, reason: EndReason | null) => void
  onCancel: () => void
}

const EndForm: React.FC<EndFormProps> = ({
  staff,
  isEnding,
  onConfirm,
  onCancel,
}) => {
  const today = todayDateOnly()
  const latest = oneYearFromToday()
  const [endDate, setEndDate] = useState(staff.endingOn ?? today)
  const [reason, setReason] = useState<EndReason | ''>(staff.endReason ?? '')
  const [touched, setTouched] = useState(false)
  const invalid = !endDate || endDate < staff.startDate || endDate > latest
  const name = nameParts(staff.fullName).firstName || staff.fullName

  const confirm = () => {
    setTouched(true)
    if (invalid) return
    onConfirm(endDate, reason || null)
  }

  return (
    <ConfirmDialog
      open
      variant="danger"
      icon={
        <span className={styles.icon} aria-hidden>
          <LuUserX />
        </span>
      }
      title={`End ${staff.fullName}'s employment?`}
      description={`${name}'s status changes to Ended on the date below. You can still see their records.`}
      confirmLabel="End employment"
      isConfirming={isEnding}
      onConfirm={confirm}
      onCancel={onCancel}>
      <label className={styles.field}>
        <span className={styles.label}>Last working day</span>
        <input
          type="date"
          className={styles.input}
          value={endDate}
          min={staff.startDate}
          max={latest}
          onChange={(event) => setEndDate(event.target.value)}
        />
        {touched && invalid ? (
          <span className={styles.error} role="alert">
            Pick a date between their start date and a year from today.
          </span>
        ) : (
          endDate > today && (
            <span className={styles.hint}>
              {name} keeps access to My work until this date.
            </span>
          )
        )}
      </label>
      <Select
        name="endReason"
        label="Reason (optional, only HR sees it)"
        placeholder="Choose a reason"
        options={END_REASONS}
        value={reason}
        onChange={(value) => setReason(value as EndReason)}
      />
    </ConfirmDialog>
  )
}

interface EndEmploymentDialogProps {
  staff: StaffMember | null
  organizationId: string | null
  onClose: () => void
}

export const EndEmploymentDialog: React.FC<EndEmploymentDialogProps> = ({
  staff,
  organizationId,
  onClose,
}) => {
  const { endEmployment, isSaving } = useStaffActions(organizationId)

  if (!staff) return null

  const handleConfirm = async (endDate: string, reason: EndReason | null) => {
    if (await endEmployment(staff.id, endDate, reason)) onClose()
  }

  return (
    <EndForm
      key={staff.id}
      staff={staff}
      isEnding={isSaving}
      onConfirm={(endDate, reason) => void handleConfirm(endDate, reason)}
      onCancel={onClose}
    />
  )
}
