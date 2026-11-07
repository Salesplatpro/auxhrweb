import React from 'react'
import useSWR from 'swr'

import { httpClient } from '@/features/auth/services/httpClient'

export interface SalaryComparisonParams {
  roleId?: string
  experienceLevel?: string
  currency?: string
  compensationPeriod?: string
  locationCountry?: string
  locationState?: string
  locationCity?: string
  excludeJobId?: string
}

export type SalaryComparisonData =
  | { available: false }
  | {
      available: true
      count: number
      low: number
      middle: number
      high: number
      currency: string
      compensationPeriod: string
    }

const REQUIRED = [
  'roleId',
  'experienceLevel',
  'currency',
  'compensationPeriod',
] as const

export const salaryComparisonKey = (
  params: SalaryComparisonParams,
): string | null => {
  if (REQUIRED.some((key) => !params[key])) return null
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  return `/jobs/salary-comparison?${query.toString()}`
}

const formatAmount = (amount: number) => amount.toLocaleString('en-US')

export const SalaryComparisonView = ({
  data,
}: {
  data?: SalaryComparisonData
}) => {
  if (!data || !data.available) return null
  const suffix = `${data.currency} per ${
    data.compensationPeriod === 'yearly' ? 'year' : 'month'
  }`
  return (
    <div
      role="note"
      style={{
        marginTop: 'var(--space-3, 12px)',
        padding: 'var(--space-3, 12px)',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'var(--color-surface-muted, #f6f7f9)',
        fontSize: 'var(--text-sm, 14px)',
      }}>
      <div style={{ fontWeight: 600 }}>Similar jobs on AuxHR pay</div>
      <div>
        Low {formatAmount(data.low)} · Middle {formatAmount(data.middle)} · High{' '}
        {formatAmount(data.high)} {suffix}
      </div>
      <div style={{ color: 'var(--color-text-muted)' }}>
        Based on {data.count} AuxHR jobs
      </div>
    </div>
  )
}

export const SalaryComparison = (params: SalaryComparisonParams) => {
  const key = salaryComparisonKey(params)
  const { data } = useSWR(key, (url: string) =>
    httpClient
      .get<{ data: SalaryComparisonData }>(url)
      .then((response) => response.data.data),
  )
  return <SalaryComparisonView data={data} />
}
