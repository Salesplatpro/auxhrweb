import React from 'react'
import {
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiGrid,
  FiMapPin,
  FiPieChart,
  FiTrendingUp,
} from 'react-icons/fi'

import { formatTimeAgo } from '@/utils'
import { formatCompensation } from '@/utils/formatCompensation'

import {
  formatClosingDate,
  formatEmploymentType,
  formatExperience,
  formatLocation,
  formatWorkMode,
} from './jobDetailsFormat'
import styles from './JobDetailsView.module.scss'
import type { JobDetailsJob } from './types'

type JobFactProps = {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}

export const JobFact: React.FC<JobFactProps> = ({ icon, label, value }) => (
  <li className={styles.fact}>
    <span className={styles.factIcon} aria-hidden>
      {icon}
    </span>
    <span className={styles.factText}>
      <span className={styles.factLabel}>{label}</span>
      <span className={styles.factValue}>{value}</span>
    </span>
  </li>
)

export const JobFacts: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <ul className={styles.facts}>{children}</ul>

export const JobOverview: React.FC<{ job: JobDetailsJob }> = ({ job }) => {
  const posted = formatTimeAgo(job.createdAt)
  const employmentType = formatEmploymentType(job)
  const closes = formatClosingDate(job)

  return (
    <section className={styles.card} aria-labelledby="job-overview-title">
      <h2 id="job-overview-title" className={styles.cardTitle}>
        Job overview
      </h2>
      <JobFacts>
        <JobFact
          icon={<FiCreditCard />}
          label="Salary"
          value={formatCompensation(job)}
        />
        <JobFact
          icon={<FiBriefcase />}
          label="Work mode"
          value={formatWorkMode(job) ?? 'Not specified'}
        />
        <JobFact
          icon={<FiMapPin />}
          label="Location"
          value={formatLocation(job) ?? 'Not specified'}
        />
        <JobFact
          icon={<FiTrendingUp />}
          label="Experience"
          value={formatExperience(job) ?? 'Not specified'}
        />
        {employmentType && (
          <JobFact
            icon={<FiFileText />}
            label="Job type"
            value={employmentType}
          />
        )}
        {job.department && (
          <JobFact
            icon={<FiGrid />}
            label="Department"
            value={job.department}
          />
        )}
        {closes && (
          <JobFact icon={<FiCalendar />} label="Closes" value={closes} />
        )}
        {job.shareOptions && (
          <JobFact
            icon={<FiPieChart />}
            label="Share options"
            value="Offered with this job"
          />
        )}
        {posted && <JobFact icon={<FiClock />} label="Posted" value={posted} />}
      </JobFacts>
    </section>
  )
}
