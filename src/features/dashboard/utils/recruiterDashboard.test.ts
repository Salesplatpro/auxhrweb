import { describe, expect, it } from 'vitest'

import {
  greetingFor,
  jobPostMeta,
  shareOf,
  summaryReportRows,
} from './recruiterDashboard'

const post = {
  id: 'j1',
  title: 'Growth Lead',
  city: null,
  state: 'Lagos',
  country: 'Nigeria',
  workMode: ['remote', 'hybrid'],
  applicants: 1,
  screened: 0,
}

describe('recruiter dashboard helpers', () => {
  it('greets by the time of day', () => {
    expect(greetingFor(8)).toBe('Good morning')
    expect(greetingFor(12)).toBe('Good afternoon')
    expect(greetingFor(19)).toBe('Good evening')
  })

  it('works out a share without dividing by zero or passing 100', () => {
    expect(shareOf(3, 4)).toBe(75)
    expect(shareOf(5, 0)).toBe(0)
    expect(shareOf(9, 4)).toBe(100)
  })

  it('describes a job post by place, work mode and applicants', () => {
    expect(jobPostMeta(post)).toBe('Lagos · Remote, Hybrid · 1 applicant')
    expect(
      jobPostMeta({
        ...post,
        state: null,
        country: null,
        workMode: [],
        applicants: 3,
      }),
    ).toBe('3 applicants')
  })

  it('exports only fixed labels and numbers', () => {
    const rows = summaryReportRows({
      range: { days: 7, from: '2026-11-04', to: '2026-11-10' },
      kpis: {
        activeJobs: { total: 12, new: 2 },
        applications: { total: 1284, current: 90, previous: 80 },
        screened: { total: 846, applications: 1284 },
      },
      series: [],
      status: {
        total: 10,
        underReview: 4,
        inTesting: 3,
        shortlisted: 2,
        rejected: 1,
      },
      funnel: {
        applied: 90,
        cvMatched: 70,
        preScreened: 60,
        personalityTest: 30,
        shortlisted: 10,
      },
      activeJobPosts: [{ ...post, title: '=HYPERLINK("http://evil")' }],
    })

    expect(rows).toContainEqual(['Total applications', '1284'])
    expect(rows).toContainEqual(['Funnel: Personality Test', '30'])
    expect(rows.flat().some((cell) => cell.includes('HYPERLINK'))).toBe(false)
    expect(rows.every(([, value]) => /^\d+$/.test(value))).toBe(true)
  })
})
