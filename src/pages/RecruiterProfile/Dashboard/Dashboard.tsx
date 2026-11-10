import React, { useState } from 'react'
import {
  HiChevronDown,
  HiOutlineArrowDownTray,
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineUsers,
} from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'

import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import { Chart } from '@/components/ui/Chart'
import { Dropdown } from '@/components/ui/Dropdown'
import { EmptyState } from '@/components/ui/EmptyState'
import { MetricCard } from '@/components/ui/MetricCard'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { TrendChart } from '@/components/ui/TrendChart'
import { Heading, Text } from '@/components/ui/Typography'
import { formatCount, percentChange } from '@/features/admin/overview'
import { CardError } from '@/features/dashboard/components/CardError/CardError'
import { FunnelList } from '@/features/dashboard/components/FunnelList/FunnelList'
import { ActiveJobPostsPanel } from '@/features/dashboard/components/recruiter/ActiveJobPostsPanel'
import { DashboardNotifications } from '@/features/dashboard/components/recruiter/DashboardNotifications'
import { RecentApplicantsPanel } from '@/features/dashboard/components/recruiter/RecentApplicantsPanel'
import { useRecruiterDashboardSummary } from '@/features/dashboard/hooks/useRecruiterDashboard'
import {
  SUMMARY_CHARTS,
  SUMMARY_RANGES,
  SummaryChart,
  SummaryRange,
} from '@/features/dashboard/types'
import {
  FUNNEL_STEPS,
  greetingFor,
  shareOf,
  STATUS_SLICES,
  summaryReportRows,
} from '@/features/dashboard/utils/recruiterDashboard'
import { ONBOARDING_PATHS } from '@/features/onboarding/paths'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useRouteToast } from '@/hooks/useRouteToast'
import { exportRowsToCsv } from '@/utils/exportRowsToCsv'

import styles from './Dashboard.module.scss'

const CHART_LABELS: Record<SummaryChart, string> = {
  '7d': '7D',
  '12w': '12W',
  '1y': '1Y',
}

const TREND_SERIES = [
  { key: 'applications', label: 'Applications', color: 'var(--chart-1)' },
  { key: 'screened', label: 'Screened', color: 'var(--chart-2)' },
]

const Dashboard = () => {
  useRouteToast()
  const navigate = useNavigate()
  const { profile, isLoading: profileLoading } = useProfile()
  const [range, setRange] = useState<SummaryRange>(7)
  const [chart, setChart] = useState<SummaryChart>('12w')
  const { summary, error, isLoading, retry } = useRecruiterDashboardSummary(
    range,
    chart,
  )

  const greeting = `${greetingFor(new Date().getHours())}${
    profile?.firstName ? `, ${profile.firstName}` : ''
  }`

  if (!profileLoading && !profile?.activeOrganization) {
    return (
      <PageShell wide>
        <Heading level={1}>{greeting}</Heading>
        <EmptyState
          icon={<HiOutlineBriefcase size={28} />}
          title="Set up your company first"
          description="Jobs are posted under your company, and candidates see it. It takes about 2 minutes."
          action={
            <Button
              data-tour="create-company"
              onClick={() => navigate(ONBOARDING_PATHS.company)}>
              Create company
            </Button>
          }
        />
      </PageShell>
    )
  }

  const kpis = summary?.kpis
  const exportReport = () => {
    if (!summary) return
    exportRowsToCsv(
      ['Metric', 'Value'],
      summaryReportRows(summary),
      `auxhr-dashboard-${summary.range.from}-to-${summary.range.to}.csv`,
    )
  }

  return (
    <PageShell wide>
      <div className={styles.titleRow}>
        <div>
          <Heading level={1}>{greeting}</Heading>
          <Text as="p" size="fs-lg" color="muted">
            Here is what happened across your job posts in the last {range}{' '}
            days.
          </Text>
        </div>
        <div className={styles.titleActions}>
          <Dropdown
            align="right"
            trigger={
              <span className={styles.rangeTrigger}>
                <HiOutlineCalendar size={16} aria-hidden />
                Last {range} days
                <HiChevronDown size={14} aria-hidden />
              </span>
            }
            items={SUMMARY_RANGES.map((days) => ({
              key: String(days),
              label: `Last ${days} days`,
              onClick: () => setRange(days),
            }))}
          />
          <Button
            variant="outline"
            size="sm"
            icon={<HiOutlineArrowDownTray size={16} />}
            disabled={!summary}
            onClick={exportReport}>
            Export Report
          </Button>
        </div>
      </div>

      {error ? (
        <PagePanel>
          <CardError onRetry={retry} />
        </PagePanel>
      ) : (
        <>
          <div className={styles.kpis}>
            <MetricCard
              label="Active Job Posts"
              icon={<HiOutlineBriefcase size={18} />}
              loading={isLoading}
              value={kpis ? formatCount(kpis.activeJobs.total) : undefined}
              delta={kpis?.activeJobs.new}
              deltaFormat="count"
              deltaLabel={`new in the last ${range} days`}
            />
            <MetricCard
              label="Total Applications"
              icon={<HiOutlineUsers size={18} />}
              loading={isLoading}
              value={kpis ? formatCount(kpis.applications.total) : undefined}
              delta={
                kpis
                  ? percentChange(
                      kpis.applications.current,
                      kpis.applications.previous,
                    )
                  : null
              }
              deltaLabel={`vs previous ${range} days`}
            />
            <MetricCard
              label="Screened By AI"
              icon={<HiOutlineSparkles size={18} />}
              loading={isLoading}
              value={kpis ? formatCount(kpis.screened.total) : undefined}
              hint={
                kpis
                  ? `${shareOf(
                      kpis.screened.total,
                      kpis.screened.applications,
                    )}% of all applicants`
                  : undefined
              }
            />
          </div>

          <div className={styles.row}>
            <PagePanel
              title="Applications Over Time"
              hint="Applications received and screened"
              action={
                <SegmentedControl
                  label="Chart range"
                  options={SUMMARY_CHARTS.map((value) => ({
                    value,
                    label: CHART_LABELS[value],
                  }))}
                  value={[chart]}
                  onChange={(next) => {
                    const picked = next[0] as SummaryChart | undefined
                    if (picked) setChart(picked)
                  }}
                />
              }>
              {summary ? (
                <TrendChart
                  data={summary.series}
                  series={TREND_SERIES}
                  ariaLabel="Applications and screened applications over time"
                  height={260}
                />
              ) : (
                <Skeleton height="260px" />
              )}
            </PagePanel>

            {summary ? (
              summary.status.total > 0 ? (
                <Chart
                  type="pie"
                  title="Application Status"
                  data={STATUS_SLICES.map((slice) => ({
                    label: slice.label,
                    value: summary.status[slice.key],
                  }))}
                  colors={STATUS_SLICES.map((slice) => slice.color)}
                />
              ) : (
                <PagePanel title="Application Status">
                  <EmptyState
                    title="No applications on active jobs"
                    description="Statuses show up once candidates apply."
                  />
                </PagePanel>
              )
            ) : (
              <PagePanel title="Application Status">
                <Skeleton height="260px" />
              </PagePanel>
            )}
          </div>
        </>
      )}

      <div className={styles.row}>
        <RecentApplicantsPanel />
        <div className={styles.stack}>
          {summary && (
            <PagePanel
              title="Hiring Funnel"
              hint={`Applications from the last ${range} days`}>
              <FunnelList
                steps={FUNNEL_STEPS.map((step) => ({
                  key: step.key,
                  label: step.label,
                  value: summary.funnel[step.key],
                }))}
              />
            </PagePanel>
          )}
          <DashboardNotifications />
        </div>
      </div>

      {summary && <ActiveJobPostsPanel posts={summary.activeJobPosts} />}
    </PageShell>
  )
}

export default Dashboard
