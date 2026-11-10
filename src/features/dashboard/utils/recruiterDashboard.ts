import { RecruiterDashboardSummary } from '../types'

export const greetingFor = (hour: number) => {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export const shareOf = (part: number, whole: number) =>
  whole > 0 ? Math.min(100, Math.max(0, Math.round((part / whole) * 100))) : 0

const capitalize = (word: string) =>
  word ? word[0].toUpperCase() + word.slice(1) : word

export const jobPostMeta = (
  post: RecruiterDashboardSummary['activeJobPosts'][number],
) =>
  [
    [post.city, post.state, post.country].filter(Boolean)[0] ?? null,
    post.workMode.map(capitalize).join(', ') || null,
    `${post.applicants} applicant${post.applicants === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ')

export const STATUS_SLICES = [
  {
    key: 'underReview',
    label: 'Under Review',
    color: 'var(--color-brand-vivid)',
  },
  { key: 'inTesting', label: 'In Testing', color: 'var(--color-violet)' },
  { key: 'shortlisted', label: 'Shortlisted', color: 'var(--color-success)' },
  { key: 'rejected', label: 'Rejected', color: 'var(--color-danger)' },
] as const

export const FUNNEL_STEPS = [
  { key: 'applied', label: 'Applied' },
  { key: 'cvMatched', label: 'CV Matched' },
  { key: 'preScreened', label: 'Pre-Screened' },
  { key: 'personalityTest', label: 'Personality Test' },
  { key: 'shortlisted', label: 'Shortlisted' },
] as const

export const summaryReportRows = (summary: RecruiterDashboardSummary) => {
  const { kpis, status, funnel } = summary
  return [
    ['Active job posts', String(kpis.activeJobs.total)],
    ['New job posts in range', String(kpis.activeJobs.new)],
    ['Total applications', String(kpis.applications.total)],
    ['Applications in range', String(kpis.applications.current)],
    ['Applications in previous range', String(kpis.applications.previous)],
    ['Screened by AI', String(kpis.screened.total)],
    ...STATUS_SLICES.map((slice) => [
      `Status: ${slice.label}`,
      String(status[slice.key]),
    ]),
    ...FUNNEL_STEPS.map((step) => [
      `Funnel: ${step.label}`,
      String(funnel[step.key]),
    ]),
  ]
}
