import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { CompanyTag } from '@/components/features/jobs/CompanyTag'
import { ShareJob } from '@/components/features/jobs/ShareJob'
import { Select } from '@/components/forms/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useUpdateJobMutation } from '@/redux/api/recruiter'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { ColumnDef, DataTable, TableActions } from '../../../components'
import { formatTimeAgo, recruiterJobPostsTypes } from '../../../utils'
import {
  getStatusBadge,
  getStatusLabel,
  JOB_STATUS_OPTIONS,
  statusSavedMessage,
} from '../getJobStatus'
import styles from './JobsTable.module.scss'
import { useJobPayment } from './useJobPayment'

const resolveAiConfigId = (job: recruiterJobPostsTypes): string | null =>
  job.aiConfigId ?? (typeof job.aiConfig === 'string' ? job.aiConfig : null)

type StatusCellProps = {
  jobId: string
  status: string
  aiConfigId?: string | null
  showPay: boolean
  isPaying: boolean
  onPay: () => void
}

const StatusCell = ({
  jobId,
  status,
  aiConfigId,
  showPay,
  isPaying,
  onPay,
}: StatusCellProps) => {
  const [updateJob, { isLoading }] = useUpdateJobMutation()
  const [isEditing, setIsEditing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const statusOptions = aiConfigId
    ? JOB_STATUS_OPTIONS
    : JOB_STATUS_OPTIONS.filter((option) => option.value !== 'active')

  useEffect(() => {
    if (!isEditing) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsEditing(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditing])

  const handleChange = async (nextStatus: string) => {
    setIsEditing(false)
    if (nextStatus === status) return
    try {
      const response = await updateJob({
        jobId,
        data: { status: nextStatus },
      }).unwrap()
      notify(
        'success',
        statusSavedMessage(response?.data?.job?.status ?? nextStatus),
      )
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to update job status'))
    }
  }

  if (status === 'pending_payment') {
    return (
      <div className={styles.statusCell}>
        {showPay ? (
          <Button
            variant="primary"
            size="sm"
            loading={isPaying}
            onClick={onPay}>
            Pay to activate
          </Button>
        ) : (
          <StatusBadge
            status={getStatusLabel(status)}
            {...getStatusBadge(status)}
          />
        )}
      </div>
    )
  }

  return (
    <div className={styles.statusCell} ref={containerRef}>
      {isEditing ? (
        <Select
          options={statusOptions}
          value={status}
          onChange={(value) => void handleChange(value)}
          disabled={isLoading}
          height="34px"
          defaultOpen
        />
      ) : (
        <button
          type="button"
          className={styles.statusPillButton}
          disabled={isLoading}
          onClick={() => setIsEditing(true)}>
          <StatusBadge status={status} {...getStatusBadge(status)} />
        </button>
      )}
    </div>
  )
}

type JobsTableType = {
  data: recruiterJobPostsTypes[]
}

export const JobsTable = ({ data }: JobsTableType) => {
  const { canPay, payForJob, payingJobId } = useJobPayment()
  const columns = useMemo<ColumnDef<recruiterJobPostsTypes>[]>(
    () => [
      {
        key: 'role',
        header: 'Job Title',
        align: 'center',
        render: (job) => (
          <div className={styles.titleCell}>
            <Link
              to={`/recruiterDashboard/jobdetail/${job.id}`}
              className={styles.titleLink}>
              {job.role.name}
            </Link>
          </div>
        ),
      },
      {
        key: 'organization',
        header: 'Company',
        align: 'center',
        render: (job) => (
          <div className={styles.companyCell}>
            <CompanyTag organization={job.organization} />
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (job) => (
          <StatusCell
            jobId={job.id}
            status={job.status ?? 'draft'}
            aiConfigId={resolveAiConfigId(job)}
            showPay={canPay(job.status ?? 'draft', !!resolveAiConfigId(job))}
            isPaying={payingJobId === job.id}
            onPay={() => void payForJob(job.id)}
          />
        ),
      },
      {
        key: 'applicants',
        header: 'Applicants',
        align: 'center',
        render: (job) => (
          <Link
            to={`/recruiterDashboard/singleJobPost/${job.id}`}
            state={{ jobName: job.role.name, postedAt: job.createdAt }}>
            <button
              className={styles.applicantsButton}
              aria-label={`View ${job.noOfApplicants ?? 0} applicant${
                job.noOfApplicants === 1 ? '' : 's'
              } for ${job.role.name}`}>
              {job.noOfApplicants ?? 0} applicant
              {job.noOfApplicants === 1 ? '' : 's'}
            </button>
          </Link>
        ),
      },
      {
        key: 'createdAt',
        header: 'Date Created',
        align: 'center',
        render: (job) => (
          <p className={styles.dateText}>{formatTimeAgo(job.createdAt)}</p>
        ),
      },
      {
        key: 'details',
        header: 'Details',
        align: 'right',
        render: (job) => (
          <TableActions>
            <Link
              to={`/recruiterDashboard/jobdetail/${job.id}`}
              state={{ jobName: job.role.name, postedAt: job.createdAt }}>
              <Button variant="primary" size="sm">
                View Job
              </Button>
            </Link>
            {job.status === 'draft' &&
              canPay('draft', !!resolveAiConfigId(job)) && (
                <Button
                  variant="primary"
                  size="sm"
                  loading={payingJobId === job.id}
                  onClick={() => void payForJob(job.id)}>
                  Pay to activate
                </Button>
              )}
            {job.status === 'draft' && !resolveAiConfigId(job) && (
              <Link
                to={`/recruiterDashboard/postjob/${job.id}`}
                data-tour="add-ai-config">
                <button type="button" className={styles.addAiConfigButton}>
                  Add AI Config
                </button>
              </Link>
            )}
            {job.status === 'active' && (
              <ShareJob jobId={job.id} jobTitle={job.role?.name} />
            )}
          </TableActions>
        ),
      },
    ],
    [canPay, payForJob, payingJobId],
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowKey={(job) => job.id}
      ariaLabel="Job posts table"
      allowOverflow
      getRowClassName={(job) => {
        if (job.status === 'suspended' || job.status === 'closed')
          return styles.rowClosed
        if (resolveAiConfigId(job)) return styles.rowComplete
        return styles.rowIncomplete
      }}
    />
  )
}
