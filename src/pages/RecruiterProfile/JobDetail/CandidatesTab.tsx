import React, { useCallback, useState } from 'react'
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import { LuFilter, LuShieldCheck, LuVideo } from 'react-icons/lu'

import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar } from '@/components/ui/FilterBar'
import { FilterFieldConfig } from '@/components/ui/FilterPanel'
import { Pagination } from '@/components/ui/Pagination'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Spinner } from '@/components/ui/Spinner'
import { useBulkUpdateApplicationStatus } from '@/features/applications/hooks/useBulkUpdateApplicationStatus'
import { useJobApplications } from '@/features/applications/hooks/useJobApplications'
import { useRevalidateJob } from '@/features/applications/hooks/useRevalidateJob'
import {
  downloadBulkFitReport,
  JobApplicationsQuery,
  retryMissingVerdicts,
} from '@/features/applications/services/applicationService'
import { useDebouncedValue } from '@/hooks'
import { getErrorMessage } from '@/utils/getErrorMessage'
import type {
  InterviewProgress,
  SingleJobDetails,
  VerificationState,
} from '@/utils/recruiterJobPostsTypes'
import { notify } from '@/utils/toastNotifications'

import {
  AiMessageComposer,
  AiMessageComposerTarget,
} from '../MyJobPosts/Messaging/AiMessageComposer'
import listStyles from '../MyJobPosts/MyJobPosts.module.scss'
import { ToolbarTrigger } from '../MyJobPosts/ToolbarTrigger'
import {
  INTERVIEW_FILTERS,
  SOURCE_FILTERS,
  VERIFICATION_FILTERS,
} from './candidateLabels'
import styles from './Candidates.module.scss'
import { CandidatesBoard } from './CandidatesBoard'
import { CandidatesList } from './CandidatesList'

const PAGE_SIZE = 10

type View = 'board' | 'list'
type Sort = NonNullable<JobApplicationsQuery['sort']>

const SORTS: { value: Sort; label: string }[] = [
  { value: 'cvSimilarity', label: 'CV Match' },
  { value: 'aiMatch', label: 'AI Match' },
  { value: 'dateApplied', label: 'Newest' },
]

interface MoreFilters {
  status: string
  matchVerdict: string
}

const DEFAULT_MORE_FILTERS: MoreFilters = { status: 'all', matchVerdict: 'all' }

const MORE_FILTER_FIELDS: FilterFieldConfig<MoreFilters>[] = [
  {
    type: 'select',
    key: 'status',
    label: 'Status',
    offValue: 'all',
    options: [
      { value: 'all', label: 'Any status' },
      { value: 'pending', label: 'Pending' },
      { value: 'awaiting_decision', label: 'Awaiting decision' },
      { value: 'shortlisted', label: 'Shortlisted' },
      { value: 'rejected', label: 'Rejected' },
    ],
  },
  {
    type: 'select',
    key: 'matchVerdict',
    label: 'AI match',
    offValue: 'all',
    options: [
      { value: 'all', label: 'Any AI match' },
      { value: 'high', label: 'Strong' },
      { value: 'medium', label: 'Good' },
      { value: 'low', label: 'Weak' },
    ],
  },
]

const toTarget = (application: SingleJobDetails): AiMessageComposerTarget => ({
  id: application.id,
  talentId: application.talent.id,
  talentName:
    `${application.talent.firstName} ${application.talent.lastName}`.trim(),
})

type CandidatesTabProps = {
  jobId: string
  onOpenCandidate: (id: string) => void
}

export const CandidatesTab = ({
  jobId,
  onOpenCandidate,
}: CandidatesTabProps) => {
  const [view, setView] = useState<View>('list')
  const [search, setSearch] = useState('')
  const [moreFilters, setMoreFilters] = useState(DEFAULT_MORE_FILTERS)
  const [source, setSource] = useState('')
  const [interview, setInterview] = useState<InterviewProgress | ''>('')
  const [verification, setVerification] = useState<VerificationState | ''>('')
  const [sort, setSort] = useState<Sort>('cvSimilarity')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string | number>>(new Set())
  const [messageTargets, setMessageTargets] = useState<
    AiMessageComposerTarget[] | null
  >(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const q = useDebouncedValue(search.trim(), 300)
  const revalidateJob = useRevalidateJob(jobId)
  const { bulkUpdateStatus, isBulkUpdating } = useBulkUpdateApplicationStatus()

  const query: JobApplicationsQuery = {
    q: q || undefined,
    sort,
    source: source || undefined,
    applicationStatus:
      moreFilters.status === 'all' ? undefined : moreFilters.status,
    matchVerdict:
      moreFilters.matchVerdict === 'all' ? undefined : moreFilters.matchVerdict,
  }

  const { data, error, isLoading, isValidating } = useJobApplications(
    view === 'list' ? jobId : undefined,
    {
      ...query,
      interview: interview || undefined,
      verification: verification || undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    },
  )
  const applications = data?.data?.applications ?? []
  const total = data?.data?.total ?? 0

  const withPageReset =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value)
      setPage(1)
      setSelected(new Set())
    }

  const openMessage = useCallback(
    (application: SingleJobDetails) =>
      setMessageTargets([toTarget(application)]),
    [],
  )

  const selectedIds = Array.from(selected).map(String)
  const selectedRows = applications.filter((row) => selected.has(row.id))

  const handleBulkStatus = async (status: 'shortlisted' | 'rejected') => {
    try {
      const result = await bulkUpdateStatus({
        applicationIds: selectedIds,
        status,
      })
      notify('success', `${result.data.updated} candidate(s) ${status}`)
      setSelected(new Set())
      await revalidateJob()
    } catch (err) {
      notify('error', getErrorMessage(err, "Couldn't update the candidates"))
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await downloadBulkFitReport(jobId, selectedIds)
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to generate report'))
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRetryMatches = async () => {
    setIsRetrying(true)
    try {
      const result = await retryMissingVerdicts(jobId, selectedIds)
      notify(
        'success',
        `Retried ${result.attempted}: ${result.succeeded} worked, ${result.failed} failed`,
      )
      await revalidateJob()
    } catch (err) {
      notify('error', getErrorMessage(err, "Couldn't retry the AI matches"))
    } finally {
      setIsRetrying(false)
    }
  }

  const sortLabel = SORTS.find((option) => option.value === sort)?.label
  const sourceText =
    SOURCE_FILTERS.find((option) => option.value === source)?.label ?? 'All'
  const verificationText =
    VERIFICATION_FILTERS.find((option) => option.value === verification)
      ?.label ?? 'All'
  const interviewText =
    INTERVIEW_FILTERS.find((option) => option.value === interview)?.label ??
    'All'

  return (
    <>
      <div className={listStyles.toolbar}>
        <label className={listStyles.search}>
          <HiOutlineMagnifyingGlass size={16} aria-hidden />
          <input
            type="search"
            value={search}
            maxLength={100}
            placeholder="Search candidates"
            aria-label="Search candidates"
            onChange={(event) => withPageReset(setSearch)(event.target.value)}
          />
        </label>
        <FilterBar
          compact
          fields={MORE_FILTER_FIELDS}
          filters={moreFilters}
          defaultFilters={DEFAULT_MORE_FILTERS}
          onChange={withPageReset(setMoreFilters)}
          ariaLabel="Candidate filters"
        />
        {view === 'list' && (
          <>
            <Dropdown
              align="left"
              trigger={
                <ToolbarTrigger
                  icon={<LuFilter size={14} aria-hidden />}
                  label={`Source: ${sourceText}`}
                />
              }
              items={SOURCE_FILTERS.map((option) => ({
                key: option.value || 'all',
                label: option.label,
                onClick: () => withPageReset(setSource)(option.value),
              }))}
            />
            <Dropdown
              align="left"
              trigger={
                <ToolbarTrigger
                  icon={<LuShieldCheck size={14} aria-hidden />}
                  label={`Verification: ${verificationText}`}
                />
              }
              items={VERIFICATION_FILTERS.map((option) => ({
                key: option.value || 'all',
                label: option.label,
                onClick: () => withPageReset(setVerification)(option.value),
              }))}
            />
            <Dropdown
              align="left"
              trigger={
                <ToolbarTrigger
                  icon={<LuVideo size={14} aria-hidden />}
                  label={`Interview: ${interviewText}`}
                />
              }
              items={INTERVIEW_FILTERS.map((option) => ({
                key: option.value || 'all',
                label: option.label,
                onClick: () => withPageReset(setInterview)(option.value),
              }))}
            />
          </>
        )}
        <Dropdown
          align="left"
          trigger={<ToolbarTrigger label={`Sort: ${sortLabel}`} />}
          items={SORTS.map((option) => ({
            key: option.value,
            label: option.label,
            onClick: () => withPageReset(setSort)(option.value),
          }))}
        />
        <div className={styles.viewSwitch}>
          <SegmentedControl
            label="Candidate view"
            options={[
              { value: 'board', label: 'Board' },
              { value: 'list', label: 'List' },
            ]}
            value={[view]}
            onChange={([next]) => withPageReset(setView)(next as View)}
          />
        </div>
      </div>

      {view === 'list' && selected.size > 0 && (
        <div className={styles.bulkBar}>
          <span>{selected.size} selected</span>
          <Button
            variant="outline"
            size="sm"
            loading={isBulkUpdating}
            onClick={() => void handleBulkStatus('rejected')}>
            Reject
          </Button>
          <Button
            size="sm"
            loading={isBulkUpdating}
            onClick={() => void handleBulkStatus('shortlisted')}>
            Shortlist
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessageTargets(selectedRows.map(toTarget))}>
            Message
          </Button>
          <Button
            variant="outline"
            size="sm"
            loading={isDownloading}
            onClick={() => void handleDownload()}>
            Download report
          </Button>
          <Button
            variant="outline"
            size="sm"
            loading={isRetrying}
            onClick={() => void handleRetryMatches()}>
            Retry AI match
          </Button>
        </div>
      )}

      {view === 'board' ? (
        <CandidatesBoard
          jobId={jobId}
          query={query}
          onOpen={onOpenCandidate}
          onMessage={openMessage}
        />
      ) : isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className={isValidating ? listStyles.refreshing : undefined}>
            <CandidatesList
              applications={applications}
              selected={selected}
              onSelectedChange={setSelected}
              onOpen={onOpenCandidate}
              onMessage={openMessage}
              emptyState={
                <EmptyState
                  title={
                    error ? "Couldn't load candidates" : 'No candidates match'
                  }
                  description={
                    error
                      ? getErrorMessage(error, 'Try again in a moment.')
                      : 'Try another search or filter.'
                  }
                />
              }
            />
          </div>
          {total > 0 && (
            <Pagination
              variant="simple"
              totalItems={total}
              itemsPerPage={PAGE_SIZE}
              currentPage={page}
              onPageChange={(next) => {
                setPage(next)
                setSelected(new Set())
              }}
            />
          )}
        </>
      )}

      <AiMessageComposer
        open={messageTargets !== null}
        onClose={() => setMessageTargets(null)}
        jobId={jobId}
        targets={messageTargets ?? []}
        onSent={() => {
          setMessageTargets(null)
          setSelected(new Set())
        }}
      />
    </>
  )
}
