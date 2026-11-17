import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHero } from '@/components/layout/PageHero'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import {
  ColumnDef,
  DataTable,
  sortByAccessor,
  TableToolbar,
} from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar, FilterFieldConfig } from '@/components/ui/FilterPanel'
import { VerdictBadge } from '@/components/ui/VerdictBadge'
import { useBroadcastMessage } from '@/features/messaging/hooks/useBroadcastMessage'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { notify } from '@/utils/toastNotifications'

import { useGetRecruiterShortlistQuery } from '../../../redux/api/recruiter'
import { capitalizeEachWord } from '../../../utils/CapitalizeWord'
import { AddEmployeePanel, ApplicantToHire } from '../People/AddEmployeePanel'
import styles from './Shortlist.module.scss'

interface ShortlistedApplication {
  id: string
  jobId: string
  status: string
  createdAt: string
  role?: { name: string } | null
  talent: { id: string; firstName: string; lastName: string; email: string }
  matchVerdict?: 'high' | 'medium' | 'low' | null
  averageScore?: number | null
}

type SortDirection = 'asc' | 'desc'

// high -> medium -> low -> no verdict, mirroring SingleJobTable's ordering.
const VERDICT_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }
const verdictRank = (verdict: ShortlistedApplication['matchVerdict']) =>
  verdict ? VERDICT_ORDER[verdict] : 3
// Single numeric key encoding "verdict order, then averageScore desc" so a
// single-key sortByAccessor can express both levels at once.
const verdictSortValue = (row: ShortlistedApplication) =>
  verdictRank(row.matchVerdict) * 1000 + (100 - (row.averageScore ?? 0))

interface ShortlistFilterValues {
  search: string
}

const defaultShortlistFilters: ShortlistFilterValues = { search: '' }

const SHORTLIST_FILTER_FIELDS: FilterFieldConfig<ShortlistFilterValues>[] = [
  {
    type: 'search',
    key: 'search',
    label: 'Search',
    placeholder: 'Search by talent name',
  },
]

export const Shortlist = () => {
  const { data, isLoading } = useGetRecruiterShortlistQuery({})
  const { sendBroadcast, isBroadcasting } = useBroadcastMessage()
  const [filters, setFilters] = useState<ShortlistFilterValues>(
    defaultShortlistFilters,
  )
  const [sortKey, setSortKey] = useState('verdict')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(new Set())
  const [messageOpen, setMessageOpen] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [hiring, setHiring] = useState<ApplicantToHire | null>(null)
  const { organizationId, canManagePeople } = usePeopleAccess()
  const { profile } = useProfile()

  const handleSortChange = (key: string, direction: SortDirection) => {
    setSortKey(key)
    setSortDirection(direction)
  }

  const applicationsRaw: ShortlistedApplication[] = Array.isArray(
    data?.data?.applications,
  )
    ? data.data.applications
    : []

  const query = filters.search.trim().toLowerCase()
  const filteredApplications = query
    ? applicationsRaw.filter((row) =>
        `${row.talent.firstName} ${row.talent.lastName}`
          .toLowerCase()
          .includes(query),
      )
    : applicationsRaw

  const columns: ColumnDef<ShortlistedApplication>[] = [
    {
      key: 'role',
      header: 'Role',
      sortLabel: 'Role',
      render: (row) => capitalizeEachWord(row.role?.name ?? 'Unknown role'),
      sortAccessor: (row) => row.role?.name,
    },
    {
      key: 'talent',
      header: 'Talent Name',
      sortLabel: 'Talent Name',
      render: (row) => `${row.talent.firstName} ${row.talent.lastName}`,
      sortAccessor: (row) => `${row.talent.firstName} ${row.talent.lastName}`,
    },
    {
      key: 'verdict',
      header: 'AI Match',
      sortLabel: 'AI Match',
      align: 'center',
      render: (row) => (
        <VerdictBadge verdict={row.matchVerdict ?? null} compact />
      ),
      sortAccessor: verdictSortValue,
    },
    {
      key: 'status',
      header: 'Status',
      hideBelow: 768,
      render: (row) => capitalizeEachWord(row.status.replace(/_/g, ' ')),
    },
    {
      key: 'createdAt',
      header: 'Shortlisted On',
      sortLabel: 'Shortlisted On',
      hideBelow: 640,
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortAccessor: (row) => row.createdAt,
    },
    {
      key: 'actions',
      header: '',
      align: 'center',
      render: (row) => (
        <div className={styles.rowActions}>
          <Link
            to={`/recruiterDashboard/singleJobPost/${row.jobId}?applicationId=${row.id}`}>
            <Button size="sm">Details</Button>
          </Link>
          {canManagePeople && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setHiring({
                  applicationId: row.id,
                  fullName:
                    `${row.talent.firstName} ${row.talent.lastName}`.trim(),
                  email: row.talent.email,
                  jobTitle: capitalizeEachWord(row.role?.name ?? ''),
                })
              }>
              Add as employee
            </Button>
          )}
        </div>
      ),
    },
  ]

  const sortColumn = columns.find((col) => col.key === sortKey)
  const applications = sortColumn?.sortAccessor
    ? sortByAccessor(
        filteredApplications,
        sortColumn.sortAccessor,
        sortDirection,
      )
    : filteredApplications

  const handleMessageSelected = async () => {
    if (!messageContent.trim()) {
      notify('error', 'Message cannot be empty', { autoClose: 2000 })
      return
    }
    const selected = applications.filter((row) => selectedRowKeys.has(row.id))
    if (selected.length === 0) return
    const byJob = new Map<string, ShortlistedApplication[]>()
    for (const row of selected) {
      const list = byJob.get(row.jobId) ?? []
      list.push(row)
      byJob.set(row.jobId, list)
    }
    try {
      for (const rows of byJob.values()) {
        const first = rows[0]
        if (!first) continue
        await sendBroadcast({
          application: first.id,
          content: messageContent,
          talentIds: rows.map((row) => row.talent.id),
        })
      }
      notify('success', 'Message sent to selected talents', { autoClose: 2000 })
      setMessageContent('')
      setMessageOpen(false)
      setSelectedRowKeys(new Set())
    } catch {
      notify('error', 'Failed to send message', { autoClose: 2000 })
    }
  }

  return (
    <PageShell wide>
      <PageHero
        compact
        title="Shortlist"
        lead="View shortlisted talents ready for the next stage"
      />
      <div className={styles.layout}>
        <FilterBar
          fields={SHORTLIST_FILTER_FIELDS}
          filters={filters}
          defaultFilters={defaultShortlistFilters}
          onChange={setFilters}
          ariaLabel="Filter shortlist"
        />
        <TableToolbar
          columns={columns}
          resultsCount={applications.length}
          visibleColumnKeys={[]}
          onToggleColumn={() => {}}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
        <DataTable
          columns={columns}
          data={applications}
          isLoading={isLoading}
          getRowKey={(row) => row.id}
          selectedRowKeys={selectedRowKeys}
          onToggleRow={(key) => {
            setSelectedRowKeys((prev) => {
              const next = new Set(prev)
              const id = String(key)
              if (next.has(id)) next.delete(id)
              else next.add(id)
              return next
            })
          }}
          onToggleAll={(keys) => setSelectedRowKeys(new Set(keys.map(String)))}
          ariaLabel="Shortlisted applications"
          emptyState={
            <EmptyState
              title="No shortlisted applications yet"
              description="Shortlist strong applicants from a job post and they will land here, ready for the next conversation."
            />
          }
        />
        {selectedRowKeys.size > 0 && (
          <div className={styles.bulkActions}>
            <Button
              size="sm"
              loading={isBroadcasting}
              onClick={() => setMessageOpen(true)}>
              Message selected
            </Button>
          </div>
        )}
        {messageOpen && (
          <div className={styles.composer}>
            <label className={styles.composerLabel} htmlFor="shortlist-message">
              Your message
            </label>
            <textarea
              id="shortlist-message"
              className={styles.textarea}
              placeholder="Type your message..."
              value={messageContent}
              onChange={(event) => setMessageContent(event.target.value)}
            />
            <div className={styles.composerActions}>
              <Button variant="outline" onClick={() => setMessageOpen(false)}>
                Cancel
              </Button>
              <Button loading={isBroadcasting} onClick={handleMessageSelected}>
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
      {organizationId && hiring && (
        <AddEmployeePanel
          open
          organizationId={organizationId}
          companyName={profile?.activeOrganization?.name ?? 'your company'}
          applicant={hiring}
          onClose={() => setHiring(null)}
        />
      )}
    </PageShell>
  )
}
