import React, { useMemo, useState } from 'react'
import { HiOutlineClipboardDocumentList } from 'react-icons/hi2'
import useSWR from 'swr'

import { TextInput } from '@/components/forms'
import { Select } from '@/components/forms/Select'
import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { EmptyState } from '@/components/ui'
import { Avatar } from '@/components/ui/Avatar'
import { ColumnDef, DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import {
  actionLabel,
  activityKey,
  changedText,
  CompanyActivityEntry,
  targetText,
} from '@/features/organizations/activityLog'
import { useMyOrganizations } from '@/features/organizations/hooks/useMyOrganizations'
import { useOrganizationMembers } from '@/features/organizations/hooks/useOrganizationMembers'
import { fetchCompanyActivity } from '@/features/organizations/services/activityService'
import { formatDateTime, toDateOnly } from '@/features/people/utils/formatDate'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useDebouncedValue } from '@/hooks'

import styles from './ActivityLog.module.scss'

const ROWS_PER_PAGE = 15

const PERIOD_OPTIONS = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
  { label: 'All time', value: '' },
]

const periodStart = (days: string) => {
  if (!days) return ''
  const date = new Date()
  date.setDate(date.getDate() - Number(days))
  return toDateOnly(date)
}

const COLUMNS: ColumnDef<CompanyActivityEntry>[] = [
  {
    key: 'when',
    header: 'When',
    render: (entry) => formatDateTime(entry.createdAt),
  },
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
    key: 'what',
    header: 'What they did',
    render: (entry) => actionLabel(entry.action),
  },
  {
    key: 'item',
    header: 'Item',
    render: (entry) => targetText(entry),
  },
  {
    key: 'fields',
    header: 'Fields changed',
    render: (entry) => (
      <span className={styles.muted}>{changedText(entry.changedFields)}</span>
    ),
  },
]

export const ActivityLog = () => {
  const { profile } = useProfile()
  const { organizations } = useMyOrganizations()
  const organization =
    organizations.find((org) => org.id === profile?.activeOrganizationId) ??
    null
  const isOwner = !!organization && organization.ownerId === profile?.id
  const organizationId = isOwner ? organization.id : null

  const [page, setPage] = useState(1)
  const [actorId, setActorId] = useState('')
  const [days, setDays] = useState('30')
  const [searchText, setSearchText] = useState('')
  const search = useDebouncedValue(searchText.trim())
  const { members } = useOrganizationMembers(organizationId)

  const query = {
    actorId,
    search,
    from: periodStart(days),
    to: days ? toDateOnly(new Date()) : '',
    limit: ROWS_PER_PAGE,
    offset: (page - 1) * ROWS_PER_PAGE,
  }
  const { data, error, isLoading } = useSWR(
    organizationId ? activityKey(organizationId, query) : null,
    () => fetchCompanyActivity(organizationId!, query),
    { keepPreviousData: true },
  )
  const items = data?.items ?? []
  const total = data?.total ?? 0

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

  const resetPage =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value)
      setPage(1)
    }

  return (
    <PageShell wide>
      <PageHeaderTitle
        breadcrumbs={[
          { label: 'Company', to: '/recruiterDashboard/company' },
          { label: 'Activity log' },
        ]}
        title="Activity log"
        description="Every change anyone in your company made, and who made it. Only the owner sees this page."
      />

      {!isOwner ? (
        <EmptyState
          title="Only the company's owner can see this"
          description="Ask the owner if you need to know who changed something."
        />
      ) : error ? (
        <EmptyState
          title="Couldn't load the activity log"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : (
        <PagePanel
          flush
          title="Activity"
          hint={`${total} ${total === 1 ? 'change' : 'changes'}`}>
          <div className={styles.filters}>
            <Select
              options={memberOptions}
              value={actorId}
              onChange={resetPage(setActorId)}
            />
            <Select
              options={PERIOD_OPTIONS}
              value={days}
              onChange={resetPage(setDays)}
            />
            <TextInput
              name="activity-search"
              label="activity-search"
              title="Search"
              placeholder="Action, item or person"
              value={searchText}
              maxLength={100}
              onChange={(event) => resetPage(setSearchText)(event.target.value)}
            />
          </div>
          <DataTable
            columns={COLUMNS}
            data={items}
            isLoading={isLoading}
            getRowKey={(entry) => entry.id}
            ariaLabel="Company activity log"
            showRowNumber={false}
            emptyState={
              <EmptyState
                icon={<HiOutlineClipboardDocumentList />}
                title="Nothing here yet"
                description="No one has changed anything in this period."
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
