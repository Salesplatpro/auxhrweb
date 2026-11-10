import React, { useEffect, useState } from 'react'

import { Select } from '@/components/forms/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { useUpdateJobMutation } from '@/redux/api/recruiter'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import {
  getStatusBadge,
  getStatusLabel,
  JOB_STATUS_OPTIONS,
  statusSavedMessage,
} from '../getJobStatus'
import styles from './JobStatusControl.module.scss'

type JobStatusControlProps = {
  jobId: string
  status: string
  aiConfigId?: string | null
}

export const JobStatusControl = ({
  jobId,
  status,
  aiConfigId,
}: JobStatusControlProps) => {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [updateJob, { isLoading: isUpdatingStatus }] = useUpdateJobMutation()

  const canActivate = !!aiConfigId
  const statusOptions = canActivate
    ? JOB_STATUS_OPTIONS
    : JOB_STATUS_OPTIONS.filter((option) => option.value !== 'active')

  // `status` comes from a query on a different RTK Query API slice than the one
  // `updateJob` invalidates, so it won't refresh on its own after a save —
  // `currentStatus` is the optimistic source of truth the Select renders.
  useEffect(() => {
    setCurrentStatus(status)
  }, [status])

  const handleStatusChange = async (nextStatus: string) => {
    if (nextStatus === currentStatus) return
    const previousStatus = currentStatus
    setCurrentStatus(nextStatus)
    try {
      const response = await updateJob({
        jobId,
        data: { status: nextStatus },
      }).unwrap()
      const savedStatus: string = response?.data?.job?.status ?? nextStatus
      setCurrentStatus(savedStatus)
      notify('success', statusSavedMessage(savedStatus))
    } catch (err) {
      setCurrentStatus(previousStatus)
      notify('error', getErrorMessage(err, 'Failed to update job status'))
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.statusRow}>
        <div className={styles.statusField}>
          <p className={styles.label}>Job Status</p>
          <Select
            options={statusOptions}
            value={currentStatus}
            onChange={(value) => void handleStatusChange(value)}
            disabled={isUpdatingStatus}
          />
          {!canActivate && currentStatus !== 'active' && (
            <p className={styles.aiConfigNote}>
              Add an AI screening configuration before activating this job.
            </p>
          )}
        </div>
        <StatusBadge
          status={getStatusLabel(currentStatus)}
          {...getStatusBadge(currentStatus)}
        />
      </div>
    </div>
  )
}
