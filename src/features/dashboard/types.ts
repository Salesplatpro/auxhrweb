export interface RecruiterNavCounts {
  applications: number
  shortlisted: number
}

export const SUMMARY_RANGES = [7, 30, 90] as const
export type SummaryRange = (typeof SUMMARY_RANGES)[number]

export const SUMMARY_CHARTS = ['7d', '12w', '1y'] as const
export type SummaryChart = (typeof SUMMARY_CHARTS)[number]

export interface RecruiterDashboardSummary {
  range: { days: number; from: string; to: string }
  kpis: {
    activeJobs: { total: number; new: number }
    applications: { total: number; current: number; previous: number }
    screened: { total: number; applications: number }
  }
  series: Array<{ date: string; applications: number; screened: number }>
  status: {
    total: number
    underReview: number
    inTesting: number
    shortlisted: number
    rejected: number
  }
  funnel: {
    applied: number
    cvMatched: number
    preScreened: number
    personalityTest: number
    shortlisted: number
  }
  activeJobPosts: Array<{
    id: string
    title: string
    city: string | null
    state: string | null
    country: string | null
    workMode: string[]
    applicants: number
    screened: number
  }>
}

export interface DashboardApplicant {
  id: string
  jobId: string
  applicantName: string
  role: string | null
  cvMatch: number | null
  prescreeningScore: number | null
  status: string
  currentStage: string
  dateApplied: string
}

export interface DashboardApplicantsPage {
  items: DashboardApplicant[]
  total: number
}

export interface TalentJobMatch {
  jobId: string
  title: string
  company: string | null
  companyLogoUrl: string | null
  city: string | null
  state: string | null
  country: string | null
  workMode: string[]
  createdAt: string
  matchPercent: number
}

export interface TalentDashboard {
  cvReady: boolean
  matches: TalentJobMatch[]
  newMatchesToday: number
}
