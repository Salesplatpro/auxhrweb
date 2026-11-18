import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { CompanyTag } from '@/components/features/jobs/CompanyTag'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { Button } from '@/components/ui/Button'
import {
  ColumnDef,
  DataTable,
  sortByAccessor,
  TableToolbar,
} from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar, FilterFieldConfig } from '@/components/ui/FilterPanel'
import { Pagination } from '@/components/ui/Pagination'
import {
  deleteAdminJob,
  fetchAdminJobs,
} from '@/features/admin/services/adminService'
import { useRolesStore } from '@/features/admin/store/useRolesStore'
import { AdminJob } from '@/features/admin/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './Jobs.module.scss'

type SortDirection = 'asc' | 'desc'

interface JobFilterValues {
  search: string
  status: string
  roleId: string
}

const defaultJobFilters: JobFilterValues = {
  search: '',
  status: '',
  roleId: '',
}

const ROWS_PER_PAGE = 10

const JOB_STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'closed', label: 'Closed' },
]

const truncate = (value: string, max = 72) =>
  value.length > max ? `${value.slice(0, max).trimEnd()}…` : value

const Jobs = () => {
  const { roles, fetchRoles } = useRolesStore()

  const [jobs, setJobs] = useState<AdminJob[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobFilters, setJobFilters] =
    useState<JobFilterValues>(defaultJobFilters)
  const [jobSortKey, setJobSortKey] = useState('createdAt')
  const [jobSortDirection, setJobSortDirection] =
    useState<SortDirection>('desc')
  const [jobPage, setJobPage] = useState(1)
  const [jobVisibleKeys, setJobVisibleKeys] = useState<string[]>([
    'role',
    'organization',
    'brief',
    'status',
    'recruiter',
    'location',
    'createdAt',
  ])
  const [jobToDelete, setJobToDelete] = useState<AdminJob | null>(null)
  const [isDeletingJob, setIsDeletingJob] = useState(false)

  useEffect(() => {
    void fetchRoles()
  }, [fetchRoles])

  const loadJobs = useCallback(async () => {
    setJobsLoading(true)
    try {
      const data = await fetchAdminJobs({ limit: 200, offset: 0 })
      setJobs(data.jobs)
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to load jobs'))
    } finally {
      setJobsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadJobs()
  }, [loadJobs])

  const roleOptions = useMemo(
    () => [
      { value: '', label: 'Any role' },
      ...roles.map((role) => ({ value: role.id, label: role.name })),
    ],
    [roles],
  )

  const jobFilterFields: FilterFieldConfig<JobFilterValues>[] = [
    {
      type: 'search',
      key: 'search',
      label: 'Search',
      placeholder: 'Role, brief, or recruiter',
    },
    {
      type: 'select',
      key: 'status',
      label: 'Status',
      offValue: '',
      options: JOB_STATUS_OPTIONS,
    },
    {
      type: 'select',
      key: 'roleId',
      label: 'Role',
      offValue: '',
      options: roleOptions,
    },
  ]

  const jobColumns: ColumnDef<AdminJob>[] = useMemo(
    () => [
      {
        key: 'role',
        header: 'Role',
        sortLabel: 'Role',
        toggleable: true,
        render: (row) => row.role?.name ?? '—',
        sortAccessor: (row) => row.role?.name ?? '',
      },
      {
        key: 'organization',
        header: 'Company',
        sortLabel: 'Company',
        toggleable: true,
        render: (row) => <CompanyTag organization={row.organization} />,
        sortAccessor: (row) => row.organization?.name ?? '',
      },
      {
        key: 'brief',
        header: 'Job brief',
        toggleable: true,
        render: (row) => truncate(row.jobBrief || '—'),
      },
      {
        key: 'status',
        header: 'Status',
        sortLabel: 'Status',
        toggleable: true,
        render: (row) => row.status,
        sortAccessor: (row) => row.status,
      },
      {
        key: 'recruiter',
        header: 'Posted by',
        toggleable: true,
        hideBelow: 900,
        render: (row) =>
          row.postedBy
            ? `${row.postedBy.firstName} ${row.postedBy.lastName}`
            : '—',
        sortAccessor: (row) =>
          row.postedBy
            ? `${row.postedBy.firstName} ${row.postedBy.lastName}`
            : '',
      },
      {
        key: 'location',
        header: 'Location',
        toggleable: true,
        hideBelow: 720,
        render: (row) => row.locationCountry || '—',
      },
      {
        key: 'createdAt',
        header: 'Created',
        sortLabel: 'Created',
        toggleable: true,
        render: (row) => new Date(row.createdAt).toLocaleDateString(),
        sortAccessor: (row) => row.createdAt,
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (row) => (
          <div className={styles.actions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setJobToDelete(row)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const visibleJobColumns = jobColumns.filter(
    (col) => !col.toggleable || jobVisibleKeys.includes(col.key),
  )

  const filteredJobs = useMemo(() => {
    const search = jobFilters.search.trim().toLowerCase()
    return jobs.filter((row) => {
      if (jobFilters.status && row.status !== jobFilters.status) return false
      if (jobFilters.roleId && row.role?.id !== jobFilters.roleId) return false
      if (!search) return true
      const haystack = [
        row.jobBrief,
        row.role?.name,
        row.organization?.name,
        row.postedBy?.firstName,
        row.postedBy?.lastName,
        row.postedBy?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(search)
    })
  }, [jobs, jobFilters])

  const sortedJobs = useMemo(() => {
    const column = jobColumns.find((col) => col.key === jobSortKey)
    return column?.sortAccessor
      ? sortByAccessor(filteredJobs, column.sortAccessor, jobSortDirection)
      : filteredJobs
  }, [filteredJobs, jobColumns, jobSortKey, jobSortDirection])

  const pagedJobs = sortedJobs.slice(
    (jobPage - 1) * ROWS_PER_PAGE,
    jobPage * ROWS_PER_PAGE,
  )

  const handleDeleteJob = async () => {
    if (!jobToDelete) return
    setIsDeletingJob(true)
    try {
      await deleteAdminJob(jobToDelete.id)
      notify('success', 'Job permanently deleted')
      setJobToDelete(null)
      await loadJobs()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to delete job'))
    } finally {
      setIsDeletingJob(false)
    }
  }

  return (
    <div className={styles.page}>
      <PageHeaderTitle
        title="Jobs"
        description="Manage every job on the platform. Deletions are permanent."
      />

      <p className={styles.sectionDescription}>
        Deleting a job removes applications, questions, answers, match data,
        messages, and unused AI config.
      </p>

      <div className={styles.mainColumn}>
        <FilterBar
          fields={jobFilterFields}
          filters={jobFilters}
          defaultFilters={defaultJobFilters}
          onChange={(next) => {
            setJobFilters(next)
            setJobPage(1)
          }}
          ariaLabel="Filter jobs"
        />
        {!jobsLoading && sortedJobs.length === 0 ? (
          <EmptyState
            title="No jobs found"
            description="Try adjusting filters, or wait for recruiters to post jobs."
          />
        ) : (
          <>
            <TableToolbar
              columns={jobColumns}
              resultsCount={sortedJobs.length}
              visibleColumnKeys={jobVisibleKeys}
              onToggleColumn={(key) =>
                setJobVisibleKeys((prev) =>
                  prev.includes(key)
                    ? prev.filter((item) => item !== key)
                    : [...prev, key],
                )
              }
              sortKey={jobSortKey}
              sortDirection={jobSortDirection}
              onSortChange={(key, direction) => {
                setJobSortKey(key)
                setJobSortDirection(direction)
              }}
            />
            <DataTable
              columns={visibleJobColumns}
              data={pagedJobs}
              isLoading={jobsLoading}
              getRowKey={(row) => row.id}
              showRowNumber
              rowNumberOffset={(jobPage - 1) * ROWS_PER_PAGE}
              allowOverflow
              ariaLabel="Jobs table"
            />
            <Pagination
              totalItems={sortedJobs.length}
              itemsPerPage={ROWS_PER_PAGE}
              currentPage={jobPage}
              onPageChange={setJobPage}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(jobToDelete)}
        title="Permanently delete this job?"
        message={`Deleting "${
          jobToDelete?.role?.name ?? 'this job'
        }" will remove the job, applications, questions, answers, match data, and related messages. This cannot be undone.`}
        confirmLabel="Delete job"
        variant="danger"
        isConfirming={isDeletingJob}
        onConfirm={() => void handleDeleteJob()}
        onCancel={() => setJobToDelete(null)}
      />
    </div>
  )
}

export default Jobs
