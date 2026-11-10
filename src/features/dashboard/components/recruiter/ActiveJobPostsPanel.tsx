import React from 'react'
import { Link } from 'react-router-dom'

import { PagePanel } from '@/components/layout/PagePanel'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pill } from '@/components/ui/Pill'
import { Text } from '@/components/ui/Typography'

import { RecruiterDashboardSummary } from '../../types'
import { jobPostMeta, shareOf } from '../../utils/recruiterDashboard'
import styles from './RecruiterDashboard.module.scss'

type ActiveJobPostsPanelProps = {
  posts: RecruiterDashboardSummary['activeJobPosts']
}

export const ActiveJobPostsPanel = ({ posts }: ActiveJobPostsPanelProps) => (
  <PagePanel
    title="Active Job Posts"
    hint="Applicants and screening progress per role"
    actionTo="/recruiterDashboard/myJobPosts"
    actionLabel="Manage Jobs">
    {posts.length === 0 ? (
      <EmptyState
        title="No active job posts"
        description="Publish a job and its applicants and screening progress show up here."
      />
    ) : (
      <ul className={styles.jobs}>
        {posts.map((post) => {
          const screened = shareOf(post.screened, post.applicants)
          return (
            <li key={post.id}>
              <Link
                to={`/recruiterDashboard/singleJobPost/${post.id}`}
                className={styles.jobRow}>
                <span className={styles.jobText}>
                  <Text as="span" size="fs-md" weight="bolder">
                    {post.title}
                  </Text>
                  <Text as="span" size="fs-sm" color="muted">
                    {jobPostMeta(post)}
                  </Text>
                  <span
                    className={styles.meterTrack}
                    role="progressbar"
                    aria-label={`${post.title}: ${screened}% screened`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={screened}>
                    <span
                      className={styles.meterFill}
                      style={{ width: `${screened}%` }}
                    />
                  </span>
                </span>
                <Pill tone="success" size="sm">
                  Open
                </Pill>
              </Link>
            </li>
          )
        })}
      </ul>
    )}
  </PagePanel>
)
