import React, { useRef, useState } from 'react'
import { HiCheck, HiOutlineLink } from 'react-icons/hi2'
import { LuCopy } from 'react-icons/lu'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

import { PageShell } from '@/components/layout/PageShell'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useIndividualJobQuery } from '@/redux/api/talent'
import { capitalizeEachWord } from '@/utils/CapitalizeWord'
import { buildJobShareUrl } from '@/utils/shareLinks'

import styles from './JobLive.module.scss'

const JOB_POSTS_PATH = '/recruiterDashboard/myJobPosts'

export const JobLive = () => {
  const { jobId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const justPublished = !!(location.state as { justPublished?: boolean } | null)
    ?.justPublished
  const { profile } = useProfile()
  const { data, isLoading } = useIndividualJobQuery(jobId, { skip: !jobId })
  const [copied, setCopied] = useState(false)
  const linkRef = useRef<HTMLInputElement>(null)

  if (isLoading) return <Spinner fullPage />

  const job = data?.data?.job ?? data?.data
  // Right after publishing, the cached job can still say draft until it refetches.
  if (!job || (job.status !== 'active' && !justPublished)) {
    return (
      <Navigate to={`/recruiterDashboard/postjob/${jobId}/review`} replace />
    )
  }

  const roleName = capitalizeEachWord(job.role?.name ?? '')
  const link = buildJobShareUrl(jobId)
  const inFeed = !!profile?.activeOrganization?.indeedFeedEnabled

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      linkRef.current?.select()
    }
  }

  return (
    <PageShell wide>
      <Breadcrumb
        items={[
          { label: 'Job Posts', to: JOB_POSTS_PATH },
          { label: roleName },
        ]}
      />
      <section className={styles.card}>
        <span className={styles.check} aria-hidden>
          <HiCheck />
        </span>
        <h1 className={styles.title}>{roleName} is live</h1>
        <p className={styles.text}>
          Candidates can apply now.
          {inFeed &&
            " It's also in your job feed, so Indeed will show it within an hour."}
        </p>
        <div className={styles.linkRow}>
          <label className={styles.link}>
            <HiOutlineLink aria-hidden />
            <input
              ref={linkRef}
              readOnly
              value={link.replace(/^https?:\/\/(www\.)?/, '')}
              aria-label="Job link"
              onFocus={(event) => event.target.select()}
            />
          </label>
          <Button
            type="button"
            variant="outline"
            size="lg"
            icon={<LuCopy size={16} />}
            onClick={() => void copy()}>
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate('/recruiterDashboard/postjob')}>
            Post another job
          </Button>
          <Button
            type="button"
            variant="ink"
            size="lg"
            onClick={() =>
              navigate(`/recruiterDashboard/singleJobPost/${jobId}`, {
                state: { jobName: job.role?.name, postedAt: job.createdAt },
              })
            }>
            View applicants
          </Button>
        </div>
      </section>
    </PageShell>
  )
}
