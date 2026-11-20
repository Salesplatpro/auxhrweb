import React, { useMemo, useState } from 'react'
import { HiOutlineArrowDownTray, HiOutlineShieldCheck } from 'react-icons/hi2'

import { Select } from '@/components/forms/Select'
import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import { Avatar } from '@/components/ui/Avatar'
import { ColumnDef, DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { Pill } from '@/components/ui/Pill'
import { useOrganizationMembers } from '@/features/organizations/hooks/useOrganizationMembers'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import {
  useAccessLog,
  useStaffOptions,
} from '@/features/people/hooks/useStaffData'
import { peoplePaths } from '@/features/people/paths'
import { AccessLogEntry } from '@/features/people/types'
import {
  ACCESS_FILTER_OPTIONS,
  accessLabel,
} from '@/features/people/utils/accessLog'
import { formatDateTime, toDateOnly } from '@/features/people/utils/formatDate'

import styles from './AccessLog.module.scss'

const ROWS_PER_PAGE = 15

const PERIOD_OPTIONS = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
  { label: 'All time', value: '' },
]

const PERIOD_HINTS: Record<string, string> = {
  '7': 'in the last 7 days',
  '30': 'in the last 30 days',
  '90': 'in the last 90 days',
  '': 'so far',
}

type Filters = {
  staffId: string
  actorId: string
  resource: string
  days: string
}

const DEFAULT_FILTERS: Filters = {
  staffId: '',
  actorId: '',
  resource: '',
  days: '30',
}

const periodStart = (days: string) => {
  if (!days) return ''
  const date = new Date()
  date.setDate(date.getDate() - Number(days))
  return toDateOnly(date)
}

const COLUMNS: ColumnDef<AccessLogEntry>[] = [
  {
    key: 'who',
    header: 'Who',
    render: (entry) => {
      const [firstName = '', ...rest] = entry.actorName.split(' ')
      return (
        <span className={styles.who}>
          <Avatar firstName={firstName} lastName={rest.join(' ')} size="sm" />
          {entry.actorName}
        </span>
      )
    },
  },
  {
    key: 'whose',
    header: 'Whose record',
    render: (entry) => entry.staffName,
  },
  {
    key: 'what',
    header: 'What they opened',
    render: (entry) => (
      <Pill tone="neutral" size="sm">
        {accessLabel(entry.resource)}
      </Pill>
    ),
  },
  {
    key: 'when',
    header: 'When',
    render: (entry) => formatDateTime(entry.createdAt),
  },
]

export const AccessLog = () => {
  const { organizationId } = usePeopleAccess()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const { exportAccessLog, isSaving } = useStaffActions(organizationId)

  const { options: people } = useStaffOptions(organizationId, {
    includeEnded: true,
  })
  const { members } = useOrganizationMembers(organizationId)

  const query = {
    staffId: filters.staffId,
    actorId: filters.actorId,
    resource: filters.resource,
    from: periodStart(filters.days),
    to: filters.days ? toDateOnly(new Date()) : '',
  }

  const { items, total, isLoading, hasError } = useAccessLog(organizationId, {
    ...query,
    limit: ROWS_PER_PAGE,
    offset: (page - 1) * ROWS_PER_PAGE,
  })

  const change = (key: keyof Filters) => (value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const peopleOptions = useMemo(
    () => [
      { label: 'Employee: Anyone', value: '' },
      ...people.map((person) => ({
        label:
          person.status === 'ended'
            ? `${person.fullName} (ended)`
            : person.fullName,
        value: person.id,
      })),
    ],
    [people],
  )

  const memberOptions = useMemo(
    () => [
      { label: 'Who: Anyone', value: '' },
      ...members.map((member) => ({
        label:
          `${member.user.firstName} ${member.user.lastName}`.trim() ||
          member.user.email,
        value: member.userId,
      })),
    ],
    [members],
  )

  return (
    <PageShell wide>
      <PageHeaderTitle
        breadcrumbs={[
          { label: 'People', to: peoplePaths.employees },
          { label: 'Access log' },
        ]}
        title="Access log"
        description="Every time someone opened a staff record. Only the owner sees this page."
      />

      {hasError ? (
        <EmptyState
          title="Couldn't load the access log"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : (
        <PagePanel
          flush
          title="Activity"
          hint={`${total} ${total === 1 ? 'record' : 'records'} opened ${
            PERIOD_HINTS[filters.days]
          }`}>
          <div className={styles.filters}>
            <Select
              options={memberOptions}
              value={filters.actorId}
              onChange={change('actorId')}
            />
            <Select
              options={peopleOptions}
              value={filters.staffId}
              onChange={change('staffId')}
              searchable
            />
            <Select
              options={ACCESS_FILTER_OPTIONS}
              value={filters.resource}
              onChange={change('resource')}
            />
            <Select
              options={PERIOD_OPTIONS}
              value={filters.days}
              onChange={change('days')}
            />
            <Button
              className={styles.export}
              variant="outline"
              icon={<HiOutlineArrowDownTray />}
              loading={isSaving}
              onClick={() => exportAccessLog(query)}>
              Export
            </Button>
          </div>
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
        </PagePanel>
      )}
    </PageShell>
  )
}
