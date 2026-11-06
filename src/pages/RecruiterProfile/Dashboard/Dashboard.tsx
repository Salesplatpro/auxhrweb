import { Alert } from '@mui/material'
import React from 'react'
import { useNavigate } from 'react-router-dom'

import { HeroAction, HeroGhost, PageHero } from '@/components/layout/PageHero'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { ActivityHeatmap } from '@/components/ui/ActivityHeatmap'
import { StatusBadge } from '@/components/ui/Badge'
import { Chart } from '@/components/ui/Chart'
import { Spinner } from '@/components/ui/Spinner'
import { EmailVerificationPanel } from '@/features/email-verification/components/EmailVerificationPanel'
import { ONBOARDING_PATHS } from '@/features/onboarding/paths'
import { getOrganizationStatusBadge } from '@/features/organizations/utils/getOrganizationStatusBadge'
import { PlanUsage } from '@/features/pricing/components/PlanUsage'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useRouteToast } from '@/hooks/useRouteToast'
import { CompanyLogo } from '@/pages/RecruiterProfile/Company/CompanyLogo'

import { useFetchDashboardQuery } from '../../../redux/api/recruiter'
import ApplicationTracker from './ApplicationTracker'
import styles from './Dashboard.module.scss'
import RecentApplications from './RecentApplications'
import RecentCompilation from './RecentCompilation'

const Dashboard = () => {
  const navigate = useNavigate()
  useRouteToast()
  const { profile, isLoading: isProfileLoading } = useProfile()
  const isVerified = !!profile?.emailVerifiedAt
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useFetchDashboardQuery({}, { skip: !isVerified })

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

  if (dashboardLoading)
    return (
      <PageShell wide>
        <Spinner fullPage />
      </PageShell>
    )

  if (dashboardError)
    return (
      <>
        <Alert severity="error">Error Fetching Data</Alert>
      </>
    )

  const stats = dashboardData?.data?.data
  const organization = profile?.activeOrganization

  const chartData = [
    { label: 'Campaigns', value: stats?.campaignCount ?? 0 },
    { label: 'Completed', value: stats?.completedCampaigns ?? 0 },
    { label: 'Applications', value: stats?.applicationsCount ?? 0 },
    { label: 'Shortlisted', value: stats?.shortlistCount ?? 0 },
  ]

  return (
    <PageShell wide>
      <PageHero
        identity={
          <CompanyLogo
            name={organization?.name ?? 'Company'}
            logoUrl={organization?.logoUrl}
            size="lg"
            onDark
          />
        }
        title={
          organization?.name ??
          `Welcome back${profile?.firstName ? `, ${profile.firstName}` : ''}`
        }
        lead={
          organization
            ? `Jobs you post belong to this workspace. Switch before you publish if you hire for more than one brand.`
            : 'Create a company to start posting jobs under your brand.'
        }
        pills={
          organization ? (
            <StatusBadge
              status={organization.status}
              {...getOrganizationStatusBadge(organization.status)}
              showDot
            />
          ) : undefined
        }
        actions={
          organization ? (
            <HeroGhost onClick={() => navigate('/recruiterDashboard/company')}>
              Switch company
            </HeroGhost>
          ) : (
            <HeroAction
              tourId="create-company"
              onClick={() => navigate(ONBOARDING_PATHS.company)}>
              Create company
            </HeroAction>
          )
        }
        meta={[
          { label: 'Campaigns', value: stats?.campaignCount ?? 0 },
          { label: 'Applications', value: stats?.applicationsCount ?? 0 },
          { label: 'Shortlisted', value: stats?.shortlistCount ?? 0 },
        ]}
      />

      {organization && <PlanUsage compact />}

      <ApplicationTracker infoData={stats} />

      <div className={styles.grid}>
        <Chart type="pie" title="Recruitment Overview" data={chartData} />
        <PagePanel
          title="Recent Applications"
          actionTo="allapplications"
          actionLabel="View all">
          <RecentApplications infoData={stats?.recentApplications} embed />
        </PagePanel>
      </div>

      <PagePanel
        title="Applications received"
        hint="Daily volume for your active company over the last 12 weeks.">
        <ActivityHeatmap data={stats?.applicationHeatmap ?? []} />
      </PagePanel>

      <RecentCompilation />
    </PageShell>
  )
}

export default Dashboard
