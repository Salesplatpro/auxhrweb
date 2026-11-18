import React, { useEffect, useMemo, useState } from 'react'
import { HiOutlineArrowDownTray, HiOutlineInbox } from 'react-icons/hi2'
import { useNavigate, useParams } from 'react-router-dom'

import { PageHero } from '@/components/layout/PageHero'
import { PagePanel, StatCard, StatGrid } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Avatar, Button, EmptyState, Spinner } from '@/components/ui'
import {
  ColumnDef,
  DataTable,
  TableActions,
  TableToolbar,
} from '@/components/ui/DataTable'
import { MatchScoreRing } from '@/components/ui/MatchScoreRing'
import { Tabs } from '@/components/ui/Tabs'
import { scoutPaths } from '@/features/scout/paths'
import { downloadScoutReport } from '@/features/scout/services/scoutService'
import { useScoutStore } from '@/features/scout/store/useScoutStore'
import { type ScoutCv, isRunFinished } from '@/features/scout/types'
import {
  useGetScoutRunQuery,
  useRetryScoutCvMutation,
} from '@/redux/api/recruiter'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { CandidateDrawer } from './CandidateDrawer'
import styles from './RunResults.module.scss'

const POLL_MS = 2000

const verdictFor = (score: number | null) => {
  if (score == null) return null
  if (score >= 75) return 'high' as const
  if (score >= 50) return 'medium' as const
  return 'low' as const
}

export const RunResults = () => {
  const navigate = useNavigate()
  const { campaignId, runId } = useParams<{
    campaignId: string
    runId: string
  }>()
  const {
    activeTab,
    setActiveTab,
    openCvId,
    openCvDetails,
    closeCvDetails,
    sortKey,
    sortDirection,
    setSort,
  } = useScoutStore()
  const [isDownloading, setIsDownloading] = useState(false)

  // Polling is driven by the run's own status: once it reaches a terminal state the
  // interval drops to 0 and RTK Query stops, so a finished run is never polled
  // forever in a background tab.
  const [pollingInterval, setPollingInterval] = useState(POLL_MS)
  const { data, isLoading, isError } = useGetScoutRunQuery(
    { runId: runId ?? '' },
    { skip: !runId, pollingInterval },
  )

  const run = data?.data?.run
  const progress = data?.data?.progress
  const cvs = data?.data?.cvs ?? []
  const finished = isRunFinished(run?.status)

  useEffect(() => {
    setPollingInterval(finished ? 0 : POLL_MS)
  }, [finished])

  const [retryCv, { isLoading: isRetrying }] = useRetryScoutCvMutation()

  const shortlisted = useMemo(
    () =>
      cvs
        .filter((cv) => cv.shortlisted)
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)),
    [cvs],
  )
  const unreadable = useMemo(
    () => cvs.filter((cv) => cv.status === 'failed'),
    [cvs],
  )
  const scored = useMemo(
    () =>
      cvs
        .filter((cv) => cv.status === 'scored')
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)),
    [cvs],
  )

  const openCv = useMemo(
    () => cvs.find((cv) => cv.id === openCvId) ?? null,
    [cvs, openCvId],
  )

  if (isLoading) return <Spinner fullPage />

  if (isError || !run || !runId || !campaignId) {
    return (
      <PageShell>
        <EmptyState
          title="Couldn't load this run"
          description="It may have been deleted along with its campaign."
          action={
            <Button variant="outline" onClick={() => navigate(scoutPaths.root)}>
              Back to campaigns
            </Button>
          }
        />
      </PageShell>
    )
  }

  const campaignName = run.scoutJob?.name ?? 'Scouting run'

  const download = async () => {
    setIsDownloading(true)
    try {
      await downloadScoutReport(runId, campaignName)
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not download the report'))
    } finally {
      setIsDownloading(false)
    }
  }

  const retry = async (cvId: string) => {
    try {
      await retryCv({ scoutId: cvId, runId }).unwrap()
      notify('success', 'Trying that CV again')
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not retry this CV'))
    }
  }

  const candidateColumns: ColumnDef<ScoutCv>[] = [
    {
      key: 'rank',
      header: 'Rank',
      align: 'center',
      // Read from the stored rank, never the row index — the previous table
      // numbered rows as rendered, so the ranking changed whenever you re-sorted.
      sortAccessor: (row) => row.rank ?? Number.MAX_SAFE_INTEGER,
      render: (row) => <span className={styles.rank}>{row.rank ?? '—'}</span>,
    },
    {
      key: 'candidate',
      header: 'Candidate',
      sortAccessor: (row) => row.candidateName ?? row.cvName ?? '',
      render: (row) => (
        <div className={styles.candidateCell}>
          <Avatar
            firstName={(row.candidateName ?? row.cvName ?? 'C').split(' ')[0]}
            lastName={(row.candidateName ?? '').split(' ')[1] ?? ''}
            size="sm"
          />
          <div className={styles.candidateMeta}>
            <span className={styles.candidateName}>
              {row.candidateName ?? row.cvName ?? 'Unnamed candidate'}
            </span>
            <span className={styles.candidateSub}>
              {row.candidate?.headline ?? row.cvName ?? ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Match',
      align: 'center',
      hideBelow: 640,
      sortAccessor: (row) => row.evaluationScore ?? -1,
      render: (row) => (
        <MatchScoreRing
          verdict={verdictFor(row.evaluationScore)}
          averageScore={row.evaluationScore ?? 0}
        />
      ),
    },
    {
      key: 'why',
      header: 'Why the AI picked them',
      hideBelow: 900,
      render: (row) => (
        <p className={styles.reason}>
          {row.recommendation ?? 'No reason recorded'}
        </p>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <TableActions>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openCvDetails(row.id)}>
            View details
          </Button>
        </TableActions>
      ),
    },
  ]

  const tabs = [
    { key: 'shortlist', label: 'Shortlist', count: shortlisted.length },
    { key: 'all', label: 'All CVs', count: scored.length },
    { key: 'unreadable', label: "Couldn't read", count: unreadable.length },
  ]

  const rowsForTab = activeTab === 'shortlist' ? shortlisted : scored

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker={campaignName}
        title={
          finished
            ? `Top ${shortlisted.length} of ${run.totalCvs} CVs reviewed`
            : 'Reviewing your CVs'
        }
        lead={
          finished
            ? run.shortlistSummary ??
              'The AI scored every CV against your brief and ranked the best fits.'
            : 'This runs on our servers, so you can close this tab and come back — nothing will be lost.'
        }
        actions={
          finished && shortlisted.length > 0 ? (
            <Button
              variant="primary"
              onClick={download}
              loading={isDownloading}
              icon={<HiOutlineArrowDownTray aria-hidden />}>
              Download PDF
            </Button>
          ) : undefined
        }
      />

      {!finished && progress && (
        <PagePanel
          title="Progress"
          hint="Updating automatically every couple of seconds.">
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${Math.round(
                  ((progress.scored + progress.failed) /
                    Math.max(run.totalCvs, 1)) *
                    100,
                )}%`,
              }}
            />
          </div>
          <p className={styles.progressLabel}>
            {progress.scored + progress.failed} of {run.totalCvs} reviewed
          </p>
          <StatGrid columns={4}>
            <StatCard value={progress.queued} label="Waiting" />
            <StatCard value={progress.processing} label="Reviewing" />
            <StatCard value={progress.scored} label="Scored" />
            <StatCard value={progress.failed} label="Couldn't read" />
          </StatGrid>
        </PagePanel>
      )}

      {finished && (
        <>
          <Tabs
            tabs={tabs}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as typeof activeTab)}
          />

          {activeTab === 'unreadable' ? (
            unreadable.length === 0 ? (
              <EmptyState
                icon={<HiOutlineInbox />}
                title="Every CV was readable"
                description="Nothing needs your attention here."
              />
            ) : (
              <ul className={styles.failureList}>
                {unreadable.map((cv) => (
                  <li key={cv.id} className={styles.failure}>
                    <div className={styles.failureMeta}>
                      <span className={styles.failureName}>{cv.cvName}</span>
                      <span className={styles.failureReason}>
                        {cv.lastError ?? 'We could not read this file.'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={isRetrying}
                      onClick={() => retry(cv.id)}>
                      Try again
                    </Button>
                  </li>
                ))}
              </ul>
            )
          ) : rowsForTab.length === 0 ? (
            <EmptyState
              icon={<HiOutlineInbox />}
              title="No candidates were scored"
              description="None of the uploaded files could be read. Check the “Couldn't read” tab and try those again."
            />
          ) : (
            <>
              <TableToolbar
                columns={candidateColumns}
                resultsCount={rowsForTab.length}
                visibleColumnKeys={candidateColumns.map((column) => column.key)}
                onToggleColumn={() => undefined}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSortChange={setSort}
                exportConfig={{
                  rows: rowsForTab,
                  headers: [
                    'Rank',
                    'Candidate',
                    'Email',
                    'Phone',
                    'Match',
                    'Why',
                  ],
                  toCsvRow: (row) => [
                    String(row.rank ?? ''),
                    row.candidateName ?? row.cvName ?? '',
                    row.candidateEmail ?? '',
                    row.candidatePhone ?? '',
                    row.evaluationScore == null
                      ? ''
                      : String(row.evaluationScore),
                    row.recommendation ?? '',
                  ],
                  filename: 'scouting-shortlist.csv',
                }}
              />
              <DataTable
                columns={candidateColumns}
                data={rowsForTab}
                pageSize={10}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSortChange={setSort}
                getRowKey={(row) => row.id}
                ariaLabel="Scouted candidates"
                showRowNumber={false}
                onRowClick={(row) => openCvDetails(row.id)}
              />
            </>
          )}
        </>
      )}

      <div className={styles.pageActions}>
        <Button
          variant="outline"
          onClick={() => navigate(scoutPaths.campaign(campaignId))}>
          Back to campaign
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(scoutPaths.upload(campaignId))}>
          Upload more CVs
        </Button>
      </div>

      <CandidateDrawer cv={openCv} onClose={closeCvDetails} />
    </PageShell>
  )
}
