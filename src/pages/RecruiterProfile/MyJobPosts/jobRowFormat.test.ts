import { describe, expect, it } from 'vitest'

import { RecruiterJob } from '@/utils/recruiterJobPostsTypes'

import {
  jobEditPath,
  jobLocation,
  jobMonthlySalary,
  jobPostedLabel,
  jobSubtitle,
} from './jobRowFormat'

const job = (overrides: Partial<RecruiterJob> = {}): RecruiterJob => ({
  id: 'job-1',
  role: { id: 'role-1', name: 'product designer' },
  jobBrief: '',
  minSalary: 300000,
  maxSalary: 380000,
  currency: 'NGN',
  compensationPeriod: 'monthly',
  experienceLevel: '4-6 years',
  workMode: ['hybrid'],
  locationState: 'Lagos',
  department: 'Design',
  employmentType: 'full_time',
  status: 'active',
  createdAt: '2026-10-03T10:00:00.000Z',
  updatedAt: '2026-10-26T10:00:00.000Z',
  ...overrides,
})

describe('job post rows', () => {
  it('shows the department and job type under the title', () => {
    expect(jobSubtitle(job())).toBe('Design · Full time')
    expect(jobSubtitle(job({ department: null }))).toBe('Full time')
  })

  it('shows the state and work mode, or Remote', () => {
    expect(jobLocation(job())).toBe('Lagos · Hybrid')
    expect(
      jobLocation(job({ workMode: ['onSite'], locationState: 'Abuja' })),
    ).toBe('Abuja · On-site')
    expect(jobLocation(job({ workMode: ['remote'] }))).toBe('Remote')
  })

  it('shows pay per month, converting yearly pay', () => {
    expect(jobMonthlySalary(job())).toBe('₦300k – ₦380k')
    expect(
      jobMonthlySalary(
        job({
          minSalary: 10_800_000,
          maxSalary: 15_600_000,
          compensationPeriod: 'yearly',
        }),
      ),
    ).toBe('₦900k – ₦1.3M')
  })

  it('shows when a draft was last saved', () => {
    expect(jobPostedLabel(job())).toBe('Oct 3, 2026')
    expect(jobPostedLabel(job({ status: 'draft' }))).toBe('Draft saved Oct 26')
  })

  it('continues a draft in the post-a-job flow and edits a published job', () => {
    expect(jobEditPath(job({ status: 'draft' }))).toBe(
      '/recruiterDashboard/postjob/job-1',
    )
    expect(jobEditPath(job({ status: 'draft', aiConfigId: 'cfg-1' }))).toBe(
      '/recruiterDashboard/postjob/job-1/details',
    )
    expect(jobEditPath(job())).toBe('/recruiterDashboard/editJob/job-1')
  })
})
