import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Chart, ColumnDef, DataTable } from '@/components'
import { HeroAction, PageHero } from '@/components/layout/PageHero'
import { PagePanel, StatCard, StatGrid } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { ActivityHeatmap, bucketDates } from '@/components/ui/ActivityHeatmap'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { EmailVerificationPanel } from '@/features/email-verification/components/EmailVerificationPanel'
import { ONBOARDING_PATHS } from '@/features/onboarding/paths'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useRouteToast } from '@/hooks/useRouteToast'
import { getStatusBadge } from '@/pages/RecruiterProfile/getJobStatus'
import { useAllJobApplicationsQuery } from '@/redux/api/talent'
import { formatTimeAgo } from '@/utils'
import { AllJobTypes } from '@/utils/types'

import styles from './TalentDashboardHome.module.scss'

const RECENT_APPLICATIONS_LIMIT = 5

const formatStatusLabel = (status: string) =>
  status.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

const columns: ColumnDef<AllJobTypes>[] = [
  {
    key: 'jobTitle',
    header: 'Job Title',
    render: (row) => row.job?.role?.name ?? 'Unknown',
  },
  {
    key: 'status',
    header: 'Status',
    align: 'center',
    render: (row) => {
      const status = row.status ?? 'unknown'
      const { backgroundColor, color } = getStatusBadge(status)
      return (
        <StatusBadge
          status={formatStatusLabel(status)}
          backgroundColor={backgroundColor}
          color={color}
        />
      )
    },
  },
  {
    key: 'dateApplied',
    header: 'Date Applied',
    align: 'center',
    render: (row) => formatTimeAgo(row.createdAt),
  },
  {
    key: 'openJob',
    header: '',
    align: 'right',
    render: (row) =>
      row.job?.id ? (
        <Link to={`/talentDashboard/job/${row.job.id}`}>
          <Button size="sm">View job</Button>
        </Link>
      ) : null,
  },
]

const TalentDashboardHome = () => {
  const navigate = useNavigate()
  useRouteToast()
  const user = useAuthStore((state) => state.user)
  const { profile, isLoading: isProfileLoading } = useProfile()
  const isVerified = !!profile?.emailVerifiedAt
  const { data, isLoading } = useAllJobApplicationsQuery(
    {},
    { skip: !isVerified },
  )

  const applications: AllJobTypes[] = data?.data?.applications ?? []

  const shortlisted = applications.filter(
    (app) => app.status === 'shortlisted',
  ).length

  const statusCounts = applications.reduce<Record<string, number>>(
    (acc, app) => {
      const status = app.status ?? 'unknown'
      acc[status] = (acc[status] ?? 0) + 1
      return acc
    },
    {},
  )

  const statusBreakdown = Object.entries(statusCounts).map(
    ([status, value]) => ({
      label: formatStatusLabel(status),
      value,
    }),
  )

  const recentApplications = applications.slice(0, RECENT_APPLICATIONS_LIMIT)

  const tiles = [
    { label: 'Applications Submitted', value: applications.length },
    {
      label: 'Profile Completeness',
      value: `${profile?.profileCompletion?.percentage ?? 0}%`,
    },
    {
      label: 'Assessment Score',
      value:
        profile?.prescreeningScore != null
          ? `${profile.prescreeningScore}%`
          : '—',
    },
    { label: 'Shortlisted', value: shortlisted },
  ]

  if (isProfileLoading) {
    return <Spinner fullPage />
  }

  if (!isVerified) {
    return (
      <PageShell wide centered>
        <EmailVerificationPanel />
      </PageShell>
    )
  }

  return (
    <PageShell wide>
      <PageHero
        kicker="Talent dashboard"
        title={`Welcome back, ${user?.firstName ?? ''}`.trim()}
        lead="Here's what's happening with your job search today."
        actions={
          profile?.profileCompletion &&
          !profile.profileCompletion.isProfileComplete ? (
            <HeroAction onClick={() => navigate(ONBOARDING_PATHS.profile)}>
              Finish your profile
            </HeroAction>
          ) : undefined
        }
        meta={[
          {
            label: 'Applications',
            value: applications.length,
          },
          {
            label: 'Profile',
            value: `${profile?.profileCompletion?.percentage ?? 0}% complete`,
          },
          {
            label: 'Shortlisted',
            value: shortlisted,
          },
        ]}
      />

      {isLoading ? (
        <Spinner fullPage />
      ) : (
        <>
          <StatGrid columns={4}>
            {tiles.map((tile) => (
              <StatCard
                key={tile.label}
                value={tile.value}
                label={tile.label}
              />
            ))}
          </StatGrid>

          <div className={styles.grid}>
            <Chart
              type="pie"
              title="Applications by Status"
              data={statusBreakdown}
            />
            <PagePanel title="Recent Applications">
              <DataTable
                columns={columns}
                data={recentApplications}
                getRowKey={(row) => row.id ?? ''}
                ariaLabel="Recent applications"
                emptyState={
                  <EmptyState
                    title="No applications yet"
                    description="Start applying — roles that match your profile will show up here."
                    action={
                      <Button onClick={() => navigate('/talentDashboard/job')}>
                        Browse jobs
                      </Button>
                    }
                  />
                }
              />
            </PagePanel>
          </div>

          <PagePanel
            title="Your application activity"
            hint="Days you submitted applications over the last 12 weeks.">
            <ActivityHeatmap
              data={bucketDates(applications.map((app) => app.createdAt))}
            />
          </PagePanel>
        </>
      )}
    </PageShell>
  )
}

export default TalentDashboardHome
