import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

import { salaryComparisonKey, SalaryComparisonView } from './SalaryComparison'

const base = {
  roleId: 'role-1',
  experienceLevel: '1-3 years',
  currency: 'NGN',
  compensationPeriod: 'monthly',
  locationCountry: 'Nigeria',
  locationState: 'Lagos',
  locationCity: 'Lagos',
}

describe('salary comparison', () => {
  it('asks only once role, level, currency and period are set', () => {
    expect(salaryComparisonKey({ ...base, roleId: '' })).toBeNull()
    expect(salaryComparisonKey({ ...base, currency: '' })).toBeNull()
    const key = salaryComparisonKey({ ...base, excludeJobId: 'job-9' })!
    expect(key.startsWith('/jobs/salary-comparison?')).toBe(true)
    const params = new URLSearchParams(key.split('?')[1])
    expect(params.get('roleId')).toBe('role-1')
    expect(params.get('locationCity')).toBe('Lagos')
    expect(params.get('excludeJobId')).toBe('job-9')
  })

  it('leaves out empty location parts', () => {
    const key = salaryComparisonKey({ ...base, locationCity: '' })!
    expect(new URLSearchParams(key.split('?')[1]).has('locationCity')).toBe(
      false,
    )
  })

  it('shows low, middle and high and how many AuxHR jobs it is based on', () => {
    render(
      <SalaryComparisonView
        data={{
          available: true,
          count: 12,
          low: 150000,
          middle: 300000,
          high: 600000,
          currency: 'NGN',
          compensationPeriod: 'monthly',
        }}
      />,
    )
    expect(screen.getByText('Based on 12 AuxHR jobs')).toBeTruthy()
    expect(screen.getByText(/150,000/)).toBeTruthy()
    expect(screen.getByText(/300,000/)).toBeTruthy()
    expect(screen.getByText(/600,000/)).toBeTruthy()
  })

  it('shows nothing when there are fewer than 5 similar jobs', () => {
    const { container } = render(
      <SalaryComparisonView data={{ available: false }} />,
    )
    expect(container.textContent).toBe('')
  })
})
