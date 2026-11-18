import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
  FOLLOW_UP_OPTIONS,
  STUCK_STAGE_OPTIONS,
  stuckStageOptions,
} from '@/features/admin/applicationFollowUp'
import { fetchStuckApplications } from '@/features/admin/services/adminService'
import {
  ApplicationFollowUpStatus,
  ScreeningStage,
  StuckApplicationSummary,
} from '@/features/admin/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { ApplicationFollowUpDrawer } from './ApplicationFollowUpDrawer'
import styles from './Applications.module.scss'
import { StuckApplicationBadge } from './StuckApplicationBadge'

type SortDirection = 'asc' | 'desc'

interface ApplicationFilterValues {
  search: string
  stuckStage: string
  followUp: string
}

const defaultApplicationFilters: ApplicationFilterValues = {
  search: '',
  stuckStage: '',
  followUp: '',
}

const ROWS_PER_PAGE = 10

const Applications = () => {
  const navigate = useNavigate()

  const [applications, setApplications] = useState<StuckApplicationSummary[]>(
    [],
  )
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<ApplicationFilterValues>(
    defaultApplicationFilters,
  )
  const [sortKey, setSortKey] = useState('daysStuck')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)
  const [visibleKeys, setVisibleKeys] = useState<string[]>([
    'talent',
    'job',
    'company',
    'stage',
    'daysStuck',
    'createdAt',
  ])
  const [followUpTarget, setFollowUpTarget] =
    useState<StuckApplicationSummary | null>(null)

  const { stuckStage, followUp } = filters

  // Stuck-stage / follow-up filters run on the server so they cover every
  // application, not just the loaded page; search stays in the browser.
  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchStuckApplications({
        limit: 200,
        offset: 0,
        stuckStage: stuckStage as ScreeningStage | '',
        followUp: followUp as ApplicationFollowUpStatus | '',
      })
      setApplications(data.applications)
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to load applications'))
    } finally {
      setIsLoading(false)
    }
  }, [stuckStage, followUp])

  useEffect(() => {
    void load()
  }, [load])

  const filterFields: FilterFieldConfig<ApplicationFilterValues>[] = [
    {
      type: 'search',
      key: 'search',
      label: 'Search',
      placeholder: 'Talent name or email',
    },
    {
      type: 'select',
      key: 'stuckStage',
      label: 'Stuck stage',
      offValue: '',
      options: stuckStageOptions(STUCK_STAGE_OPTIONS),
    },
    {
      type: 'select',
      key: 'followUp',
      label: 'Follow-up',
      offValue: '',
      options: FOLLOW_UP_OPTIONS,
    },
  ]

  const columns: ColumnDef<StuckApplicationSummary>[] = useMemo(
    () => [
      {
        key: 'talent',
        header: 'Talent',
        sortLabel: 'Talent',
        render: (row) => (
          <div>
            <div>
              {row.talent.firstName} {row.talent.lastName}
            </div>
            <div className={styles.companyCell}>{row.talent.email}</div>
          </div>
        ),
        sortAccessor: (row) => `${row.talent.firstName} ${row.talent.lastName}`,
      },
      {
        key: 'job',
        header: 'Job',
        toggleable: true,
        render: (row) => row.job.title,
        sortAccessor: (row) => row.job.title,
      },
      {
        key: 'company',
        header: 'Company',
        toggleable: true,
        hideBelow: 900,
        render: (row) => row.company?.name ?? '—',
        sortAccessor: (row) => row.company?.name ?? '',
      },
      {
        key: 'stage',
        header: 'Stuck stage',
        sortLabel: 'Stuck stage',
        toggleable: true,
        render: (row) => <StuckApplicationBadge summary={row} />,
        sortAccessor: (row) => STUCK_STAGE_OPTIONS.indexOf(row.stage),
      },
      {
        key: 'daysStuck',
        header: 'Days stuck',
        sortLabel: 'Days stuck',
        toggleable: true,
        render: (row) => `${row.daysStuck}d`,
        sortAccessor: (row) => row.daysStuck,
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (row) => (
          <div className={styles.actions}>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/adminDashboard/jobs/${row.job.id}?applicationId=${row.applicationId}`,
                )
              }>
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFollowUpTarget(row)}>
              Follow up
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  )

  const visibleColumns = columns.filter(
    (col) => !col.toggleable || visibleKeys.includes(col.key),
  )

  const filteredApplications = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    if (!search) return applications
    return applications.filter((row) => {
      const haystack =
        `${row.talent.firstName} ${row.talent.lastName} ${row.talent.email}`.toLowerCase()
      return haystack.includes(search)
    })
  }, [applications, filters.search])

  const sortedApplications = useMemo(() => {
    const column = columns.find((col) => col.key === sortKey)
    return column?.sortAccessor
      ? sortByAccessor(filteredApplications, column.sortAccessor, sortDirection)
      : filteredApplications
  }, [filteredApplications, columns, sortKey, sortDirection])

  const pagedApplications = sortedApplications.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE,
  )

  return (
    <div className={styles.page}>
      <PageHeaderTitle
        title="Applications"
        description="Talents currently stuck mid-way through a job's screening pipeline."
      />

      <div className={styles.mainColumn}>
        <FilterBar
          fields={filterFields}
          filters={filters}
          defaultFilters={defaultApplicationFilters}
          onChange={(next) => {
            setFilters(next)
            setPage(1)
          }}
          ariaLabel="Filter applications"
        />
        {!isLoading && sortedApplications.length === 0 ? (
          <EmptyState
            title="No stuck applications"
            description="Nothing to follow up on right now — talents mid-pipeline will show up here once they go a day without progress."
          />
        ) : (
          <>
            <TableToolbar
              columns={columns}
              resultsCount={sortedApplications.length}
              visibleColumnKeys={visibleKeys}
              onToggleColumn={(key) =>
                setVisibleKeys((prev) =>
                  prev.includes(key)
                    ? prev.filter((item) => item !== key)
                    : [...prev, key],
                )
              }
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSortChange={(key, direction) => {
                setSortKey(key)
                setSortDirection(direction)
              }}
            />
            <DataTable
              columns={visibleColumns}
              data={pagedApplications}
              isLoading={isLoading}
              getRowKey={(row) => row.applicationId}
              showRowNumber
              rowNumberOffset={(page - 1) * ROWS_PER_PAGE}
              allowOverflow
              ariaLabel="Stuck applications table"
            />
            <Pagination
              totalItems={sortedApplications.length}
              itemsPerPage={ROWS_PER_PAGE}
              currentPage={page}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <ApplicationFollowUpDrawer
        applicationId={followUpTarget?.applicationId ?? null}
        talentName={
          followUpTarget
            ? `${followUpTarget.talent.firstName} ${followUpTarget.talent.lastName}`
            : ''
        }
        onClose={() => setFollowUpTarget(null)}
        onSent={() => void load()}
      />
    </div>
  )
}

export default Applications
