import 'react-responsive-modal/styles.css'

import React, { useState } from 'react'
import { Modal } from 'react-responsive-modal'

import { Alert } from '@/components/feedback/Alert'
import { Button } from '@/components/ui/Button'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { StaffMember } from '@/features/people/types'
import { todayDateOnly } from '@/features/people/utils/formatDate'

import styles from './EndEmploymentDialog.module.scss'

interface EndFormProps {
  staff: StaffMember
  isEnding: boolean
  onConfirm: (endDate: string) => void
  onCancel: () => void
}

const EndForm: React.FC<EndFormProps> = ({
  staff,
  isEnding,
  onConfirm,
  onCancel,
}) => {
  const today = todayDateOnly()
  const [endDate, setEndDate] = useState(today)
  const invalid = !endDate || endDate < staff.startDate || endDate > today

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>End employment for {staff.fullName}?</h3>
      <Alert variant="warning">
        Their record stays for your history, but it becomes read-only and any
        unused invite stops working.
      </Alert>
      <label className={styles.field}>
        <span className={styles.label}>Last day of employment</span>
        <input
          type="date"
          className={styles.input}
          value={endDate}
          min={staff.startDate}
          max={today}
          onChange={(event) => setEndDate(event.target.value)}
        />
        {invalid && (
          <span className={styles.error} role="alert">
            Pick a date between their start date and today.
          </span>
        )}
      </label>
      <div className={styles.actions}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isEnding}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          className={styles.dangerButton}
          loading={isEnding}
          disabled={invalid}
          onClick={() => onConfirm(endDate)}>
          End employment
        </Button>
      </div>
    </div>
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

  const handleConfirm = async (endDate: string) => {
    if (!staff) return
    if (await endEmployment(staff.id, endDate)) onClose()
  }

  return (
    <Modal
      open={!!staff}
      onClose={onClose}
      center
      classNames={{ overlay: 'dashboard-modal-overlay' }}>
      {staff && (
        <EndForm
          staff={staff}
          isEnding={isSaving}
          onConfirm={(endDate) => void handleConfirm(endDate)}
          onCancel={onClose}
        />
      )}
    </Modal>
  )
}
