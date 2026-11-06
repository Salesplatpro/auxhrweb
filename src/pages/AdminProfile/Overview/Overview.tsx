import React from 'react'
import { useSearchParams } from 'react-router-dom'

import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PagePanel } from '@/components/layout/PagePanel'
import { BarList } from '@/components/ui/BarList'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { MetricCard } from '@/components/ui/MetricCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { TrendChart, TrendSeries } from '@/components/ui/TrendChart'
import { useAdminOverview } from '@/features/admin/hooks/useAdminOverview'
import {
  formatCount,
  formatNaira,
  OVERVIEW_RANGES,
  percentChange,
  recruiterFunnelBars,
  stuckStageBars,
  talentFunnelBars,
  toBars,
} from '@/features/admin/overview'
import { OverviewRange } from '@/features/admin/types'

import styles from './Overview.module.scss'

const DEFAULT_RANGE: OverviewRange = 30

const RANGE_TABS = OVERVIEW_RANGES.map((days) => ({
  key: String(days),
  label: `${days} days`,
}))

const SIGNUP_SERIES: TrendSeries[] = [
  { key: 'talents', label: 'Talents', color: 'var(--chart-1)' },
  { key: 'recruiters', label: 'Recruiters', color: 'var(--chart-2)' },
]

const APPLICATION_SERIES: TrendSeries[] = [
  { key: 'count', label: 'Applications', color: 'var(--chart-1)' },
]

const REVENUE_SERIES: TrendSeries[] = [
  { key: 'amount', label: 'Revenue', color: 'var(--chart-1)' },
]

const parseRange = (value: string | null): OverviewRange => {
  const days = Number(value)
  return OVERVIEW_RANGES.find((range) => range === days) ?? DEFAULT_RANGE
}

const Overview = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const days = parseRange(searchParams.get('days'))
  const { overview, error, isLoading, retry } = useAdminOverview(days)

  const changeRange = (key: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('days', key)
        return next
      },
      { replace: true },
    )
  }

  const header = (
    <>
      <PageHeaderTitle
        title="Overview"
        description="How the platform is growing and where it needs attention."
      />
      <Tabs tabs={RANGE_TABS} activeKey={String(days)} onChange={changeRange} />
    </>
  )

  if (error && !overview) {
    return (
      <div className={styles.page}>
        {header}
        <PagePanel>
          <EmptyState
            title="We couldn't load the overview"
            description="Something went wrong while fetching platform data."
            action={<Button onClick={retry}>Try again</Button>}
          />
        </PagePanel>
      </div>
    )
  }

  const kpis = overview?.kpis
  const series = overview?.series
  const breakdowns = overview?.breakdowns
  const vsPrevious = `vs previous ${days} days`
  const loading = isLoading || !overview

  return (
    <div className={styles.page}>
      {header}

      <section className={styles.kpis} aria-label="Key metrics">
        <MetricCard
          label="Talents"
          loading={loading}
          value={kpis && formatCount(kpis.talents.total)}
          hint={kpis && `+${formatCount(kpis.talents.new)} in ${days} days`}
          delta={kpis && percentChange(kpis.talents.new, kpis.talents.previous)}
          deltaLabel={vsPrevious}
          to="/adminDashboard/talents"
        />
        <MetricCard
          label="Recruiters"
          loading={loading}
          value={kpis && formatCount(kpis.recruiters.total)}
          hint={kpis && `+${formatCount(kpis.recruiters.new)} in ${days} days`}
          delta={
            kpis && percentChange(kpis.recruiters.new, kpis.recruiters.previous)
          }
          deltaLabel={vsPrevious}
          to="/adminDashboard/recruiters"
        />
        <MetricCard
          label="Organizations"
          loading={loading}
          value={kpis && formatCount(kpis.organizations.total)}
          hint={
            kpis &&
            `${formatCount(kpis.organizations.pending)} pending verification`
          }
          attention={(kpis?.organizations.pending ?? 0) > 0}
          to="/adminDashboard/organizations"
        />
        <MetricCard
          label="Active jobs"
          loading={loading}
          value={kpis && formatCount(kpis.jobs.active)}
          hint={kpis && `of ${formatCount(kpis.jobs.total)} total`}
          to="/adminDashboard/jobs"
        />
        <MetricCard
          label="Applications"
          loading={loading}
          value={kpis && formatCount(kpis.applications.total)}
          hint={
            kpis && `+${formatCount(kpis.applications.new)} in ${days} days`
          }
          delta={
            kpis &&
            percentChange(kpis.applications.new, kpis.applications.previous)
          }
          deltaLabel={vsPrevious}
        />
        <MetricCard
          label={`Revenue (${days} days)`}
          loading={loading}
          value={kpis && formatNaira(kpis.revenue.inRange)}
          hint={kpis && `${formatNaira(kpis.revenue.total)} all time`}
          delta={
            kpis && percentChange(kpis.revenue.inRange, kpis.revenue.previous)
          }
          deltaLabel={vsPrevious}
        />
        <MetricCard
          label="Stuck applications"
          loading={loading}
          value={kpis && formatCount(kpis.stuckApplications)}
          hint="Stalled for over 24 hours"
          attention={(kpis?.stuckApplications ?? 0) > 0}
          to="/adminDashboard/applications"
        />
        <MetricCard
          label="Support awaiting reply"
          loading={loading}
          value={kpis && formatCount(kpis.supportAwaitingReply)}
          hint={
            kpis && `${formatCount(kpis.unresolvedErrors)} unresolved errors`
          }
          attention={(kpis?.supportAwaitingReply ?? 0) > 0}
          to="/adminDashboard/support"
        />
      </section>

      <div className={styles.charts}>
        <PagePanel
          title="Signups"
          hint="New talents and recruiters per day"
          className={styles.wide}>
          {series ? (
            <TrendChart
              data={series.signups}
              series={SIGNUP_SERIES}
              ariaLabel={`New signups per day, last ${days} days`}
            />
          ) : (
            <Skeleton height={240} />
          )}
        </PagePanel>
        <PagePanel title="Applications" hint="Submitted per day">
          {series ? (
            <TrendChart
              data={series.applications}
              series={APPLICATION_SERIES}
              ariaLabel={`Applications per day, last ${days} days`}
              height={200}
            />
          ) : (
            <Skeleton height={200} />
          )}
        </PagePanel>
        <PagePanel title="Revenue" hint="Completed payments per day">
          {!series ? (
            <Skeleton height={200} />
          ) : kpis && kpis.revenue.inRange > 0 ? (
            <TrendChart
              data={series.revenue}
              series={REVENUE_SERIES}
              ariaLabel={`Revenue per day, last ${days} days`}
              height={200}
              formatValue={formatNaira}
            />
          ) : (
            <p className={styles.empty}>
              No completed payments in the last {days} days.
            </p>
          )}
        </PagePanel>
      </div>

      <div className={styles.breakdowns}>
        <PagePanel title="Talent onboarding" hint="Where talents currently are">
          {breakdowns ? (
            <BarList
              ariaLabel="Talents by onboarding stage"
              items={talentFunnelBars(breakdowns.talentOnboarding).map(
                (bar) => ({ ...bar, href: '/adminDashboard/talents' }),
              )}
            />
          ) : (
            <Skeleton height={180} />
          )}
        </PagePanel>
        <PagePanel
          title="Recruiter onboarding"
          hint="Where recruiters currently are">
          {breakdowns ? (
            <BarList
              ariaLabel="Recruiters by onboarding stage"
              items={recruiterFunnelBars(breakdowns.recruiterOnboarding).map(
                (bar) => ({ ...bar, href: '/adminDashboard/recruiters' }),
              )}
            />
          ) : (
            <Skeleton height={180} />
          )}
        </PagePanel>
        <PagePanel
          title="Stuck applications"
          hint="Stalled over 24 hours, by stage">
          {breakdowns ? (
            <BarList
              ariaLabel="Stuck applications by stage"
              emptyLabel="Nothing is stuck right now"
              items={stuckStageBars(breakdowns.stuckByStage).map((bar) => ({
                ...bar,
                href: '/adminDashboard/applications',
              }))}
            />
          ) : (
            <Skeleton height={180} />
          )}
        </PagePanel>
        <PagePanel title="Applications by status">
          {breakdowns ? (
            <BarList
              ariaLabel="Applications by status"
              items={toBars(breakdowns.applicationsByStatus)}
            />
          ) : (
            <Skeleton height={180} />
          )}
        </PagePanel>
        <PagePanel title="Jobs by status">
          {breakdowns ? (
            <BarList
              ariaLabel="Jobs by status"
              items={toBars(
                breakdowns.jobsByStatus,
                undefined,
                () => '/adminDashboard/jobs',
              )}
            />
          ) : (
            <Skeleton height={180} />
          )}
        </PagePanel>
        <PagePanel title="Organizations by plan">
          {breakdowns ? (
            <BarList
              ariaLabel="Organizations by billing plan"
              items={toBars(
                breakdowns.organizationsByPlan,
                undefined,
                () => '/adminDashboard/organizations',
              )}
            />
          ) : (
            <Skeleton height={180} />
          )}
        </PagePanel>
      </div>
    </div>
  )
}

export default Overview
