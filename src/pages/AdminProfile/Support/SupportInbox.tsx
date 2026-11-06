import cn from 'classnames'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Alert } from '@/components/feedback/Alert'
import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ColumnDef, DataTable, TableToolbar } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar, FilterFieldConfig } from '@/components/ui/FilterPanel'
import { Tabs } from '@/components/ui/Tabs'
import { SupportStatusBadge } from '@/features/support/components/SupportStatusBadge'
import {
  SUPPORT_STATUS_RANK,
  SUPPORT_STATUS_STYLE,
  SUPPORT_TOPICS,
  topicLabel,
} from '@/features/support/constants'
import { useSupportInbox } from '@/features/support/hooks/useAdminSupport'
import {
  SupportInboxRow,
  SupportStatus,
  SupportTopic,
} from '@/features/support/types'
import { formatTimeAgo } from '@/utils/calculateDaysFromCreation'

import { Pagination } from '../../RecruiterProfile/MyJobPosts/Pagination'
import styles from './Support.module.scss'

const PAGE_SIZE = 20
const SEARCH_DELAY_MS = 300

type Tab = SupportStatus | 'all'
const TABS: Tab[] = ['all', 'unread', 'unreplied', 'read', 'replied']

const EMPTY_COPY: Record<Tab, { title: string; description: string }> = {
  all: {
    title: 'No support requests yet',
    description: 'Messages from talents and recruiters show up here.',
  },
  unread: {
    title: 'You’re all caught up',
    description: 'Every request has been opened.',
  },
  unreplied: {
    title: 'Nothing overdue',
    description: 'Every request had a reply within 48 hours.',
  },
  read: {
    title: 'Nothing waiting',
    description: 'Opened requests that still need a reply show up here.',
  },
  replied: {
    title: 'No replies yet',
    description: 'Requests you have answered show up here.',
  },
}

interface InboxFilterValues {
  search: string
  topic: string
}

const DEFAULT_FILTERS: InboxFilterValues = { search: '', topic: '' }

const FILTER_FIELDS: FilterFieldConfig<InboxFilterValues>[] = [
  {
    type: 'search',
    key: 'search',
    label: 'Search',
    placeholder: 'Name, email or message',
  },
  {
    type: 'select',
    key: 'topic',
    label: 'Topic',
    offValue: '',
    options: [
      { label: 'All topics', value: '' },
      ...SUPPORT_TOPICS.map((topic) => ({
        label: topic.label,
        value: topic.value,
      })),
    ],
  },
]

const isTab = (value: string | null): value is Tab =>
  !!value && (TABS as string[]).includes(value)

const isTopic = (value: string | null): value is SupportTopic =>
  !!value && SUPPORT_TOPICS.some((topic) => topic.value === value)

const AiCell = ({ row }: { row: SupportInboxRow }) => {
  if (row.status === 'replied' || !row.aiDraftStatus) return <>—</>
  const chip = {
    pending: { label: 'Drafting…', className: styles.aiWorking },
    drafted: { label: 'Draft ready', className: styles.aiReady },
    complex: { label: 'Needs you', className: styles.aiComplex },
    failed: { label: 'AI failed', className: styles.aiFailed },
  }[row.aiDraftStatus]
  return <span className={cn(styles.aiChip, chip.className)}>{chip.label}</span>
}

const roleLabel = (role: string) =>
  role === 'recruiter' ? 'Recruiter' : role === 'talent' ? 'Talent' : role

const SupportInbox = () => {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const statusParam = params.get('status')
  const tab: Tab = isTab(statusParam) ? statusParam : 'all'
  const topicParam = params.get('topic')
  const topic = isTopic(topicParam) ? topicParam : undefined
  const search = params.get('search') ?? ''
  const sortBy = params.get('sortBy') === 'createdAt' ? 'createdAt' : 'status'
  const defaultDirection = sortBy === 'createdAt' ? 'desc' : 'asc'
  const sortParam = params.get('sort')
  const sort =
    sortParam === 'asc' || sortParam === 'desc' ? sortParam : defaultDirection
  const page = Math.max(1, Number(params.get('page')) || 1)

  const [searchInput, setSearchInput] = useState(search)

  const update = (patch: Record<string, string | undefined>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true },
    )

  useEffect(() => {
    if (searchInput === search) return
    const timer = setTimeout(
      () =>
        update({ search: searchInput.trim() || undefined, page: undefined }),
      SEARCH_DELAY_MS,
    )
    return () => clearTimeout(timer)
  }, [searchInput, search])

  const { inbox, error, isLoading, retry } = useSupportInbox({
    status: tab === 'all' ? undefined : tab,
    topic,
    search: search || undefined,
    sortBy,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  useEffect(() => {
    if (inbox && inbox.feedback.length === 0 && inbox.total > 0 && page > 1) {
      update({ page: undefined })
    }
  }, [inbox, page])

  const counts = inbox?.counts
  const allCount = counts
    ? counts.unread + counts.read + counts.unreplied + counts.replied
    : undefined

  const columns: ColumnDef<SupportInboxRow>[] = useMemo(
    () => [
      {
        key: 'user',
        header: 'From',
        render: (row) => (
          <div className={styles.person}>
            <Avatar
              firstName={row.user.firstName}
              lastName={row.user.lastName}
              src={row.user.profileImageUrl}
              size="sm"
            />
            <div className={styles.personText}>
              <span className={styles.personName}>
                {row.user.firstName} {row.user.lastName}
              </span>
              <span className={styles.personMeta}>
                {roleLabel(row.user.userRole)} · {row.user.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'request',
        header: 'Request',
        render: (row) => (
          <div className={styles.requestCell}>
            <span className={styles.topicChip}>{topicLabel(row.topic)}</span>
            <span className={styles.preview}>
              {row.subject ? `${row.subject}: ` : ''}
              {row.preview}
            </span>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortLabel: 'Status',
        sortAccessor: (row) => SUPPORT_STATUS_RANK[row.status],
        render: (row) => <SupportStatusBadge status={row.status} />,
      },
      {
        key: 'ai',
        header: 'AI',
        hideBelow: 900,
        render: (row) => <AiCell row={row} />,
      },
      {
        key: 'createdAt',
        header: 'Received',
        sortLabel: 'Received',
        sortAccessor: (row) => new Date(row.createdAt).getTime(),
        render: (row) => (
          <time
            dateTime={row.createdAt}
            title={new Date(row.createdAt).toLocaleString()}>
            {formatTimeAgo(row.createdAt)}
          </time>
        ),
      },
      {
        key: 'repliedAt',
        header: 'Replied',
        hideBelow: 720,
        render: (row) =>
          row.repliedAt ? (
            <span className={styles.replied}>
              {formatTimeAgo(row.repliedAt)}
              {row.replyEmailStatus === 'failed' && (
                <span className={styles.emailFailed}>Email failed</span>
              )}
            </span>
          ) : (
            '—'
          ),
      },
    ],
    [],
  )

  const filtersActive = !!search || !!topic
  const empty = !!inbox && inbox.feedback.length === 0

  return (
    <div className={styles.page}>
      <PageHeaderTitle
        title="Support"
        description="Every request from talents and recruiters. Replies reach them in the app and by email."
      />

      <Tabs
        tabs={TABS.map((key) => ({
          key,
          label: key === 'all' ? 'All' : SUPPORT_STATUS_STYLE[key].label,
          count: key === 'all' ? allCount : counts?.[key],
        }))}
        activeKey={tab}
        onChange={(key) =>
          update({ status: key === 'all' ? undefined : key, page: undefined })
        }
      />

      <FilterBar
        fields={FILTER_FIELDS}
        filters={{ search: searchInput, topic: topic ?? '' }}
        defaultFilters={DEFAULT_FILTERS}
        onChange={(next) => {
          setSearchInput(next.search)
          if ((next.topic || undefined) !== topic) {
            update({ topic: next.topic || undefined, page: undefined })
          }
        }}
        ariaLabel="Filter support requests"
      />

      {error && !inbox ? (
        <Alert variant="error" className={styles.loadError}>
          <span>We couldn’t load support requests.</span>
          <Button size="sm" variant="outline" onClick={retry}>
            Retry
          </Button>
        </Alert>
      ) : empty ? (
        <EmptyState
          title={
            filtersActive
              ? 'No requests match these filters'
              : EMPTY_COPY[tab].title
          }
          description={
            filtersActive
              ? 'Try another search or topic.'
              : EMPTY_COPY[tab].description
          }
        />
      ) : (
        <>
          <TableToolbar
            columns={columns}
            resultsCount={inbox?.total ?? 0}
            visibleColumnKeys={columns.map((column) => column.key)}
            onToggleColumn={() => {}}
            sortKey={sortBy}
            sortDirection={sort}
            onSortChange={(key, direction) =>
              update({
                sortBy: key === 'createdAt' ? 'createdAt' : undefined,
                sort: direction,
                page: undefined,
              })
            }
          />
          <DataTable
            columns={columns}
            data={inbox?.feedback ?? []}
            isLoading={isLoading && !inbox}
            getRowKey={(row) => row.id}
            getRowClassName={(row) =>
              !row.isRead && row.status !== 'replied' ? styles.unreadRow : ''
            }
            showRowNumber={false}
            sortKey={sortBy}
            sortDirection={sort}
            onSortChange={(key, direction) =>
              update({
                sortBy: key === 'createdAt' ? 'createdAt' : undefined,
                sort: direction,
                page: undefined,
              })
            }
            onRowClick={(row) => navigate(`/adminDashboard/support/${row.id}`)}
            ariaLabel="Support requests"
          />
          {inbox && inbox.total > PAGE_SIZE && (
            <Pagination
              totalItems={inbox.total}
              itemsPerPage={PAGE_SIZE}
              currentPage={page}
              onPageChange={(next) =>
                update({ page: next > 1 ? String(next) : undefined })
              }
            />
          )}
        </>
      )}
    </div>
  )
}

export default SupportInbox
