import React from 'react'
import { HiOutlineClock } from 'react-icons/hi2'
import { useNavigate, useParams } from 'react-router-dom'

import { HeroAction, PageHero } from '@/components/layout/PageHero'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState, Spinner } from '@/components/ui'
import { StatusBadge } from '@/components/ui/Badge'
import { ColumnDef, DataTable, TableActions } from '@/components/ui/DataTable'
import { scoutPaths } from '@/features/scout/paths'
import type { ScoutRun, ScoutRunStatus } from '@/features/scout/types'
import {
  useGetScoutCampaignQuery,
  useGetScoutRunsQuery,
} from '@/redux/api/recruiter'

import styles from './CampaignDetail.module.scss'

const RUN_STATUS_LABELS: Record<ScoutRunStatus, string> = {
  processing: 'Reviewing',
  completed: 'Complete',
  completed_with_errors: 'Complete, some skipped',
  failed: 'Nothing scored',
}

const RUN_STATUS_COLORS: Record<ScoutRunStatus, { bg: string; fg: string }> = {
  processing: { bg: 'var(--color-info-tint)', fg: 'var(--color-info)' },
  completed: { bg: 'var(--color-success-tint)', fg: 'var(--color-success)' },
  completed_with_errors: {
    bg: 'var(--color-warning-tint)',
    fg: 'var(--color-warning)',
  },
  failed: { bg: 'var(--color-danger-tint)', fg: 'var(--color-danger)' },
}

export const CampaignDetail = () => {
  const navigate = useNavigate()
  const { campaignId } = useParams<{ campaignId: string }>()

  const { data, isLoading, isError } = useGetScoutCampaignQuery(
    { id: campaignId ?? '' },
    { skip: !campaignId },
  )
  const { data: runsData, isLoading: isLoadingRuns } = useGetScoutRunsQuery(
    { campaignId: campaignId ?? '', limit: 20 },
    { skip: !campaignId },
  )

  if (isLoading) return <Spinner fullPage />

  const campaign = data?.data?.scoutJob
  if (isError || !campaign || !campaignId) {
    return (
      <PageShell>
        <EmptyState
          title="Couldn't load this campaign"
          description="It may have been deleted. Go back to your campaigns and try again."
          action={
            <Button variant="outline" onClick={() => navigate(scoutPaths.root)}>
              Back to campaigns
            </Button>
          }
        />
      </PageShell>
    )
  }

  const runs = runsData?.data?.runs ?? []

  const columns: ColumnDef<ScoutRun>[] = [
    {
      key: 'createdAt',
      header: 'Started',
      render: (row) => (
        <span className={styles.date}>
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'totalCvs',
      header: 'CVs',
      align: 'center',
      render: (row) => <span className={styles.count}>{row.totalCvs}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          status={RUN_STATUS_LABELS[row.status]}
          backgroundColor={RUN_STATUS_COLORS[row.status].bg}
          color={RUN_STATUS_COLORS[row.status].fg}
        />
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
            onClick={() => navigate(scoutPaths.run(campaignId, row.id))}>
            View results
          </Button>
        </TableActions>
      ),
    },
  ]

  const location = [
    campaign.locationCity,
    campaign.locationState,
    campaign.locationCountry,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="Campaign"
        title={campaign.name}
        lead={campaign.role?.name ?? undefined}
        meta={[
          {
            label: 'Shortlist size',
            value: `${campaign.shortlistSize} candidates`,
          },
          ...(campaign.experienceLevel
            ? [{ label: 'Seniority', value: campaign.experienceLevel }]
            : []),
          ...(location ? [{ label: 'Location', value: location }] : []),
          ...(campaign.workMode
            ? [{ label: 'Work setup', value: campaign.workMode }]
            : []),
        ]}
        actions={
          <HeroAction to={scoutPaths.upload(campaignId)}>Upload CVs</HeroAction>
        }
      />

      <div className={styles.columns}>
        <PagePanel title="Job brief">
          <p className={styles.prose}>{campaign.jobBrief}</p>
        </PagePanel>

        <PagePanel title="How the AI was told to choose">
          <p className={styles.prose}>{campaign.recruiterGuide}</p>
        </PagePanel>
      </div>

      {(campaign.mustHaveSkills?.length ||
        campaign.niceToHaveSkills?.length) && (
        <PagePanel title="Skills">
          {!!campaign.mustHaveSkills?.length && (
            <div className={styles.skillGroup}>
              <span className={styles.skillLabel}>Must have</span>
              <div className={styles.chips}>
                {campaign.mustHaveSkills.map((skill) => (
                  <span
                    key={skill}
                    className={[styles.chip, styles.chipMust].join(' ')}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!!campaign.niceToHaveSkills?.length && (
            <div className={styles.skillGroup}>
              <span className={styles.skillLabel}>Nice to have</span>
              <div className={styles.chips}>
                {campaign.niceToHaveSkills.map((skill) => (
                  <span key={skill} className={styles.chip}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </PagePanel>
      )}

      <PagePanel
        title="Upload history"
        hint="Every batch of CVs you've run against this campaign.">
        {!isLoadingRuns && runs.length === 0 ? (
          <EmptyState
            icon={<HiOutlineClock />}
            title="No CVs uploaded yet"
            description="Upload a batch and the AI will score and rank them against this campaign."
            action={
              <Button onClick={() => navigate(scoutPaths.upload(campaignId))}>
                Upload CVs
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={runs}
            pageSize={10}
            isLoading={isLoadingRuns}
            getRowKey={(row) => row.id}
            ariaLabel="Upload history"
            showRowNumber={false}
            onRowClick={(row) => navigate(scoutPaths.run(campaignId, row.id))}
          />
        )}
      </PagePanel>

      <div className={styles.actions}>
        <Button variant="outline" onClick={() => navigate(scoutPaths.root)}>
          Back to campaigns
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(scoutPaths.editCampaign(campaignId))}>
          Edit campaign
        </Button>
      </div>
    </PageShell>
  )
}
