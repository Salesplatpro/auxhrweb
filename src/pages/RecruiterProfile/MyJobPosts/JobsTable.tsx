import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/ui/Badge'
import { ColumnDef, DataTable } from '@/components/ui/DataTable'
import { RecruiterJob } from '@/utils/recruiterJobPostsTypes'

import { getStatusBadge, getStatusLabel } from '../getJobStatus'
import {
  isDraftLike,
  jobLocation,
  jobMonthlySalary,
  jobPostedLabel,
  jobSubtitle,
  jobTitle,
} from './jobRowFormat'
import { JobRowMenu } from './JobRowMenu'
import styles from './JobsTable.module.scss'

type JobsTableProps = {
  data: RecruiterJob[]
  emptyState: React.ReactNode
}

export const JobsTable = ({ data, emptyState }: JobsTableProps) => {
  const [selected, setSelected] = useState<Set<string | number>>(new Set())
  const firstDraftId = data.find(isDraftLike)?.id

  const columns = useMemo<ColumnDef<RecruiterJob>[]>(
    () => [
      {
        key: 'title',
        header: 'Job title',
        render: (job) => (
          <Link
            to={`/recruiterDashboard/jobdetail/${job.id}`}
            className={styles.titleCell}>
            <span className={styles.title}>{jobTitle(job)}</span>
            <span className={styles.subtitle}>{jobSubtitle(job)}</span>
          </Link>
        ),
      },
      {
        key: 'location',
        header: 'Location',
        render: (job) => (
          <span className={styles.muted}>{jobLocation(job)}</span>
        ),
      },
      {
        key: 'salary',
        header: 'Salary / month',
        render: (job) => (
          <span className={styles.strong}>{jobMonthlySalary(job)}</span>
        ),
      },
      {
        key: 'applicants',
        header: 'Applicants',
        render: (job) =>
          isDraftLike(job) ? (
            <span className={styles.muted}>—</span>
          ) : (
            <Link
              to={`/recruiterDashboard/singleJobPost/${job.id}`}
              state={{ jobName: job.role.name, postedAt: job.createdAt }}
              className={styles.strong}>
              {job.noOfApplicants ?? 0}
            </Link>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (job) => (
          <StatusBadge
            status={getStatusLabel(job.status)}
            {...getStatusBadge(job.status)}
            showDot
          />
        ),
      },
      {
        key: 'posted',
        header: 'Posted',
        render: (job) => (
          <span className={styles.muted}>{jobPostedLabel(job)}</span>
        ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (job) => (
          <JobRowMenu
            job={job}
            tourId={job.id === firstDraftId ? 'add-ai-config' : undefined}
          />
        ),
      },
    ],
    [firstDraftId],
  )

  const toggleRow = (key: string | number) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <DataTable
      variant="plain"
      columns={columns}
      data={data}
      getRowKey={(job) => job.id}
      ariaLabel="Job posts"
      showRowNumber={false}
      allowOverflow
      selectedRowKeys={selected}
      onToggleRow={toggleRow}
      onToggleAll={(keys) => setSelected(new Set(keys))}
      emptyState={emptyState}
    />
  )
}
