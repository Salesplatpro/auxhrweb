import React, { useState } from 'react'
import { HiOutlineEllipsisHorizontal } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'

import { ConfirmDialog } from '@/components/feedback'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { useUpdateJobMutation } from '@/redux/api/recruiter'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { RecruiterJob } from '@/utils/recruiterJobPostsTypes'
import { notify } from '@/utils/toastNotifications'

import { jobEditPath, jobTitle } from './jobRowFormat'
import styles from './JobRowMenu.module.scss'

type JobRowMenuProps = {
  job: RecruiterJob
  tourId?: string
}

export const JobRowMenu = ({ job, tourId }: JobRowMenuProps) => {
  const navigate = useNavigate()
  const [updateJob, { isLoading }] = useUpdateJobMutation()
  const [confirmClose, setConfirmClose] = useState(false)

  const closeJob = async () => {
    try {
      await updateJob({ jobId: job.id, data: { status: 'closed' } }).unwrap()
      notify('success', `${jobTitle(job)} is closed.`)
      setConfirmClose(false)
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not close the job.'))
    }
  }

  const items: DropdownItem[] = [
    {
      key: 'view',
      label: 'View job',
      onClick: () => navigate(`/recruiterDashboard/jobdetail/${job.id}`),
    },
    { key: 'edit', label: 'Edit', onClick: () => navigate(jobEditPath(job)) },
    ...(job.status === 'active'
      ? [{ key: 'close', label: 'Close', onClick: () => setConfirmClose(true) }]
      : []),
  ]

  return (
    <>
      <Dropdown
        align="right"
        items={items}
        trigger={
          <span className={styles.trigger} data-tour={tourId}>
            <HiOutlineEllipsisHorizontal size={20} aria-hidden />
            <span className={styles.srOnly}>Actions for {jobTitle(job)}</span>
          </span>
        }
      />
      <ConfirmDialog
        open={confirmClose}
        title={`Close ${jobTitle(job)}?`}
        message="Candidates can no longer apply, and current applicants are told the job has closed."
        confirmLabel="Close job"
        variant="danger"
        isConfirming={isLoading}
        onConfirm={() => void closeJob()}
        onCancel={() => setConfirmClose(false)}
      />
    </>
  )
}
