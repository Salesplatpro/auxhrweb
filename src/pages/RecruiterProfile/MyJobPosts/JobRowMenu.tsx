import React from 'react'
import { HiOutlineEllipsisHorizontal } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'

import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { RecruiterJob } from '@/utils/recruiterJobPostsTypes'

import { jobEditPath, jobTitle } from './jobRowFormat'
import styles from './JobRowMenu.module.scss'
import { useJobActions } from './useJobActions'

type JobRowMenuProps = {
  job: RecruiterJob
  tourId?: string
}

export const JobRowMenu = ({ job, tourId }: JobRowMenuProps) => {
  const navigate = useNavigate()
  const actions = useJobActions({ ...job, title: jobTitle(job) })

  const items: DropdownItem[] = [
    {
      key: 'view',
      label: 'View job',
      onClick: () => navigate(`/recruiterDashboard/jobdetail/${job.id}`),
    },
    ...(actions.needsPayment
      ? [
          {
            key: 'pay',
            label: actions.payLabel,
            disabled: actions.isPaying,
            onClick: actions.pay,
          },
        ]
      : []),
    { key: 'edit', label: 'Edit', onClick: () => navigate(jobEditPath(job)) },
    ...(actions.canClose
      ? [{ key: 'close', label: 'Close', onClick: actions.askClose }]
      : []),
    {
      key: 'delete',
      label: 'Delete',
      danger: true,
      onClick: actions.askDelete,
    },
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
      {actions.dialogs}
    </>
  )
}
