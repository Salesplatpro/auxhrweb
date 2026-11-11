import React from 'react'
import { FiDownload } from 'react-icons/fi'
import {
  HiOutlineBriefcase,
  HiOutlineChartBar,
  HiOutlineCreditCard,
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
} from 'react-icons/hi'
import { Link } from 'react-router-dom'

import {
  HeroAction,
  HeroGhost,
  PageHero,
  pageHeroStyles,
} from '@/components/layout/PageHero'
import { PagePanel, StatCard, StatGrid } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { getEmailVerificationBadge } from '@/features/email-verification/utils/getEmailVerificationBadge'
import { useMyOrganizations } from '@/features/organizations/hooks/useMyOrganizations'
import { getOrganizationStatusBadge } from '@/features/organizations/utils/getOrganizationStatusBadge'
import { isPayPerUsePlan } from '@/features/pricing/types'
import { getActiveOrganizationBilling } from '@/features/pricing/utils/getActiveOrganizationBilling'
import { getBillingPlanBadge } from '@/features/pricing/utils/getBillingPlanBadge'
import ProfilePic from '@/features/profile/components/ProfilePic'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { getStatusBadge } from '@/pages/RecruiterProfile/getJobStatus'
import {
  useFetchDashboardQuery,
  useFetchRecruiterJobPostQuery,
  useGetScoutCampaignsQuery,
} from '@/redux/api/recruiter'
import { RecruiterJob } from '@/utils/recruiterJobPostsTypes'

import { CompanyLogo } from '../Company/CompanyLogo'
import styles from './Profile.module.scss'

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const titleCase = (value?: string | null) => {
  if (!value) return '—'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export const Profile = () => {
  const { profile, isLoading: isProfileLoading } = useProfile()
  const { organizations, isLoading: isOrgsLoading } = useMyOrganizations()
  const { data: dashboardData, isLoading: isDashboardLoading } =
    useFetchDashboardQuery({})
  const { data: jobsData, isLoading: isJobsLoading } =
    useFetchRecruiterJobPostQuery({ limit: 50 })
  const { data: scoutData, isLoading: isScoutLoading } =
    useGetScoutCampaignsQuery({ limit: 100, offset: 0 })

  if (isProfileLoading) {
    return <Spinner fullPage />
  }

  const stats = dashboardData?.data?.data
  const jobPosts: RecruiterJob[] = jobsData?.data.jobs ?? []
  const scoutJobs = Array.isArray(scoutData?.data?.scoutJobs)
    ? scoutData.data.scoutJobs
    : []

  const fullName = `${profile?.firstName ?? ''} ${
    profile?.lastName ?? ''
  }`.trim()
  const location = [profile?.country, profile?.locationCity]
    .filter(Boolean)
    .join(' · ')
  const activeOrg =
    organizations.find((org) => org.id === profile?.activeOrganizationId) ??
    profile?.activeOrganization ??
    null
  const verificationBadge = getEmailVerificationBadge(profile?.emailVerifiedAt)
  const billing = getActiveOrganizationBilling(profile)
  const planBadge = getBillingPlanBadge(billing.billingPlan)
  const isPaid = !isPayPerUsePlan(billing.billingPlan)
  const orgBadge = activeOrg
    ? getOrganizationStatusBadge(activeOrg.status)
    : null

  const tiles = [
    {
      label: 'Job posts',
      value: isJobsLoading ? '—' : jobPosts.length,
      icon: <HiOutlineBriefcase size={18} />,
    },
    {
      label: 'Scout campaigns',
      value: isScoutLoading ? '—' : scoutJobs.length,
      icon: <FiDownload size={18} />,
    },
    {
      label: 'Applications',
      value: isDashboardLoading ? '—' : stats?.applicationsCount ?? 0,
      icon: <HiOutlineUserGroup size={18} />,
    },
    {
      label: 'Shortlisted',
      value: isDashboardLoading ? '—' : stats?.shortlistCount ?? 0,
      icon: <HiOutlineChartBar size={18} />,
    },
    {
      label: 'Pipeline completion',
      value: isDashboardLoading ? '—' : `${stats?.completionRatio ?? 0}%`,
      icon: <HiOutlineChartBar size={18} />,
    },
    {
      label: 'Companies',
      value: isOrgsLoading ? '—' : organizations.length,
      icon: <HiOutlineOfficeBuilding size={18} />,
    },
  ]

  const details = [
    { label: 'Email', value: profile?.email ?? '—' },
    { label: 'Account role', value: 'Recruiter' },
    { label: 'Location', value: location || '—' },
    { label: 'Member since', value: formatDate(profile?.createdAt) },
    {
      label: 'Account status',
      value: profile?.active === false ? 'Inactive' : 'Active',
    },
    {
      label: 'Billing interval',
      value: isPaid ? titleCase(billing.billingInterval) : 'Pay per use',
    },
    { label: 'Billing status', value: titleCase(billing.billingStatus) },
    { label: 'Last updated', value: formatDate(profile?.updatedAt) },
  ]

  const recentJobs = jobPosts.slice(0, 4)
  const recentScouts = scoutJobs.slice(0, 4)

  return (
    <PageShell>
      <PageHero
        identity={
          <div className={pageHeroStyles.avatarRing}>
            <ProfilePic />
          </div>
        }
        title={fullName || 'Recruiter'}
        lead={`Hiring on Auxhr${
          activeOrg?.name ? ` for ${activeOrg.name}` : ''
        }`}
        pills={
          <>
            <StatusBadge {...verificationBadge} showDot />
            <StatusBadge
              status={planBadge.status}
              backgroundColor={planBadge.backgroundColor}
              color={planBadge.color}
              showDot
            />
          </>
        }
        actions={
          <>
            <HeroAction to="/recruiterDashboard/plan">
              <HiOutlineCreditCard size={16} />
              Plan & billing
            </HeroAction>
            <HeroGhost to="/recruiterDashboard/company">
              <HiOutlineOfficeBuilding size={16} />
              Companies
            </HeroGhost>
            <HeroGhost to="/recruiterDashboard/postjob">
              <HiOutlineBriefcase size={16} />
              Post a job
            </HeroGhost>
          </>
        }
        meta={[
          {
            label: 'Workspace',
            value: activeOrg?.name ?? 'No active company',
          },
          { label: 'Email', value: profile?.email ?? '—' },
          { label: 'Joined', value: formatDate(profile?.createdAt) },
        ]}
      />

      <StatGrid>
        {tiles.map((tile) => (
          <StatCard
            key={tile.label}
            icon={tile.icon}
            value={tile.value}
            label={tile.label}
          />
        ))}
      </StatGrid>

      <div className={styles.columns}>
        <PagePanel title="Account details" flush>
          <div className={styles.detailGrid}>
            {details.map((item) => (
              <div key={item.label} className={styles.detailItem}>
                <span className={styles.detailLabel}>{item.label}</span>
                <span className={styles.detailValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </PagePanel>

        <PagePanel
          title="Active company"
          actionTo="/recruiterDashboard/company"
          actionLabel="Manage">
          {activeOrg ? (
            <div className={styles.companyCard}>
              <CompanyLogo name={activeOrg.name} logoUrl={activeOrg.logoUrl} />
              <div>
                <p className={styles.companyName}>{activeOrg.name}</p>
                <p className={styles.companyMeta}>
                  {activeOrg.industry || 'Industry not set'}
                  {activeOrg.address ? ` · ${activeOrg.address}` : ''}
                </p>
                {orgBadge && (
                  <StatusBadge
                    status={titleCase(activeOrg.status)}
                    backgroundColor={orgBadge.backgroundColor}
                    color={orgBadge.color}
                    showDot
                  />
                )}
                <div className={styles.companyFacts}>
                  {activeOrg.email && <span>{activeOrg.email}</span>}
                  {activeOrg.website && <span>{activeOrg.website}</span>}
                  {activeOrg.phone && <span>{activeOrg.phone}</span>}
                </div>
              </div>
            </div>
          ) : (
            <p className={styles.empty}>
              You have not selected an active company yet. Create one to post
              jobs under your brand.
            </p>
          )}
        </PagePanel>
      </div>

      <div className={styles.columns}>
        <PagePanel
          title="Recent job posts"
          actionTo="/recruiterDashboard/myJobPosts"
          actionLabel="View all"
          flush>
          {recentJobs.length === 0 ? (
            <p className={styles.empty}>No job posts yet.</p>
          ) : (
            <div className={styles.list}>
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  className={styles.listRow}
                  to={`/recruiterDashboard/singleJobPost/${job.id}`}>
                  <div>
                    <p className={styles.listTitle}>
                      {job.role?.name ?? 'Untitled role'}
                    </p>
                    <p className={styles.listSub}>
                      {job.organization?.name ?? 'Company'}
                      {' · '}
                      {job.noOfApplicants ?? 0} applicants
                      {' · '}
                      {formatDate(job.createdAt)}
                    </p>
                  </div>
                  <StatusBadge
                    status={titleCase(job.status ?? 'draft')}
                    {...getStatusBadge(job.status ?? 'draft')}
                  />
                </Link>
              ))}
            </div>
          )}
        </PagePanel>

        <PagePanel
          title="Scout campaigns"
          actionTo="/recruiterDashboard/scout"
          actionLabel="View all"
          flush>
          {recentScouts.length === 0 ? (
            <p className={styles.empty}>No scout campaigns yet.</p>
          ) : (
            <div className={styles.list}>
              {recentScouts.map(
                (scout: {
                  id: string
                  name?: string
                  role?: { name?: string } | null
                  createdAt?: string
                }) => (
                  <Link
                    key={scout.id}
                    className={styles.listRow}
                    to={`/recruiterDashboard/scout/${scout.id}`}>
                    <div>
                      <p className={styles.listTitle}>
                        {scout.name || scout.role?.name || 'Scout campaign'}
                      </p>
                      <p className={styles.listSub}>
                        Created {formatDate(scout.createdAt)}
                      </p>
                    </div>
                  </Link>
                ),
              )}
            </div>
          )}
        </PagePanel>
      </div>
    </PageShell>
  )
}
