import React, { useMemo, useState } from 'react'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { HiOutlineViewfinderCircle } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { HeroAction, PageHero } from '@/components/layout/PageHero'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import {
  ColumnDef,
  DataTable,
  TableActions,
  TableToolbar,
} from '@/components/ui/DataTable'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { FilterBar } from '@/components/ui/FilterBar'
import type { FilterFieldConfig } from '@/components/ui/FilterPanel'
import { MatchScoreRing } from '@/components/ui/MatchScoreRing'
import { Pagination } from '@/components/ui/Pagination'
import { scoutPaths } from '@/features/scout/paths'
import type { ScoutCampaignRow } from '@/features/scout/types'
import {
  useDeleteScoutCampaignMutation,
  useGetScoutCampaignsQuery,
} from '@/redux/api/recruiter'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './ScoutCampaigns.module.scss'

const ROWS_PER_PAGE = 10

type Filters = { search: string }

const DEFAULT_FILTERS: Filters = { search: '' }

const relativeTime = (iso: string | null): string => {
  if (!iso) return 'No activity yet'
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

const ActionsCell = ({
  row,
  onDelete,
}: {
  row: ScoutCampaignRow
  onDelete: (row: ScoutCampaignRow) => void
}) => {
  const navigate = useNavigate()

  const items: DropdownItem[] = [
    {
      label: 'View campaign',
      onClick: () => navigate(scoutPaths.campaign(row.id)),
    },
    {
      label: 'Edit campaign',
      onClick: () => navigate(scoutPaths.editCampaign(row.id)),
    },
    { label: 'Delete', onClick: () => onDelete(row) },
  ]

  return (
    <TableActions>
      <Button
        variant="primary"
        size="sm"
        onClick={() => navigate(scoutPaths.upload(row.id))}>
        Upload CVs
      </Button>
      <Dropdown trigger={<BsThreeDotsVertical />} items={items} />
    </TableActions>
  )
}

export const ScoutCampaigns = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [toDelete, setToDelete] = useState<ScoutCampaignRow | null>(null)
  const [sortKey, setSortKey] = useState('lastActivityAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Server-side pagination — the previous screen fetched a hard-coded 100 rows and
  // sliced them in the browser, so page 11 simply did not exist.
  const { data, isLoading, isError } = useGetScoutCampaignsQuery({
    limit: ROWS_PER_PAGE,
    offset: (page - 1) * ROWS_PER_PAGE,
    search: filters.search,
  })

  const [deleteCampaign, { isLoading: isDeleting }] =
    useDeleteScoutCampaignMutation()

  const campaigns = data?.data?.scoutJobs ?? []
  const total = data?.data?.total ?? 0

  const filterFields: FilterFieldConfig<Filters>[] = useMemo(
    () => [
      {
        type: 'search',
        key: 'search',
        label: 'Search campaigns',
        placeholder: 'Search by campaign or role',
      },
    ],
    [],
  )

  const columns: ColumnDef<ScoutCampaignRow>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Campaign',
        sortAccessor: (row) => row.name,
        render: (row) => (
          <div className={styles.nameCell}>
            <span className={styles.name}>{row.name}</span>
            <span className={styles.role}>
              {row.role?.name ?? 'No role set'}
            </span>
          </div>
        ),
      },
      {
        key: 'cvsScanned',
        header: 'CVs scanned',
        align: 'center',
        hideBelow: 640,
        sortAccessor: (row) => row.cvsScanned,
        render: (row) => (
          <span className={styles.count}>
            {row.cvsScanned}
            {row.runCount > 0 && (
              <span className={styles.runs}>
                {row.runCount === 1 ? '1 run' : `${row.runCount} runs`}
              </span>
            )}
          </span>
        ),
      },
      {
        key: 'bestScore',
        header: 'Best match',
        align: 'center',
        hideBelow: 768,
        sortAccessor: (row) => row.bestScore ?? -1,
        render: (row) =>
          row.bestScore == null ? (
            <span className={styles.muted}>—</span>
          ) : (
            <MatchScoreRing
              verdict={
                row.bestScore >= 75
                  ? 'high'
                  : row.bestScore >= 50
                  ? 'medium'
                  : 'low'
              }
              averageScore={row.bestScore}
            />
          ),
      },
      {
        key: 'lastActivityAt',
        header: 'Last activity',
        hideBelow: 900,
        sortAccessor: (row) =>
          row.lastActivityAt ? new Date(row.lastActivityAt).getTime() : 0,
        render: (row) => (
          <span className={styles.muted}>
            {relativeTime(row.lastActivityAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (row) => <ActionsCell row={row} onDelete={setToDelete} />,
      },
    ],
    [],
  )

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteCampaign(toDelete.id).unwrap()
      notify('success', 'Campaign deleted')
      setToDelete(null)
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not delete this campaign'))
    }
  }

  const hasFilters = filters.search.trim().length > 0

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="Scouting"
        title="Your scouting campaigns"
        lead="Upload a batch of CVs and let the AI rank the best fits against what you're looking for."
        actions={
          <HeroAction to={scoutPaths.newCampaign}>New campaign</HeroAction>
        }
      />

      {isError ? (
        <EmptyState
          title="Couldn't load your campaigns"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : !isLoading && campaigns.length === 0 && !hasFilters ? (
        <EmptyState
          icon={<HiOutlineViewfinderCircle />}
          title="No campaigns yet"
          description="Create a campaign to describe the role you're hiring for, then upload CVs and the AI will shortlist the best fits."
          action={
            <Button onClick={() => navigate(scoutPaths.newCampaign)}>
              Create your first campaign
            </Button>
          }
        />
      ) : (
        <>
          <FilterBar
            fields={filterFields}
            filters={filters}
            defaultFilters={DEFAULT_FILTERS}
            onChange={(next) => {
              setFilters(next)
              setPage(1)
            }}
            ariaLabel="Filter campaigns"
          />

          <TableToolbar
            columns={columns}
            resultsCount={total}
            visibleColumnKeys={columns.map((column) => column.key)}
            onToggleColumn={() => undefined}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={(key, direction) => {
              setSortKey(key)
              setSortDirection(direction)
            }}
            exportConfig={{
              rows: campaigns,
              headers: [
                'Campaign',
                'Role',
                'CVs scanned',
                'Runs',
                'Best match',
                'Created',
              ],
              toCsvRow: (row) => [
                row.name,
                row.role?.name ?? '',
                String(row.cvsScanned),
                String(row.runCount),
                row.bestScore == null ? '' : String(row.bestScore),
                new Date(row.createdAt).toLocaleDateString(),
              ],
              filename: 'scouting-campaigns.csv',
            }}
          />

          <DataTable
            columns={columns}
            data={campaigns}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={(key, direction) => {
              setSortKey(key)
              setSortDirection(direction)
            }}
            isLoading={isLoading}
            getRowKey={(row) => row.id}
            ariaLabel="Scouting campaigns"
            showRowNumber={false}
            onRowClick={(row) => navigate(scoutPaths.campaign(row.id))}
            emptyState={
              <EmptyState
                title="No campaigns match that search"
                description="Try a different name or role."
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

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this campaign?"
        message={`This permanently removes "${
          toDelete?.name ?? ''
        }" and every CV scored under it. Candidates already in the talent pool stay there.`}
        confirmLabel="Delete campaign"
        variant="danger"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </PageShell>
  )
}
