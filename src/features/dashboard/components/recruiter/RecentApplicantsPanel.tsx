import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PagePanel } from '@/components/layout/PagePanel'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ColumnDef, DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Text } from '@/components/ui/Typography'
import { getStatusBadge } from '@/pages/RecruiterProfile/getJobStatus'
import { humanStatus } from '@/pages/TalentProfile/Job/jobPipeline'
import { formatTimeAgo } from '@/utils'

import {
  APPLICANTS_PAGE_SIZE,
  useRecruiterApplicants,
} from '../../hooks/useRecruiterDashboard'
import { DashboardApplicant } from '../../types'
import { CardError } from '../CardError/CardError'
import styles from './RecruiterDashboard.module.scss'

const COLUMNS: ColumnDef<DashboardApplicant>[] = [
  {
    key: 'candidate',
    header: 'Candidate',
    render: (row) => {
      const [firstName = '', lastName = ''] = row.applicantName.split(' ')
      return (
        <span className={styles.candidate}>
          <Avatar firstName={firstName} lastName={lastName} size="sm" />
          <span className={styles.candidateText}>
            <Text as="span" size="fs-md" weight="bolder">
              {row.applicantName}
            </Text>
            {row.role && (
              <Text as="span" size="fs-sm" color="muted">
                {row.role}
              </Text>
            )}
          </span>
        </span>
      )
    },
  },
  {
    key: 'cvMatch',
    header: 'CV Match',
    hideBelow: 640,
    render: (row) =>
      row.cvMatch === null ? (
        '—'
      ) : (
        <span className={styles.meter}>
          <span className={styles.meterTrack} aria-hidden>
            <span
              className={styles.meterFill}
              style={{ width: `${Math.min(100, Math.max(0, row.cvMatch))}%` }}
            />
          </span>
          <Text as="span" size="fs-md" weight="bolder">
            {Math.round(row.cvMatch)}%
          </Text>
        </span>
      ),
  },
  {
    key: 'prescreening',
    header: 'Pre-Screening Score',
    hideBelow: 900,
    render: (row) =>
      row.prescreeningScore === null ? (
        '—'
      ) : (
        <Text as="span" size="fs-md">
          <strong>{Math.round(row.prescreeningScore)}</strong> / 100
        </Text>
      ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <StatusBadge
        status={humanStatus(row.status)}
        {...getStatusBadge(row.status)}
        showDot
      />
    ),
  },
  {
    key: 'applied',
    header: 'Applied',
    align: 'right',
    render: (row) => formatTimeAgo(row.dateApplied),
  },
]

export const RecentApplicantsPanel = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const { applicants, total, offset, error, isLoading, retry } =
    useRecruiterApplicants(page)

  useEffect(() => {
    if (!isLoading && !error && page > 0 && applicants.length === 0) {
      setPage((current) => current - 1)
    }
  }, [isLoading, error, page, applicants.length])

  const from = applicants.length ? offset + 1 : 0
  const to = offset + applicants.length

  return (
    <PagePanel
      title="Recent Applicants"
      hint="Latest applications across all job posts"
      actionTo="/recruiterDashboard/dashboard/allapplications"
      actionLabel="View All">
      {error ? (
        <CardError onRetry={retry} />
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            data={applicants}
            isLoading={isLoading}
            getRowKey={(row) => row.id}
            ariaLabel="Recent applicants"
            onRowClick={(row) =>
              navigate(
                `/recruiterDashboard/singleJobPost/${row.jobId}?applicationId=${row.id}`,
              )
            }
            emptyState={
              <EmptyState
                title="No applications yet"
                description="Applications appear here as soon as candidates apply to your jobs."
              />
            }
          />
          {total > 0 && (
            <div className={styles.pager}>
              <Text as="span" size="fs-md" color="muted">
                Showing {from}–{to} of {total.toLocaleString('en-US')}{' '}
                applications
              </Text>
              <span className={styles.pagerButtons}>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0 || isLoading}
                  onClick={() => setPage((current) => current - 1)}>
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={offset + APPLICANTS_PAGE_SIZE >= total || isLoading}
                  onClick={() => setPage((current) => current + 1)}>
                  Next
                </Button>
              </span>
            </div>
          )}
        </>
      )}
    </PagePanel>
  )
}
