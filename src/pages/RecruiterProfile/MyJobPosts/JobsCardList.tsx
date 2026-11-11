import React from 'react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/ui/Badge'
import { RecruiterJob } from '@/utils/recruiterJobPostsTypes'

import { getStatusBadge, getStatusLabel } from '../getJobStatus'
import {
  isDraftLike,
  jobLocation,
  jobMonthlySalary,
  jobPostedLabel,
  jobTitle,
} from './jobRowFormat'
import { JobRowMenu } from './JobRowMenu'
import styles from './JobsCardList.module.scss'

type JobsCardListProps = {
  data: RecruiterJob[]
  emptyState: React.ReactNode
}

export const JobsCardList = ({ data, emptyState }: JobsCardListProps) => {
  if (data.length === 0) return <>{emptyState}</>
  const firstDraftId = data.find(isDraftLike)?.id

  return (
    <ul className={styles.list}>
      {data.map((job) => (
        <li key={job.id} className={styles.item}>
          <div className={styles.rowTop}>
            <Link
              to={`/recruiterDashboard/jobdetail/${job.id}`}
              className={styles.title}>
              {jobTitle(job)}
            </Link>
            <JobRowMenu
              job={job}
              tourId={job.id === firstDraftId ? 'add-ai-config' : undefined}
            />
          </div>
          <p className={styles.subtext}>
            {jobLocation(job)} · {jobMonthlySalary(job)} / month
          </p>
          <div className={styles.rowBottom}>
            <StatusBadge
              status={getStatusLabel(job.status)}
              {...getStatusBadge(job.status)}
              showDot
            />
            <span className={styles.subtext}>
              {isDraftLike(job)
                ? jobPostedLabel(job)
                : `${job.noOfApplicants ?? 0} applicants · ${jobPostedLabel(
                    job,
                  )}`}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
