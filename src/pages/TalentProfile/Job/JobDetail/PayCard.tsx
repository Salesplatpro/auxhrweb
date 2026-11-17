import React from 'react'

import {
  formatAmountShort,
  formatPayFull,
  periodLabel,
} from '@/features/talent-applications/format'
import { PayComparison } from '@/features/talent-applications/types'
import { usePayComparisonQuery } from '@/redux/api/talent'

import styles from './TalentJobDetail.module.scss'

const percent = (value: number, start: number, end: number) =>
  `${((value - start) / (end - start)) * 100}%`

const positionPhrase = (
  job: PayComparison['job'],
  low: number,
  high: number,
) => {
  const mid =
    job.maxSalary != null ? (job.minSalary + job.maxSalary) / 2 : job.minSalary
  const ratio = high > low ? (mid - low) / (high - low) : 0.5
  if (ratio < 1 / 3) return 'On the lower side'
  if (ratio > 2 / 3) return 'On the higher side'
  return 'Around the middle'
}

export const PayCard = ({ jobId, title }: { jobId: string; title: string }) => {
  const { data } = usePayComparisonQuery(jobId)
  if (!data) return null
  const { job } = data
  const pay = formatPayFull(job)
  if (!pay) return null
  const period = periodLabel(job.compensationPeriod)
  const compared =
    data.available &&
    data.low != null &&
    data.high != null &&
    data.count != null
      ? { low: data.low, high: data.high, count: data.count }
      : null
  const jobMax = job.maxSalary ?? job.minSalary
  const start = compared ? Math.min(compared.low, job.minSalary) : 0
  const end = compared ? Math.max(compared.high, jobMax) : 0

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Pay for this role</h2>
      <p className={styles.payAmount}>
        {pay}
        {period && <span className={styles.payPeriod}> / {period}</span>}
      </p>
      {compared && end > start && (
        <>
          <span className={styles.payTrack}>
            <span
              className={styles.payRange}
              style={{
                left: percent(compared.low, start, end),
                right: `calc(100% - ${percent(compared.high, start, end)})`,
              }}
            />
            <span
              className={styles.payJob}
              style={{
                left: percent(job.minSalary, start, end),
                right: `calc(100% - ${percent(jobMax, start, end)})`,
              }}
            />
          </span>
          <p className={styles.payNote}>
            {positionPhrase(job, compared.low, compared.high)} for similar{' '}
            {title} jobs
            {data.area ? ` in ${data.area}` : ''} (
            {formatAmountShort(job.currency, compared.low)}–
            {formatAmountShort(job.currency, compared.high)}, based on{' '}
            {compared.count} jobs).
          </p>
        </>
      )}
    </section>
  )
}
