import React, { useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { HiOutlineShieldCheck } from 'react-icons/hi2'

import { PageHero } from '@/components/layout/PageHero'
import { PageShell } from '@/components/layout/PageShell'
import { EmptyState } from '@/components/ui'
import { ColumnDef, DataTable } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import type { FilterFieldConfig } from '@/components/ui/FilterPanel'
import { useOrganizationMembers } from '@/features/organizations/hooks/useOrganizationMembers'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import {
  useAccessLog,
  useStaffOptions,
} from '@/features/people/hooks/useStaffData'
import { AccessLogEntry } from '@/features/people/types'
import { formatDateTime, toDateOnly } from '@/features/people/utils/formatDate'

import { Pagination } from '../MyJobPosts/Pagination'
import styles from './AccessLog.module.scss'

const ROWS_PER_PAGE = 15

type Filters = {
  staffId: string
  actorId: string
  range: DateRange | undefined
}

const DEFAULT_FILTERS: Filters = { staffId: '', actorId: '', range: undefined }

const COLUMNS: ColumnDef<AccessLogEntry>[] = [
  {
    key: 'when',
    header: 'Date and time',
    render: (entry) => formatDateTime(entry.createdAt),
  },
  {
    key: 'who',
    header: 'Who looked',
    render: (entry) => <span className={styles.who}>{entry.actorName}</span>,
  },
  {
    key: 'what',
    header: 'What they opened',
    render: (entry) => entry.description,
  },
  {
    key: 'ip',
    header: 'IP address',
    hideBelow: 640,
    render: (entry) => entry.ip ?? '—',
  },
]

export const AccessLog = () => {
  const { organizationId } = usePeopleAccess()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const { options: people } = useStaffOptions(organizationId, {
    includeEnded: true,
  })
  const { members } = useOrganizationMembers(organizationId)

  const { items, total, isLoading, hasError } = useAccessLog(organizationId, {
    staffId: filters.staffId,
    actorId: filters.actorId,
    from: filters.range?.from ? toDateOnly(filters.range.from) : '',
    to: filters.range?.from
      ? toDateOnly(filters.range.to ?? filters.range.from)
      : '',
    limit: ROWS_PER_PAGE,
    offset: (page - 1) * ROWS_PER_PAGE,
  })

  const fields: FilterFieldConfig<Filters>[] = useMemo(
    () => [
      {
        type: 'select',
        key: 'staffId',
        label: 'Employee',
        offValue: '',
        options: people.map((person) => ({
          label:
            person.status === 'ended'
              ? `${person.fullName} (ended)`
              : person.fullName,
          value: person.id,
        })),
      },
      {
        type: 'select',
        key: 'actorId',
        label: 'Looked by',
        offValue: '',
        options: members.map((member) => ({
          label:
            `${member.user.firstName} ${member.user.lastName}`.trim() ||
            member.user.email,
          value: member.userId,
        })),
      },
      {
        type: 'dateRange',
        key: 'range',
        label: 'Dates',
        quickRanges: [
          { label: 'Today', days: 0 },
          { label: 'Last 7 days', days: 7 },
          { label: 'Last 30 days', days: 30 },
        ],
      },
    ],
    [people, members],
  )

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="People"
        title="Access log"
        lead="Every time someone on your team opens an employee's record, a line is added here. Only you can see it."
      />

      {hasError ? (
        <EmptyState
          title="Couldn't load the access log"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : (
        <>
          <FilterBar
            fields={fields}
            filters={filters}
            defaultFilters={DEFAULT_FILTERS}
            onChange={(next) => {
              setFilters(next)
              setPage(1)
            }}
            ariaLabel="Filter the access log"
          />
          <DataTable
            columns={COLUMNS}
            data={items}
            isLoading={isLoading}
            getRowKey={(entry) => entry.id}
            ariaLabel="Access log"
            showRowNumber={false}
            emptyState={
              <EmptyState
                icon={<HiOutlineShieldCheck />}
                title="Nothing here yet"
                description="No one has opened an employee record in this period."
              />
            }
          />
          {total > ROWS_PER_PAGE && (
            <Pagination
              totalItems={total}
              itemsPerPage={ROWS_PER_PAGE}
              currentPage={page}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </PageShell>
  )
}
