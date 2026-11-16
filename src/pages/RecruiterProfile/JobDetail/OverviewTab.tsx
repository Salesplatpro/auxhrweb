import React from 'react'
import {
  LuFileText,
  LuFilter,
  LuSparkles,
  LuUserCheck,
  LuUsers,
  LuUserX,
  LuVideo,
} from 'react-icons/lu'

import type { JobDetailsJob } from '@/components/features/jobs/JobDetailsView'
import {
  formatExperience,
  formatWorkMode,
  hasRichText,
} from '@/components/features/jobs/JobDetailsView/jobDetailsFormat'
import RichTextDisplay from '@/components/features/shared/global/RichTextDisplay'
import { PagePanel, StatCard, StatGrid } from '@/components/layout/PagePanel'
import { Avatar } from '@/components/ui/Avatar'
import { BarList } from '@/components/ui/BarList'
import { CheckList } from '@/components/ui/CheckList'
import { Pill } from '@/components/ui/Pill'
import { Timeline, TimelineItem } from '@/components/ui/Timeline'
import { formatTimeAgo } from '@/utils'
import type { JobSummary } from '@/utils/recruiterJobPostsTypes'

import styles from './JobDetail.module.scss'

type OverviewTabProps = {
  job: JobDetailsJob & { id?: string }
  summary?: JobSummary
  onViewCandidates: () => void
}

const ACTIVITY_ICON: Record<
  JobSummary['recentActivity'][number]['type'],
  React.ReactNode
> = {
  posted: <LuFileText />,
  matched: <LuSparkles />,
  shortlisted: <LuUserCheck />,
  rejected: <LuUserX />,
  interview_invited: <LuVideo />,
  interview_finished: <LuFilter />,
}

const formatDay = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const closesOn = (closesAt: string) => {
  const [year, month, day] = closesAt.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!)).toLocaleDateString(
    'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' },
  )
}

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

const keyDates = (summary: JobSummary): TimelineItem[] => {
  const { postedAt, postedBy, closesAt, interviewsStartAt } = summary.keyDates
  const items: TimelineItem[] = [
    {
      id: 'posted',
      title: 'Job posted',
      detail: postedBy
        ? `Posted ${formatDay(postedAt)} by ${postedBy}`
        : `Posted ${formatDay(postedAt)}`,
      time: formatDay(postedAt),
      icon: <LuFileText />,
    },
  ]
  if (closesAt) {
    items.push({
      id: 'closes',
      title: 'Applications close',
      detail: `Closes ${closesOn(closesAt)}`,
      time: closesOn(closesAt),
      icon: <LuFilter />,
    })
  }
  if (interviewsStartAt) {
    items.push({
      id: 'interviews',
      title: 'Interviews started',
      detail: `${summary.pipeline.interview} candidates invited to the recorded AI interview`,
      time: formatDay(interviewsStartAt),
      icon: <LuVideo />,
    })
  }
  return items
}

export const OverviewTab = ({
  job,
  summary,
  onViewCandidates,
}: OverviewTabProps) => {
  const pipeline = summary?.pipeline
  const passRate = summary?.passRate

  return (
    <div className={styles.tabBody}>
      <div className={styles.grid}>
        <PagePanel
          title="About The Role"
          hint="Job description shared with candidates"
          actionTo={
            job.id ? `/recruiterDashboard/editJob/${job.id}` : undefined
          }
          actionLabel="Edit">
          <div className={styles.stack}>
            {hasRichText(job.jobBrief) ? (
              <RichTextDisplay content={job.jobBrief ?? ''} />
            ) : (
              <p className={styles.muted}>No description yet.</p>
            )}
            <div className={styles.columns}>
              {hasRichText(job.requirements) && (
                <div>
                  <h3 className={styles.subTitle}>Key Requirements</h3>
                  <RichTextDisplay content={job.requirements ?? ''} />
                </div>
              )}
              <div>
                {!!job.skills?.length && (
                  <>
                    <h3 className={styles.subTitle}>Must-Have Skills</h3>
                    <ul className={styles.chips}>
                      {job.skills.map((skill) => (
                        <li key={skill}>
                          <Pill tone="brand" size="sm">
                            {skill}
                          </Pill>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {!!job.goals?.length && (
                  <>
                    <h3 className={styles.subTitle}>Goals For This Role</h3>
                    <CheckList
                      variant="summary"
                      items={job.goals.map((goal) => ({ label: goal }))}
                    />
                  </>
                )}
              </div>
            </div>
            <dl className={styles.facts}>
              <div>
                <dt>Experience</dt>
                <dd>{formatExperience(job) ?? '—'}</dd>
              </div>
              <div>
                <dt>Work Model</dt>
                <dd>{formatWorkMode(job) ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </PagePanel>

        <PagePanel
          title="AI Screening Summary"
          hint={`Based on all ${summary?.applicants.total ?? 0} applicants`}>
          <div className={styles.stack}>
            <StatGrid>
              <StatCard
                label="Avg. CV match"
                value={
                  summary?.avgCvMatch.value == null
                    ? '—'
                    : `${summary.avgCvMatch.value}%`
                }
              />
              <StatCard
                label="Pass rate"
                value={passRate?.value == null ? '—' : `${passRate.value}%`}
              />
            </StatGrid>
            <h3 className={styles.subTitle}>Top Skills Matched</h3>
            <BarList
              ariaLabel="Top skills matched"
              of={100}
              valueDisplay="share"
              emptyLabel="No skill matches yet"
              items={(summary?.topSkills ?? []).map((item) => ({
                key: item.skill,
                label: item.skill,
                value: item.pct,
              }))}
            />
          </div>
        </PagePanel>
      </div>

      <div className={styles.grid}>
        <PagePanel
          title="Hiring Pipeline"
          hint={`Where the ${
            summary?.applicants.total ?? 0
          } applicants are now`}
          action={
            <button
              type="button"
              className={styles.linkButton}
              onClick={onViewCandidates}>
              View Candidates
            </button>
          }>
          <div className={styles.stack}>
            <BarList
              ariaLabel="Hiring pipeline"
              of={pipeline?.applied}
              emptyLabel="No applicants yet"
              items={
                pipeline
                  ? [
                      {
                        key: 'applied',
                        label: 'Applied',
                        value: pipeline.applied,
                      },
                      {
                        key: 'cv',
                        label: 'CV Matched',
                        value: pipeline.cvMatched,
                      },
                      {
                        key: 'pre',
                        label: 'Pre-Screened',
                        value: pipeline.preScreened,
                      },
                      {
                        key: 'personality',
                        label: 'Personality Test',
                        value: pipeline.personalityTest,
                      },
                      {
                        key: 'interview',
                        label: 'Interview',
                        value: pipeline.interview,
                      },
                    ]
                  : []
              }
            />
            {passRate && passRate.preScreened > 0 && (
              <p className={styles.muted}>
                {passRate.passed} of {passRate.preScreened} pre-screened
                candidates passed ({passRate.value}% pass rate) and{' '}
                {pipeline?.personalityTest ?? 0} moved on to the personality
                test.
              </p>
            )}
          </div>
        </PagePanel>

        <PagePanel title="Key Dates" hint="Timeline for this job post">
          <div className={styles.stack}>
            {summary && (
              <Timeline ariaLabel="Key dates" items={keyDates(summary)} />
            )}
          </div>
        </PagePanel>
      </div>

      <div className={styles.grid}>
        <PagePanel
          title="Recent Activity"
          hint="Latest updates on this job post"
          action={
            <button
              type="button"
              className={styles.linkButton}
              onClick={onViewCandidates}>
              See All
            </button>
          }>
          <div className={styles.stack}>
            <Timeline
              ariaLabel="Recent activity"
              items={(summary?.recentActivity ?? []).map((item, index) => ({
                id: `${item.type}-${index}`,
                title: item.title,
                time: formatTimeAgo(item.at),
                icon: ACTIVITY_ICON[item.type],
              }))}
            />
          </div>
        </PagePanel>

        <PagePanel
          title="Hiring Team"
          hint={`${
            summary?.hiringTeam.length ?? 0
          } people reviewing candidates`}
          actionTo="/recruiterDashboard/company"
          actionLabel="Invite">
          <div className={styles.stack}>
            <ul className={styles.team}>
              {(summary?.hiringTeam ?? []).map((member) => {
                const [firstName, ...rest] = member.name.split(' ')
                return (
                  <li key={member.userId} className={styles.member}>
                    <Avatar
                      firstName={firstName}
                      lastName={rest.join(' ')}
                      size="sm"
                    />
                    <span className={styles.memberText}>
                      <span className={styles.memberName}>{member.name}</span>
                      <span className={styles.muted}>
                        {capitalize(member.role)}
                      </span>
                    </span>
                    {member.isOwner && (
                      <Pill tone="brand" size="sm" icon={<LuUsers />}>
                        Owner
                      </Pill>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </PagePanel>
      </div>
    </div>
  )
}
