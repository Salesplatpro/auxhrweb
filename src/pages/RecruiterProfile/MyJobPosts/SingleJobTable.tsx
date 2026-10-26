import React from 'react'
import { BsArrowRepeat, BsThreeDotsVertical } from 'react-icons/bs'
import { Tooltip as ReactTooltip } from 'react-tooltip'

import {
  Avatar,
  Button,
  ColumnDef,
  DataTable,
  Dropdown,
  DropdownItem,
  EmptyState,
  MatchScoreRing,
  Spinner,
  StatusBadge,
  TableActions,
} from '../../../components'
import { isRowStuck } from '../../../features/admin/applicationFollowUp'
import { JobAiConfigThresholds } from '../../../features/applications/services/applicationService'
import { formatTimeAgo, SingleJobDetails } from '../../../utils'
import { getStatusBadge } from '../getJobStatus'

type SingleJobTableProps = {
  applications: SingleJobDetails[]
  jobAiConfig?: JobAiConfigThresholds | null
  selectedRowKeys?: Set<string>
  onToggleRow?: (key: string | number) => void
  onToggleAll?: (keys: (string | number)[]) => void
  /** Omit all three (e.g. an admin's read-only view) to hide the actions dropdown entirely. */
  onShortlist?: (applicationId: string) => void
  onReject?: (applicationId: string) => void
  onMessage?: (applicationId: string) => void
  onOpenDossier?: (item: SingleJobDetails) => void
  /** Regenerates the AI match for one candidate — shown on failed/stuck cells. */
  onRegenerateMatch?: (applicationId: string) => void
  /** Application id currently regenerating its AI match — shows a spinner on that row's ring. */
  regeneratingRowId?: string | null
  /** Recalculates a missing CV match score — omit when the job has CV matching off. */
  onRetryCvScore?: (applicationId: string) => void
  /** Application id currently recalculating its CV match score. */
  retryingCvScoreRowId?: string | null
  /** Application id currently being updated (e.g. via a row-level shortlist/reject) — shows a spinner in that row's actions cell instead of a static disabled state. */
  loadingRowId?: string | null
  visibleColumnKeys?: string[]
  sortKey?: string | null
  sortDirection?: 'asc' | 'desc'
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void
}

const formatAbsoluteDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

// Single source of truth for column labels — TableToolbar derives its
// "Columns" picker / "Sort by" select straight from these column defs
// (via each column's `toggleable`/`sortAccessor`/`header`), so they can't drift.
const COLUMN_LABELS: Record<string, string> = {
  name: 'Name',
  status: 'Job Status',
  aiMatch: 'AI Match',
  dateApplied: 'Date Applied',
  details: 'Details',
}

const MANDATORY_COLUMN_KEYS = ['name', 'details']

// high -> medium -> low -> no verdict (completed but failed/unavailable) ->
// still screening. Shared by the aiMatch column's own sortAccessor
// (single-key toolbar sort) and compareByAiMatch below (the default
// page-load sort, which adds averageScore/createdAt tie-breakers).
const VERDICT_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }
const verdictRank = (
  verdict: SingleJobDetails['matchVerdict'],
  currentStage?: SingleJobDetails['currentStage'],
) => {
  if (currentStage && currentStage !== 'completed') return 4
  return verdict ? VERDICT_ORDER[verdict] : 3
}

// Default sort for the applicant table: best AI match first. A single
// sortAccessor can't express three tie-break levels without fragile numeric
// encoding (a date difference could overflow/outweigh a small score
// difference), so this is a real multi-level comparator instead.
export const compareByAiMatch = (
  a: SingleJobDetails,
  b: SingleJobDetails,
): number => {
  const verdictDiff =
    verdictRank(a.matchVerdict, a.currentStage) -
    verdictRank(b.matchVerdict, b.currentStage)
  if (verdictDiff !== 0) return verdictDiff

  const scoreOf = (item: SingleJobDetails) =>
    item.overallFitScore ??
    item.matchAnalysis?.overallFitScore ??
    item.averageScore ??
    0
  const scoreDiff = scoreOf(b) - scoreOf(a) // desc
  if (scoreDiff !== 0) return scoreDiff

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // desc
}

// A short, plain-English hint shown on hover so a recruiter can judge a
// candidate from the table without opening the dossier.
const matchTooltipContent = (item: SingleJobDetails): string | undefined => {
  if (item.currentStage && item.currentStage !== 'completed') {
    return 'Still screening — the AI match appears once this candidate finishes the pipeline.'
  }
  if (item.matchVerdictStatus === 'failed') {
    return 'AI match generation failed. Click the refresh icon to try again.'
  }
  if (!item.matchVerdict) return undefined
  const summary = item.matchAnalysis?.whyFit || item.matchVerdictReasoning
  if (!summary) return undefined
  return summary.length > 220 ? `${summary.slice(0, 217)}…` : summary
}

interface ApplicantActionsCellProps {
  item: SingleJobDetails
  onShortlist?: (applicationId: string) => void
  onReject?: (applicationId: string) => void
  onMessage?: (applicationId: string) => void
  isLoading?: boolean
}

const ApplicantActionsCell = ({
  item,
  onShortlist,
  onReject,
  onMessage,
  isLoading,
}: ApplicantActionsCellProps) => {
  if (isLoading) {
    return <Spinner size="sm" />
  }

  if (!onShortlist && !onReject && !onMessage) {
    return null
  }

  const items: DropdownItem[] = (
    [
      onShortlist && {
        label: 'Shortlist',
        onClick: () => onShortlist(item.id),
      },
      onReject && { label: 'Reject', onClick: () => onReject(item.id) },
      onMessage && { label: 'Message', onClick: () => onMessage(item.id) },
    ] as (DropdownItem | undefined)[]
  ).filter((entry): entry is DropdownItem => Boolean(entry))

  return <Dropdown trigger={<BsThreeDotsVertical />} items={items} />
}

const AiMatchDisplay = ({
  item,
  onRegenerateMatch,
  isRegenerating,
}: {
  item: SingleJobDetails
  onRegenerateMatch?: (applicationId: string) => void
  isRegenerating?: boolean
}) => {
  const canRegenerate =
    onRegenerateMatch &&
    item.currentStage === 'completed' &&
    (item.matchVerdictStatus === 'failed' || !item.matchVerdict)
  const tooltip = matchTooltipContent(item)

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <div
        data-tooltip-id={tooltip ? 'ai-match-tooltip' : undefined}
        data-tooltip-content={tooltip}>
        <MatchScoreRing
          verdict={item.matchVerdict ?? null}
          overallFitScore={
            item.overallFitScore ?? item.matchAnalysis?.overallFitScore ?? null
          }
          averageScore={item.averageScore ?? null}
          cvSimilarityScore={item.cvSimilarityScore ?? null}
          failed={item.matchVerdictStatus === 'failed'}
          currentStage={item.currentStage}
        />
      </div>
      {canRegenerate ? (
        <button
          type="button"
          aria-label="Regenerate AI match"
          title="Regenerate AI match"
          disabled={isRegenerating}
          onClick={(event) => {
            event.stopPropagation()
            onRegenerateMatch(item.id)
          }}
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-muted)',
            cursor: isRegenerating ? 'default' : 'pointer',
            padding: 0,
          }}>
          {isRegenerating ? <Spinner size="sm" /> : <BsArrowRepeat size={12} />}
        </button>
      ) : null}
    </div>
  )
}

const CvScoreRetry = ({
  item,
  onRetry,
  isRetrying,
}: {
  item: SingleJobDetails
  onRetry: (applicationId: string) => void
  isRetrying?: boolean
}) => (
  <button
    type="button"
    disabled={isRetrying}
    onClick={(event) => {
      event.stopPropagation()
      onRetry(item.id)
    }}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'none',
      border: 'none',
      padding: 0,
      fontSize: 'var(--text-xs)',
      color: 'var(--color-primary)',
      textDecoration: 'underline',
      cursor: isRetrying ? 'default' : 'pointer',
    }}>
    {isRetrying ? <Spinner size="sm" /> : <BsArrowRepeat size={12} />}
    Retry CV score
  </button>
)

const AiMatchCell = ({
  item,
  onOpen,
  onRegenerateMatch,
  isRegenerating,
}: {
  item: SingleJobDetails
  onOpen: (item: SingleJobDetails) => void
  onRegenerateMatch?: (applicationId: string) => void
  isRegenerating?: boolean
}) => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={`View AI Match for ${item.talent.firstName} ${item.talent.lastName}`}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}>
      <AiMatchDisplay
        item={item}
        onRegenerateMatch={onRegenerateMatch}
        isRegenerating={isRegenerating}
      />
    </button>
  </div>
)

export const buildColumns = ({
  onShortlist,
  onReject,
  onMessage,
  loadingRowId,
  onOpenAiMatch,
  onRegenerateMatch,
  regeneratingRowId,
  onRetryCvScore,
  retryingCvScoreRowId,
}: {
  onShortlist?: (applicationId: string) => void
  onReject?: (applicationId: string) => void
  onMessage?: (applicationId: string) => void
  loadingRowId?: string | null
  onOpenAiMatch?: (item: SingleJobDetails) => void
  onRegenerateMatch?: (applicationId: string) => void
  regeneratingRowId?: string | null
  onRetryCvScore?: (applicationId: string) => void
  retryingCvScoreRowId?: string | null
}): ColumnDef<SingleJobDetails>[] => [
  {
    key: 'name',
    header: COLUMN_LABELS.name,
    render: (item) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar
          firstName={item.talent.firstName}
          lastName={item.talent.lastName}
        />
        <div style={{ textAlign: 'left' }}>
          <div>
            {item.talent.firstName} {item.talent.lastName}
          </div>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
            }}>
            {item.talent.email}
          </div>
        </div>
      </div>
    ),
    sortAccessor: (item) => `${item.talent.firstName} ${item.talent.lastName}`,
  },
  {
    key: 'status',
    header: COLUMN_LABELS.status,
    align: 'center',
    hideBelow: 768,
    toggleable: true,
    render: (item) => (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}>
        <StatusBadge
          status={item.status}
          showDot
          {...getStatusBadge(item.status)}
        />
        {isRowStuck(item) && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-warning-600)',
            }}
            title="No progress for 1+ day">
            Stuck
          </span>
        )}
      </div>
    ),
    sortAccessor: (item) => item.status,
  },
  {
    key: 'aiMatch',
    header: COLUMN_LABELS.aiMatch,
    align: 'center',
    hideBelow: 900,
    toggleable: true,
    render: (item) => (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}>
        {onOpenAiMatch ? (
          <AiMatchCell
            item={item}
            onOpen={onOpenAiMatch}
            onRegenerateMatch={onRegenerateMatch}
            isRegenerating={item.id === regeneratingRowId}
          />
        ) : (
          <AiMatchDisplay
            item={item}
            onRegenerateMatch={onRegenerateMatch}
            isRegenerating={item.id === regeneratingRowId}
          />
        )}
        {onRetryCvScore && item.cvSimilarityScore == null ? (
          <CvScoreRetry
            item={item}
            onRetry={onRetryCvScore}
            isRetrying={item.id === retryingCvScoreRowId}
          />
        ) : null}
      </div>
    ),
    sortAccessor: (item) => verdictRank(item.matchVerdict, item.currentStage),
  },
  {
    key: 'dateApplied',
    header: COLUMN_LABELS.dateApplied,
    align: 'center',
    hideBelow: 768,
    toggleable: true,
    render: (item) => (
      <div>
        <div>{formatTimeAgo(item.createdAt)}</div>
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
          }}>
          {formatAbsoluteDate(item.createdAt)}
        </div>
      </div>
    ),
    sortAccessor: (item) => new Date(item.createdAt).getTime(),
  },
  {
    key: 'details',
    header: COLUMN_LABELS.details,
    align: 'right',
    render: (item) => (
      <TableActions onClick={(event) => event.stopPropagation()}>
        {onOpenAiMatch ? (
          <Button size="sm" onClick={() => onOpenAiMatch(item)}>
            View Application
          </Button>
        ) : null}
        <ApplicantActionsCell
          item={item}
          onShortlist={onShortlist}
          onReject={onReject}
          onMessage={onMessage}
          isLoading={item.id === loadingRowId}
        />
      </TableActions>
    ),
  },
]

export const SingleJobTable = ({
  applications,
  jobAiConfig: _jobAiConfig,
  selectedRowKeys,
  onToggleRow,
  onToggleAll,
  onShortlist,
  onReject,
  onMessage,
  loadingRowId,
  visibleColumnKeys,
  sortKey,
  sortDirection,
  onSortChange,
  onOpenDossier,
  onRegenerateMatch,
  regeneratingRowId,
  onRetryCvScore,
  retryingCvScoreRowId,
}: SingleJobTableProps) => {
  const allColumns = buildColumns({
    onShortlist,
    onReject,
    onMessage,
    loadingRowId,
    onOpenAiMatch: onOpenDossier,
    onRegenerateMatch,
    regeneratingRowId,
    onRetryCvScore,
    retryingCvScoreRowId,
  })
  const columns = visibleColumnKeys
    ? allColumns.filter(
        (col) =>
          MANDATORY_COLUMN_KEYS.includes(col.key) ||
          visibleColumnKeys.includes(col.key),
      )
    : allColumns

  return (
    <>
      <DataTable
        columns={columns}
        data={applications}
        getRowKey={(item) => item.id}
        ariaLabel="Job applications table"
        selectedRowKeys={selectedRowKeys}
        onToggleRow={onToggleRow}
        onToggleAll={onToggleAll}
        onRowClick={onOpenDossier}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
        emptyState={
          <EmptyState
            title="No applications yet"
            description="Applications for this job will appear here once candidates apply."
          />
        }
      />
      <ReactTooltip
        id="ai-match-tooltip"
        place="top"
        style={{ maxWidth: 260, zIndex: 20 }}
      />
    </>
  )
}
