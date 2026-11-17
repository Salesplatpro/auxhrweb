import cn from 'classnames'
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { MetricCard } from '@/components/ui/MetricCard'
import { Heading, Text } from '@/components/ui/Typography'
import { CardError } from '@/features/dashboard/components/CardError/CardError'
import { useTalentDashboard } from '@/features/dashboard/hooks/useTalentDashboard'
import { TalentTodo } from '@/features/dashboard/types'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { dayMonth } from '@/features/talent-applications/format'
import { StatusBadge } from '@/features/talent-applications/StatusBadge/StatusBadge'
import { STEP_ICON } from '@/features/talent-applications/stepIcons'
import {
  applicationPath,
  STEP_TITLE,
  stepActionPath,
} from '@/features/talent-applications/steps'
import { useRouteToast } from '@/hooks/useRouteToast'
import { useAllJobApplicationsQuery } from '@/redux/api/talent'

import styles from './TalentDashboardHome.module.scss'

const RECENT_APPLICATIONS = 4
const APPLICATIONS_PATH = '/talentDashboard/applicationPipeline'

const WORK_MODE: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid' }

const weekday = (date: string | null) =>
  date
    ? new Date(date).toLocaleDateString('en-GB', { weekday: 'short' })
    : undefined

const todoTitle = (item: TalentTodo) =>
  [
    item.step.key === 'ai_interview'
      ? 'Recorded interview'
      : STEP_TITLE[item.step.key],
    item.company?.name,
  ]
    .filter(Boolean)
    .join(' · ')

const todoMeta = (item: TalentTodo) =>
  [
    item.jobTitle,
    item.step.minutes && `${item.step.minutes} min`,
    item.step.dueAt &&
      `${item.step.key === 'ai_interview' ? 'by' : 'due'} ${dayMonth(
        item.step.dueAt,
      )}`,
  ]
    .filter(Boolean)
    .join(' · ')

const TodoCard = ({
  item,
  highlight,
}: {
  item: TalentTodo
  highlight: boolean
}) => {
  const navigate = useNavigate()
  const path = stepActionPath(item.applicationId, item.step)
  return (
    <article className={cn(styles.todo, highlight && styles.todoHighlight)}>
      <span
        className={cn(
          styles.todoIcon,
          item.step.key === 'ai_interview' ? styles.violet : styles.amber,
        )}
        aria-hidden>
        {STEP_ICON[item.step.key]}
      </span>
      <span className={styles.todoText}>
        <span className={styles.todoTitle}>{todoTitle(item)}</span>
        <span className={styles.todoMeta}>{todoMeta(item)}</span>
      </span>
      {path && (
        <Button variant="gradient" onClick={() => navigate(path)}>
          {item.step.key === 'ai_interview' ? 'Start interview' : 'Start test'}
        </Button>
      )}
    </article>
  )
}

const TalentDashboardHome = () => {
  useRouteToast()
  const { profile } = useProfile()
  const { dashboard, error, isLoading, retry } = useTalentDashboard()
  const { data: recent, isLoading: recentLoading } = useAllJobApplicationsQuery(
    {
      limit: RECENT_APPLICATIONS,
    },
  )
  const todo = dashboard?.todo ?? []
  const firstName = profile?.firstName ?? ''

  return (
    <PageShell wide>
      <header className={styles.header}>
        <Heading level={1}>
          Welcome Back{firstName ? `, ${firstName}` : ''}
        </Heading>
        {dashboard && (
          <Text as="p" size="fs-md" color="muted">
            {todo.length > 0
              ? `You have ${todo.length} thing${
                  todo.length === 1 ? '' : 's'
                } to do today. `
              : 'Nothing needs you today. '}
            Your applications are below.
          </Text>
        )}
      </header>

      {error ? (
        <CardError onRetry={retry} />
      ) : (
        <>
          {todo.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.label}>To do</h2>
              <div className={styles.todoRow}>
                {todo.map((item, index) => (
                  <TodoCard
                    key={`${item.applicationId}-${item.step.key}`}
                    item={item}
                    highlight={index === 0}
                  />
                ))}
              </div>
            </section>
          )}

          <div className={styles.metrics}>
            <MetricCard
              label="Applications sent"
              loading={isLoading}
              value={String(dashboard?.applications?.sent ?? 0)}
              hint={`${dashboard?.applications?.sentThisWeek ?? 0} this week`}
            />
            <MetricCard
              label="Tests to take"
              loading={isLoading}
              value={String(dashboard?.tests?.toTake ?? 0)}
              hint={
                dashboard?.tests?.nextDueAt
                  ? `Due ${weekday(dashboard.tests.nextDueAt)}`
                  : undefined
              }
            />
            <MetricCard
              label="Interviews"
              loading={isLoading}
              value={String(dashboard?.interviews?.toRecord ?? 0)}
              hint={dashboard?.interviews?.toRecord ? 'Recorded' : undefined}
            />
          </div>
        </>
      )}

      <PagePanel
        title="My applications"
        hint="Where each one stands"
        actionTo={APPLICATIONS_PATH}
        actionLabel="View all">
        {!recentLoading && !recent?.applications.length ? (
          <EmptyState
            title="No applications yet"
            description="Jobs you apply to show up here."
          />
        ) : (
          <ul className={styles.applications}>
            {recent?.applications.map((row) => {
              const place = [
                row.job.locationState ?? row.job.locationCity,
                row.job.workMode
                  ?.map((mode) => WORK_MODE[mode])
                  .filter(Boolean)
                  .join(', '),
              ]
                .filter(Boolean)
                .join(', ')
              return (
                <li key={row.id}>
                  <Link
                    to={applicationPath(row.id)}
                    className={styles.application}>
                    <span className={styles.initial} aria-hidden>
                      {(row.job.organization?.name ??
                        row.job.role?.name ??
                        '')[0]?.toUpperCase()}
                    </span>
                    <span className={styles.applicationText}>
                      <span className={styles.applicationTitle}>
                        {row.job.role?.name}
                      </span>
                      <span className={styles.applicationMeta}>
                        {[row.job.organization?.name, place]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <StatusBadge
                      status={row.candidateStatus}
                      label={
                        row.candidateStatus === 'interview_to_do'
                          ? 'Interview'
                          : undefined
                      }
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </PagePanel>
    </PageShell>
  )
}

export default TalentDashboardHome
