import cn from 'classnames'
import React from 'react'
import { HiOutlineChartBar } from 'react-icons/hi2'

import { workModeNeedsLocation } from '@/components/features/jobs/WorkTypeCheckboxes'
import { IconBadge } from '@/components/ui/IconBadge'
import {
  formatAmount,
  formatShortAmount,
  PERIOD_WORD,
} from '@/features/jobs/utils/jobSalary'
import { PostJobFormValues } from '@/utils/jobPostTypes'

import styles from './SalaryComparison.module.scss'
import { useSalaryComparison, VERDICT_LABEL } from './useSalaryComparison'

type SalaryComparisonProps = {
  values: PostJobFormValues
  roleName: string
  jobId?: string
}

export const SalaryComparison = ({
  values,
  roleName,
  jobId,
}: SalaryComparisonProps) => {
  const { comparison, verdict, min, max } = useSalaryComparison(values, jobId)
  if (!comparison) return null

  const period = PERIOD_WORD[values.compensationPeriod] ?? ''
  const place = workModeNeedsLocation(values.workMode)
    ? values.location.state.name ||
      values.location.city.name ||
      values.location.country.name
    : ''
  const context = [
    roleName,
    values.experienceLevel,
    place,
    values.compensationPeriod,
  ]
    .filter(Boolean)
    .join(' · ')

  const header = (
    <div className={styles.header}>
      <IconBadge icon={<HiOutlineChartBar />} tone="violet" />
      <div className={styles.headerCopy}>
        <p className={styles.title}>Salary comparison</p>
        <p className={styles.context}>{context}</p>
      </div>
      {comparison.available && (
        <span className={styles.basedOn}>Based on {comparison.count} jobs</span>
      )}
    </div>
  )

  if (!comparison.available) {
    return (
      <section className={styles.panel} aria-label="Salary comparison">
        {header}
        <p className={styles.sentence}>
          Not enough similar jobs to compare yet.
        </p>
      </section>
    )
  }

  const { low, middle, high, currency } = comparison
  const lowest = Math.min(low, min ?? low)
  const highest = Math.max(high, max ?? min ?? high)
  const padding = (highest - lowest) * 0.25 || highest * 0.1 || 1
  const start = Math.max(0, lowest - padding)
  const span = highest + padding - start
  const at = (amount: number) => `${((amount - start) / span) * 100}%`
  const width = (from: number, to: number) =>
    `${Math.max(((to - from) / span) * 100, 1)}%`
  const yours = min ?? max

  return (
    <section className={styles.panel} aria-label="Salary comparison">
      {header}
      <p className={styles.sentence}>
        Similar jobs on AuxHR pay{' '}
        <strong>
          {formatAmount(currency, low)} to {formatAmount(currency, high)}
        </strong>{' '}
        a {period}. The middle is{' '}
        <strong>{formatAmount(currency, middle)}</strong>. Based on{' '}
        {comparison.count} jobs.
      </p>

      <div className={styles.chart} aria-hidden>
        <span className={styles.middleLabel} style={{ left: at(middle) }}>
          Middle
        </span>
        <div className={styles.track}>
          <span
            className={styles.similar}
            style={{ left: at(low), width: width(low, high) }}
          />
          {yours != null && (
            <span
              className={styles.yours}
              style={{
                left: at(yours),
                width: width(yours, max ?? yours),
              }}
            />
          )}
          <span className={styles.middle} style={{ left: at(middle) }} />
        </div>
        <div className={styles.axis}>
          {[low, middle, high].map((amount) => (
            <span key={amount} style={{ left: at(amount) }}>
              {formatShortAmount(currency, amount)}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <ul className={styles.legend}>
          {yours != null && (
            <li>
              <span className={cn(styles.dot, styles.dotYours)} />
              Your salary{' '}
              {[min, max]
                .filter((amount): amount is number => amount != null)
                .map((amount) => formatAmount(currency, amount))
                .join(' – ')}
            </li>
          )}
          <li>
            <span className={cn(styles.dot, styles.dotSimilar)} />
            Similar jobs
          </li>
        </ul>
        {verdict && (
          <span className={cn(styles.verdict, styles[verdict])}>
            <span className={styles.verdictDot} />
            {VERDICT_LABEL[verdict]}
          </span>
        )}
      </div>
    </section>
  )
}
