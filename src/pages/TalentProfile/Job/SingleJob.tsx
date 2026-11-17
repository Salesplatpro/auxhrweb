import React from 'react'
import { HiOutlineStar, HiStar } from 'react-icons/hi2'
import { Link } from 'react-router-dom'

import {
  experienceLabel,
  formatPayShort,
  jobPlace,
  workModeLabel,
} from '@/features/talent-applications/format'
import { useSaveJob } from '@/features/talent-applications/useSaveJob'
import { formatTimeAgo } from '@/utils/calculateDaysFromCreation'

import styles from './SingleJob.module.scss'

export interface ListedJob {
  id: string
  role: { name: string }
  createdAt: string
  experienceLevel?: string | null
  employmentType?: string | null
  workMode?: string[]
  locationCity?: string | null
  locationState?: string | null
  locationCountry?: string | null
  minSalary?: number | null
  maxSalary?: number | null
  currency?: string | null
  compensationPeriod?: string | null
  isSaved?: boolean
  organization?: { name: string } | null
}

const EMPLOYMENT: Record<string, string> = {
  full_time: 'Full time',
  part_time: 'Part time',
  contract: 'Contract',
  internship: 'Internship',
}

export const jobPath = (jobId: string) => `/talentDashboard/job/${jobId}`

export const SingleJob = ({
  job,
  tourId,
}: {
  job: ListedJob
  tourId?: string
}) => {
  const { saved, toggle, pending } = useSaveJob(job.id, !!job.isSaved)
  const company = job.organization?.name
  const meta = [company, jobPlace(job), workModeLabel(job.workMode)].filter(
    Boolean,
  )
  const pay = formatPayShort(job)
  const tags = [
    job.employmentType ? EMPLOYMENT[job.employmentType] : null,
    experienceLabel(job.experienceLevel),
  ].filter(Boolean)

  return (
    <article className={styles.card} data-tour={tourId}>
      <span className={styles.avatar} aria-hidden>
        {(company ?? job.role.name)[0]?.toUpperCase()}
      </span>
      <div className={styles.body}>
        <Link to={jobPath(job.id)} className={styles.title}>
          {job.role.name}
        </Link>
        <p className={styles.meta}>{meta.join(' · ')}</p>
        <div className={styles.tags}>
          {pay && <span className={styles.pay}>{pay}</span>}
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.side}>
        <span className={styles.posted}>{formatTimeAgo(job.createdAt)}</span>
        <button
          type="button"
          className={styles.star}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from saved jobs' : 'Save job'}
          disabled={pending}
          onClick={() => void toggle()}>
          {saved ? <HiStar /> : <HiOutlineStar />}
        </button>
      </div>
    </article>
  )
}
