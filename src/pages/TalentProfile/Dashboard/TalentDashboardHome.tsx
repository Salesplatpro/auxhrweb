import React from 'react'
import {
  HiOutlineClipboardDocumentCheck,
  HiOutlineDocumentText,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import { Link, useNavigate } from 'react-router-dom'

import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pill } from '@/components/ui/Pill'
import { Skeleton } from '@/components/ui/Skeleton'
import { Heading, Text } from '@/components/ui/Typography'
import { CardError } from '@/features/dashboard/components/CardError/CardError'
import { useTalentDashboard } from '@/features/dashboard/hooks/useTalentDashboard'
import {
  applicationCounts,
  newMatchesLine,
  placeAndMode,
  STRONG_PROFILE_PERCENT,
  waitingOnTalent,
  yearsLabel,
} from '@/features/dashboard/utils/talentDashboard'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useRouteToast } from '@/hooks/useRouteToast'
import { useAllJobApplicationsQuery } from '@/redux/api/talent'
import { formatTimeAgo } from '@/utils'
import ProgressBar from '@/utils/ProgressBar'
import { AllJobTypes } from '@/utils/types'

import styles from './TalentDashboardHome.module.scss'

const JOBS_PATH = '/talentDashboard/job'
const PROFILE_PATH = '/talentDashboard/talentProfile'
const SKILLS_SHOWN = 3

const TalentDashboardHome = () => {
  useRouteToast()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { dashboard, error, isLoading, retry } = useTalentDashboard()
  const { data: applicationsData, isLoading: applicationsLoading } =
    useAllJobApplicationsQuery({})

  const applications: AllJobTypes[] = applicationsData?.data?.applications ?? []
  const counts = applicationCounts(applications)
  const upNext = waitingOnTalent(applications)
  const percentage = profile?.profileCompletion?.percentage ?? 0
  const firstName = profile?.firstName ?? ''
  const lastName = profile?.lastName ?? ''
  const roleName = profile?.userRoles?.[0]?.name
  const meta = [
    roleName,
    [profile?.locationCity, profile?.locationState, profile?.locationCountry]
      .filter(Boolean)
      .join(', ') || null,
    yearsLabel(profile?.cvYearsExperience, profile?.experience),
  ]
    .filter(Boolean)
    .join(' · ')
  const skills = (profile?.cvSkills ?? []).slice(0, SKILLS_SHOWN)

  return (
    <PageShell wide>
      <div className={styles.titleRow}>
        <div>
          <Heading level={1}>
            {`Welcome back${firstName ? `, ${firstName}` : ''}`}
          </Heading>
          <Text as="p" size="fs-lg" color="muted">
            {dashboard
              ? newMatchesLine(dashboard.newMatchesToday)
              : 'Here’s what’s happening with your job search.'}
          </Text>
        </div>
        <Button
          icon={<HiOutlineSparkles size={16} />}
          onClick={() => navigate(JOBS_PATH)}>
          Find Matches
        </Button>
      </div>

      <div className={styles.layout}>
        <div className={styles.column}>
          <Card className={styles.profileCard}>
            <div className={styles.banner} aria-hidden />
            <div className={styles.profileBody}>
              <Avatar
                firstName={firstName}
                lastName={lastName}
                src={profile?.profileImageUrl}
                size="lg"
                className={styles.avatar}
              />
              <Text as="p" size="fs-xl" weight="bolder">
                {`${firstName} ${lastName}`.trim() || 'Your profile'}
              </Text>
              {meta && (
                <Text as="p" size="fs-md" color="muted">
                  {meta}
                </Text>
              )}
              {skills.length > 0 && (
                <div className={styles.skills}>
                  {skills.map((skill) => (
                    <Pill
                      key={skill}
                      tone="violet"
                      size="sm"
                      className={styles.skill}>
                      {skill}
                    </Pill>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className={styles.strength}>
            <ProgressBar
              percentage={percentage}
              size={96}
              textColor="var(--color-text-heading)"
              pathColor="var(--color-violet)"
              trailColor="var(--color-bg-subtle)"
            />
            <div className={styles.strengthText}>
              <Text as="p" size="fs-lg" weight="bolder">
                Profile Strength
              </Text>
              <Text as="p" size="fs-md" color="muted">
                {percentage >= 100
                  ? 'Your profile is complete.'
                  : 'Complete your profile to reach 100%.'}
              </Text>
              {percentage >= STRONG_PROFILE_PERCENT ? (
                <Pill tone="violet" size="sm">
                  Strong Profile
                </Pill>
              ) : (
                <Link to={PROFILE_PATH} className={styles.inlineLink}>
                  Complete profile
                </Link>
              )}
            </div>
          </Card>

          <PagePanel title="Your Applications" hint="Tracked live">
            {applicationsLoading ? (
              <Skeleton height="5rem" />
            ) : (
              <div className={styles.counts}>
                {[
                  { label: 'Applied', value: counts.applied },
                  { label: 'In Review', value: counts.inReview },
                  { label: 'Shortlisted', value: counts.shortlisted },
                ].map((tile) => (
                  <div key={tile.label} className={styles.countTile}>
                    <Text as="p" size="fs-3xl" weight="bolder">
                      {tile.value}
                    </Text>
                    <Text as="p" size="fs-md" color="muted">
                      {tile.label}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </PagePanel>
        </div>

        <div className={styles.column}>
          <PagePanel
            title="Matched For You"
            hint="Ranked by how well your CV fits each role"
            actionTo={JOBS_PATH}
            actionLabel="View All">
            {error ? (
              <CardError onRetry={retry} />
            ) : isLoading || !dashboard ? (
              <Skeleton height="16rem" />
            ) : !dashboard.cvReady ? (
              <EmptyState
                icon={<HiOutlineDocumentText size={28} />}
                title="We’re still reading your CV"
                description="Your matches show up here once it’s done. This usually takes a few minutes."
              />
            ) : dashboard.matches.length === 0 ? (
              <EmptyState
                title="No new matches right now"
                description="Browse every open role while new ones come in."
                action={
                  <Button variant="outline" onClick={() => navigate(JOBS_PATH)}>
                    Find Jobs
                  </Button>
                }
              />
            ) : (
              <ul className={styles.matches}>
                {dashboard.matches.map((match) => (
                  <li key={match.jobId} className={styles.match}>
                    <span className={styles.initial} aria-hidden>
                      {(match.company ?? match.title)[0]?.toUpperCase()}
                    </span>
                    <span className={styles.matchText}>
                      <Text as="span" size="fs-lg" weight="bolder">
                        {match.title}
                      </Text>
                      <Text as="span" size="fs-md" color="muted">
                        {[
                          match.company,
                          placeAndMode(
                            [match.city, match.state, match.country],
                            match.workMode,
                          ),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                      <Pill tone="neutral" size="sm">
                        Posted {formatTimeAgo(match.createdAt)}
                      </Pill>
                    </span>
                    <span className={styles.score}>
                      <Text as="span" size="fs-xl" weight="bolder">
                        {Math.round(match.matchPercent)}%
                      </Text>
                      <Text as="span" size="fs-sm" color="muted">
                        Match
                      </Text>
                      <span className={styles.scoreTrack} aria-hidden>
                        <span
                          className={styles.scoreFill}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, match.matchPercent),
                            )}%`,
                          }}
                        />
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`${JOBS_PATH}/${match.jobId}`)}>
                      Apply
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </PagePanel>

          <PagePanel title="Up Next" hint="Assessments waiting for you">
            {applicationsLoading ? (
              <Skeleton height="5rem" />
            ) : upNext.length === 0 ? (
              <EmptyState
                icon={<HiOutlineClipboardDocumentCheck size={28} />}
                title="Nothing waiting on you"
                description="Assessments for jobs you apply to show up here."
              />
            ) : (
              <ul className={styles.upNext}>
                {upNext.map((item) => (
                  <li key={item.applicationId}>
                    <Link
                      to={`${JOBS_PATH}/${item.jobId}`}
                      className={styles.upNextRow}>
                      <span className={styles.initial} aria-hidden>
                        {(item.company ?? item.title)[0]?.toUpperCase()}
                      </span>
                      <span className={styles.matchText}>
                        <Text as="span" size="fs-md" weight="bolder">
                          {item.stage}
                        </Text>
                        <Text as="span" size="fs-sm" color="muted">
                          {[item.title, item.company]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </span>
                      <Pill tone="warning" size="sm">
                        Due
                      </Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PagePanel>
        </div>
      </div>
    </PageShell>
  )
}

export default TalentDashboardHome
