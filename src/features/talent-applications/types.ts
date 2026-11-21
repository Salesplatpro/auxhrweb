export type PipelineStepKey =
  | 'applied'
  | 'skills_test'
  | 'cv_match'
  | 'tailored'
  | 'problem_solving'
  | 'culture_fit'
  | 'personality'
  | 'ai_interview'
  | 'references'
  | 'checks'
  | 'company_review'

export type PipelineStepState = 'done' | 'current' | 'upcoming'

export type CandidateStatus =
  | 'interview_to_do'
  | 'test_to_take'
  | 'screening'
  | 'shortlisted'
  | 'applied'
  | 'not_proceeding'

export type ApplicationGroup = 'needs_you' | 'in_progress' | 'closed'

export interface PipelineStep {
  key: PipelineStepKey
  state: PipelineStepState
  sentAt: string | null
  doneAt: string | null
  dueAt: string | null
  isNew: boolean
  questionCount: number | null
  minutes: number | null
  score: number | null
  passed: boolean | null
  matchLabel: 'strong' | 'good' | 'fair' | null
  answersSent: number | null
  retryAt: string | null
  interviewId: string | null
  refereeCount: number | null
  maxReferees: number | null
  outcome: 'shortlisted' | 'not_proceeding' | null
}

export interface PipelineOrganization {
  id: string
  name: string
  logoUrl: string | null
}

export interface CandidatePipeline {
  application: {
    id: string
    jobId: string
    status: string
    appliedAt: string
    candidateStatus: CandidateStatus
    group: ApplicationGroup
    job: {
      id: string
      title: string
      status: string
      workMode: string[]
      locationCity: string | null
      locationState: string | null
      locationCountry: string | null
      organization: PipelineOrganization | null
    }
  }
  steps: PipelineStep[]
  currentStep: number | null
  totalSteps: number
  nextStep: PipelineStep | null
}

export interface PayComparison {
  available: boolean
  count?: number
  low?: number
  middle?: number
  high?: number
  currency?: string
  compensationPeriod?: string
  area: string | null
  job: {
    minSalary: number
    maxSalary: number | null
    currency: string | null
    compensationPeriod: string
  }
}

export interface ScreeningPlanStep {
  key: PipelineStepKey
  questionCount: number | null
  minutes: number
}

export interface TalentApplicationRow {
  id: string
  createdAt: string
  candidateStatus: CandidateStatus
  group: ApplicationGroup
  job: {
    id: string
    role?: { name: string } | null
    organization?: { name: string } | null
    workMode?: string[]
    locationCity?: string | null
    locationState?: string | null
    locationCountry?: string | null
  }
}

export interface TalentApplications {
  applications: TalentApplicationRow[]
  total: number
  counts: Record<'all' | ApplicationGroup, number>
}
