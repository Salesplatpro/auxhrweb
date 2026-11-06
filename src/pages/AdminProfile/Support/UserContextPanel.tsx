import cn from 'classnames'
import React, { ReactNode } from 'react'
import { HiCheckCircle, HiOutlineMinusCircle } from 'react-icons/hi2'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSupportUserContext } from '@/features/support/hooks/useAdminSupport'
import { SupportUserContext } from '@/features/support/types'
import { formatTimeAgo } from '@/utils/calculateDaysFromCreation'

import styles from './Support.module.scss'

const humanize = (value: string) =>
  value.replace(/_/g, ' ').replace(/^\w/, (char) => char.toUpperCase())

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
    : '—'

const Section = ({
  title,
  children,
}: {
  title: string
  children: ReactNode | null
}) => (
  <section className={styles.contextSection}>
    <h3 className={styles.contextTitle}>{title}</h3>
    {children ?? (
      <p className={styles.contextMissing}>Couldn’t load this part.</p>
    )}
  </section>
)

const Facts = ({ items }: { items: Array<[string, ReactNode]> }) => (
  <dl className={styles.facts}>
    {items.map(([label, value]) => (
      <div key={label} className={styles.fact}>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    ))}
  </dl>
)

const Counts = ({ counts }: { counts: Record<string, number> }) => {
  const entries = Object.entries(counts)
  if (entries.length === 0) return <span className={styles.muted}>None</span>
  return (
    <span className={styles.countChips}>
      {entries.map(([key, count]) => (
        <span key={key} className={styles.countChip}>
          {humanize(key)} {count}
        </span>
      ))}
    </span>
  )
}

const Onboarding = ({
  onboarding,
}: {
  onboarding: NonNullable<SupportUserContext['onboarding']>
}) => (
  <>
    <p className={styles.stage}>{humanize(onboarding.stage)}</p>
    {onboarding.steps.length > 0 && (
      <ul className={styles.steps}>
        {onboarding.steps.map((step) => (
          <li key={step.label} className={cn(step.done && styles.stepDone)}>
            {step.done ? (
              <HiCheckCircle aria-label="Done" />
            ) : (
              <HiOutlineMinusCircle aria-label="Not done" />
            )}
            {step.label}
          </li>
        ))}
      </ul>
    )}
  </>
)

const Talent = ({
  talent,
  userId,
}: {
  talent: NonNullable<SupportUserContext['talent']>
  userId: string
}) => (
  <>
    <Facts
      items={[
        ['Profile', `${talent.profileCompletion}% complete`],
        ['Roles', talent.roles.length ? talent.roles.join(', ') : 'None yet'],
        [
          'CV',
          talent.cvUploaded
            ? `Uploaded ${formatDate(talent.cvUploadedAt)}`
            : 'Not uploaded',
        ],
        [
          'Pre-assessment',
          talent.prescreeningScore === null
            ? 'Not taken'
            : `Score ${talent.prescreeningScore}`,
        ],
        ...(talent.assessmentRetryDate
          ? ([['Retake from', formatDate(talent.assessmentRetryDate)]] as Array<
              [string, ReactNode]
            >)
          : []),
        [
          'Applications',
          <Counts key="apps" counts={talent.applicationsByStatus} />,
        ],
      ]}
    />
    {talent.stuckApplications.length > 0 && (
      <ul className={styles.stuckList}>
        {talent.stuckApplications.map((application) => (
          <li key={`${application.job}-${application.stage}`}>
            Stuck on <strong>{humanize(application.stage)}</strong> for{' '}
            {application.job}
            {application.company ? ` at ${application.company}` : ''},{' '}
            {application.daysStuck} days
          </li>
        ))}
      </ul>
    )}
    <Link
      to={`/adminDashboard/talents/${userId}`}
      className={styles.contextLink}>
      Open talent profile
    </Link>
  </>
)

const Recruiter = ({
  recruiter,
}: {
  recruiter: NonNullable<SupportUserContext['recruiter']>
}) => (
  <>
    {recruiter.organization ? (
      <Facts
        items={[
          [
            'Company',
            <Link
              key="org"
              to={`/adminDashboard/organizations/${recruiter.organization.id}`}
              className={styles.contextLink}>
              {recruiter.organization.name}
            </Link>,
          ],
          ['Verification', humanize(recruiter.organization.status)],
          [
            'Their role',
            recruiter.organization.memberRole
              ? humanize(recruiter.organization.memberRole)
              : '—',
          ],
          [
            'Team',
            `${recruiter.organization.teamSize} members, ${recruiter.organization.pendingInvites} invites pending`,
          ],
        ]}
      />
    ) : (
      <p className={styles.muted}>No company yet.</p>
    )}
    {recruiter.plan && (
      <>
        <Facts
          items={[
            ['Plan', humanize(recruiter.plan.billingPlan)],
            ['Billing', humanize(recruiter.plan.billingStatus)],
            ...(recruiter.plan.billingPeriodEnd
              ? ([
                  ['Renews', formatDate(recruiter.plan.billingPeriodEnd)],
                ] as Array<[string, ReactNode]>)
              : []),
          ]}
        />
        {recruiter.plan.meters.length > 0 && (
          <ul className={styles.meters}>
            {recruiter.plan.meters.map((meter) => (
              <li
                key={meter.label}
                className={cn(
                  meter.limit !== null &&
                    meter.used >= meter.limit &&
                    styles.meterFull,
                )}>
                <span>{meter.label}</span>
                <span>
                  {meter.used}
                  {meter.limit === null ? '' : ` / ${meter.limit}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </>
    )}
    <Facts
      items={[
        ['Jobs posted', <Counts key="jobs" counts={recruiter.jobsByStatus} />],
        ['Applicants', String(recruiter.totalApplicants)],
      ]}
    />
  </>
)

export const UserContextPanel = ({
  requestId,
  userId,
}: {
  requestId: string
  userId: string
}) => {
  const { context, error, isLoading, retry } = useSupportUserContext(requestId)

  if (isLoading) {
    return (
      <aside className={styles.context} aria-label="About this user">
        <Skeleton height={140} />
        <Skeleton height={200} />
      </aside>
    )
  }

  if (error || !context) {
    return (
      <aside className={styles.context} aria-label="About this user">
        <p className={styles.contextMissing}>
          We couldn’t load this user’s details.
        </p>
        <Button size="sm" variant="outline" onClick={retry}>
          Retry
        </Button>
      </aside>
    )
  }

  const { account } = context
  return (
    <aside className={styles.context} aria-label="About this user">
      <h2 className={styles.contextHeading}>About this user</h2>
      <Section title="Account">
        <Facts
          items={[
            ['Email', account.email],
            ['Role', humanize(account.role)],
            ['Country', account.country ?? '—'],
            [
              'Joined',
              `${formatDate(account.signedUpAt)} (${
                account.daysSinceSignup
              } days ago)`,
            ],
            ['Email verified', account.emailVerified ? 'Yes' : 'No'],
            ['Account', account.active ? 'Active' : 'Deactivated'],
          ]}
        />
      </Section>
      <Section title="Onboarding">
        {context.onboarding && <Onboarding onboarding={context.onboarding} />}
      </Section>
      {account.role === 'talent' && (
        <Section title="Talent">
          {context.talent && <Talent talent={context.talent} userId={userId} />}
        </Section>
      )}
      {account.role === 'recruiter' && (
        <Section title="Company and plan">
          {context.recruiter && <Recruiter recruiter={context.recruiter} />}
        </Section>
      )}
      <Section title="Errors in the last 14 days">
        {context.recentErrors &&
          (context.recentErrors.length === 0 ? (
            <p className={styles.muted}>None.</p>
          ) : (
            <ul className={styles.errors}>
              {context.recentErrors.map((item) => (
                <li key={`${item.at}-${item.errorType}`}>
                  <span className={styles.errorMeta}>
                    {formatTimeAgo(item.at)} · {item.method ?? ''}{' '}
                    {item.endpoint ?? ''}
                  </span>
                  <span>{item.message}</span>
                </li>
              ))}
            </ul>
          ))}
      </Section>
    </aside>
  )
}
