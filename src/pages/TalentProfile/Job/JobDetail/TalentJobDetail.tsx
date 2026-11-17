import React, { useState } from 'react'
import { HiOutlineStar, HiStar } from 'react-icons/hi2'
import { useNavigate, useParams } from 'react-router-dom'

import RichTextDisplay from '@/components/features/shared/global/RichTextDisplay'
import { PageShell } from '@/components/layout/PageShell'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/Button'
import { CheckList } from '@/components/ui/CheckList'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import {
  experienceLabelWithYears,
  formatPayShort,
  initialsOf,
  jobPlace,
  workModeLabel,
} from '@/features/talent-applications/format'
import { applicationPath } from '@/features/talent-applications/steps'
import { ScreeningPlanStep } from '@/features/talent-applications/types'
import { useSaveJob } from '@/features/talent-applications/useSaveJob'
import { useIndividualJobQuery } from '@/redux/api/talent'
import { formatTimeAgo } from '@/utils/calculateDaysFromCreation'

import { ApplyModal } from './ApplyModal'
import { PayCard } from './PayCard'
import { ScreeningCard } from './ScreeningCard'
import styles from './TalentJobDetail.module.scss'

export interface TalentJob {
  id: string
  status: string
  role: { name: string }
  createdAt: string
  jobBrief?: string | null
  requirements?: string | null
  skills?: string[] | null
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
  closesAt?: string | null
  hasApplied?: boolean
  applicationId?: string | null
  isSaved?: boolean
  screening: ScreeningPlanStep[]
  organization?: {
    name: string
    logoUrl?: string | null
    website?: string | null
  } | null
  company?: { mission: string | null; staffSize: string | null } | null
}

const EMPLOYMENT: Record<string, string> = {
  full_time: 'Full time',
  part_time: 'Part time',
  contract: 'Contract',
  internship: 'Internship',
}

const listItems = (html?: string | null) =>
  html
    ? Array.from(
        new DOMParser()
          .parseFromString(html, 'text/html')
          .querySelectorAll('li'),
      )
        .map((item) => item.textContent?.trim() ?? '')
        .filter(Boolean)
    : []

const closingLabel = (closesAt?: string | null) => {
  if (!closesAt) return null
  const [year, month, day] = closesAt.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return null
  return `Closes ${new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    },
  )}`
}

const websiteLink = (website?: string | null) => {
  if (!website) return null
  const url = /^https?:\/\//i.test(website) ? website : `https://${website}`
  return /^https?:\/\/[^\s]+$/i.test(url) ? url : null
}

const Logo = ({
  name,
  logoUrl,
  size,
}: {
  name: string
  logoUrl?: string | null
  size: 'lg' | 'md'
}) => (
  <span className={size === 'lg' ? styles.logo : styles.logoSmall} aria-hidden>
    {logoUrl ? <img src={logoUrl} alt="" /> : initialsOf(name)}
  </span>
)

const TalentJobDetail = () => {
  const { jobId = '' } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useIndividualJobQuery(jobId)
  const job: TalentJob | undefined = data?.data?.job
  const { saved, toggle, pending } = useSaveJob(jobId, !!job?.isSaved)
  const [applying, setApplying] = useState(false)

  if (isLoading) return <Spinner fullPage />
  if (!job) {
    return (
      <PageShell wide>
        <EmptyState
          title="Job not found"
          description="This job may have been removed."
        />
      </PageShell>
    )
  }

  const company = job.organization?.name ?? ''
  const pay = formatPayShort(job)
  const requirements = listItems(job.requirements)
  const website = websiteLink(job.organization?.website)
  const about = [
    job.company?.mission,
    job.company?.staffSize && `${job.company.staffSize} staff`,
  ]
    .filter(Boolean)
    .join(' · ')
  const tags = [
    job.employmentType ? EMPLOYMENT[job.employmentType] : null,
    experienceLabelWithYears(job.experienceLevel),
  ].filter(Boolean)
  const closing = closingLabel(job.closesAt)
  const meta = [
    company,
    jobPlace(job),
    workModeLabel(job.workMode),
    `Posted ${formatTimeAgo(job.createdAt)}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <PageShell wide>
      <Breadcrumb
        items={[
          { label: 'Find Jobs', to: '/talentDashboard/job' },
          { label: job.role.name },
        ]}
      />
      <div className={styles.layout}>
        <article className={styles.main}>
          <header className={styles.head}>
            <Logo
              name={company || job.role.name}
              logoUrl={job.organization?.logoUrl}
              size="lg"
            />
            <div>
              <h1 className={styles.title}>{job.role.name}</h1>
              <p className={styles.meta}>{meta}</p>
            </div>
          </header>
          <div className={styles.tags}>
            {pay && <span className={styles.pay}>{pay}</span>}
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
            {closing && <span className={styles.closing}>{closing}</span>}
          </div>

          {job.jobBrief && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About the role</h2>
              <RichTextDisplay content={job.jobBrief} className={styles.text} />
            </section>
          )}
          {(requirements.length > 0 || job.requirements) && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>What you&apos;ll need</h2>
              {requirements.length > 0 ? (
                <CheckList items={requirements.map((label) => ({ label }))} />
              ) : (
                <RichTextDisplay
                  content={job.requirements ?? ''}
                  className={styles.text}
                />
              )}
            </section>
          )}
          {!!job.skills?.length && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Skills</h2>
              <ul className={styles.skills}>
                {job.skills.map((skill) => (
                  <li key={skill} className={styles.tag}>
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {company && (
            <footer className={styles.company}>
              <Logo
                name={company}
                logoUrl={job.organization?.logoUrl}
                size="md"
              />
              <div className={styles.companyText}>
                <span className={styles.companyName}>About {company}</span>
                {about && <span className={styles.companyAbout}>{about}</span>}
              </div>
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.companyLink}>
                  View company
                </a>
              )}
            </footer>
          )}
        </article>

        <aside className={styles.side}>
          <div className={styles.card}>
            {job.hasApplied && job.applicationId ? (
              <Button
                variant="gradient"
                size="lg"
                stretch
                onClick={() => navigate(applicationPath(job.applicationId!))}>
                View application
              </Button>
            ) : (
              <Button
                variant="gradient"
                size="lg"
                stretch
                data-tour="apply-job"
                disabled={job.status !== 'active'}
                onClick={() => setApplying(true)}>
                Apply now
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              stretch
              icon={saved ? <HiStar /> : <HiOutlineStar />}
              aria-pressed={saved}
              disabled={pending}
              onClick={() => void toggle()}>
              {saved ? 'Saved' : 'Save job'}
            </Button>
            <p className={styles.hint}>
              Takes about 2 minutes. Your profile CV is used.
            </p>
          </div>
          <PayCard jobId={job.id} title={job.role.name} />
          {job.screening.length > 0 && <ScreeningCard steps={job.screening} />}
        </aside>
      </div>

      <ApplyModal
        open={applying}
        job={job}
        onClose={() => setApplying(false)}
        onApplied={(applicationId) =>
          navigate(`${applicationPath(applicationId)}/sent`)
        }
      />
    </PageShell>
  )
}

export default TalentJobDetail
