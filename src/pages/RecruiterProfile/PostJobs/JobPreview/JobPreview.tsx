import React from 'react'

import { workModeNeedsLocation } from '@/components/features/jobs/WorkTypeCheckboxes'
import { EMPLOYMENT_TYPE_OPTIONS } from '@/components/forms/Select'
import { formatSalaryRange, PERIOD_WORD } from '@/features/jobs/utils/jobSalary'
import { capitalizeEachWord } from '@/utils/CapitalizeWord'
import { PostJobFormValues } from '@/utils/jobPostTypes'

import { htmlToPlainText } from '../utils/aiText'
import styles from './JobPreview.module.scss'

const WORK_MODE_LABEL: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onSite: 'On-site',
}

const initials = (name?: string | null) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')

type JobPreviewProps = {
  values: PostJobFormValues
  roleName: string
  companyName?: string | null
}

export const JobPreview = ({
  values,
  roleName,
  companyName,
}: JobPreviewProps) => {
  const place = workModeNeedsLocation(values.workMode)
    ? [values.location.city.name, values.location.state.name]
        .filter(Boolean)
        .join(', ') || values.location.country.name
    : ''
  const pills = [
    ...values.workMode.map((mode) => WORK_MODE_LABEL[mode] ?? mode),
    values.experienceLevel,
    EMPLOYMENT_TYPE_OPTIONS.find((o) => o.value === values.employmentType)
      ?.label,
    values.shareOptions ? 'Share options' : '',
  ].filter(Boolean)
  const salary = formatSalaryRange(values, { short: true })
  const period = PERIOD_WORD[values.compensationPeriod]
  const brief = htmlToPlainText(values.jobBrief ?? '')

  return (
    <section className={styles.panel} aria-label="Job post preview">
      <p className={styles.kicker}>What candidates will see</p>
      <div className={styles.card}>
        <div className={styles.head}>
          <span className={styles.logo} aria-hidden>
            {initials(companyName) || '?'}
          </span>
          <div className={styles.headCopy}>
            <h3 className={styles.title}>
              {roleName ? capitalizeEachWord(roleName) : 'Job title'}
            </h3>
            <p className={styles.company}>
              {[companyName, place].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        {pills.length > 0 && (
          <ul className={styles.pills}>
            {pills.map((pill) => (
              <li key={pill} className={styles.pill}>
                {pill}
              </li>
            ))}
          </ul>
        )}
        {salary && (
          <p className={styles.salary}>
            {salary}
            {period ? ` / ${period}` : ''}
          </p>
        )}
        <p className={brief ? styles.brief : styles.placeholder}>
          {brief || 'Your job brief appears here.'}
        </p>
      </div>
    </section>
  )
}
