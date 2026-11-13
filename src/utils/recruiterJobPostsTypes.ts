import type { GradedAnswer } from '@/pages/RecruiterProfile/MyJobPosts/CompanyTestResults'
// Job payloads carry only these three recruiter fields — the public job
// endpoints scrub the rest of the User relation before it leaves the API.
type JobPostedBy = {
  id: string
  firstName: string
  lastName: string
}

type JobOrganizationSummary = {
  id: string
  name: string
  logoUrl?: string | null
}

export type JobPostStatus =
  | 'draft'
  | 'pending_payment'
  | 'active'
  | 'suspended'
  | 'closed'

export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'internship'

export type RecruiterJob = {
  id: string
  role: { id: string; name: string }
  organization?: JobOrganizationSummary | null
  postedBy?: JobPostedBy | null
  jobBrief: string
  requirements?: string | null
  minSalary: number
  maxSalary?: number | null
  currency?: string | null
  compensationPeriod?: string | null
  experienceLevel: string
  workMode: string[]
  locationCountry?: string | null
  locationState?: string | null
  locationCity?: string | null
  skills?: string[] | null
  goals?: string[] | null
  department?: string | null
  employmentType?: EmploymentType
  closesAt?: string | null
  shareOptions?: boolean
  noOfApplicants?: number
  aiConfigId?: string | null
  status: JobPostStatus
  createdAt: string
  updatedAt: string
}

export type RecruiterJobCounts = {
  all: number
  active: number
  draft: number
  closed: number
}

export type RecruiterJobsData = {
  jobs: RecruiterJob[]
  total: number
  counts: RecruiterJobCounts
  states: string[]
}

export type SingleJobDetails = {
  id: string
  jobId: string
  talent: {
    id: string
    email: string
    firstName: string
    lastName: string
    bio?: string | null
    experience?: string | null
    cvFileName?: string | null
    cvUrl?: string | null
    cvUploadedAt?: string | null
    prescreeningScore?: number | null
    locationCity?: string | null
    locationState?: string | null
    locationCountry?: string | null
  }
  applicationType: string
  status: string
  currentStage?: string
  createdAt: string
  updatedAt: string
  cvSimilarityScore: number
  personalizedScore?: number | null
  rank?: number | null
  averageScore?: number | null
  /** The AI's overall fit score (0-100) — what the AI Match column/ring should show. Distinct from cvSimilarityScore/averageScore, which are earlier-stage pipeline scores. */
  overallFitScore?: number | null
  matchVerdict?: 'high' | 'medium' | 'low' | null
  matchVerdictStatus?: 'pending' | 'succeeded' | 'failed' | null
  matchVerdictReasoning?: string | null
  matchRecommendation?: 'hire' | 'interview_further' | 'no_hire' | null
  matchStrengths?: string[] | null
  matchWeaknesses?: string[] | null
  matchRisks?: string[] | null
  matchAnalysis?: {
    overallFitScore?: number
    whyFit?: string
    whyHire?: string
    strongestQualifications?: string[]
    relevantExperience?: string[]
    prescreeningInsights?: { strengths?: string[]; weaknesses?: string[] }
    assessmentInsights?: string
    missingRequirements?: string[]
    conflictingRequirements?: string[]
    keyEvidence?: string[]
    hiringRationale?: string
    questionFeedback?: Array<{
      question: string
      whatTheyAnswered?: string
      whatItDemonstrates?: string
      experienceLink?: string
    }>
  } | null
  mbtiType?: string | null
  stages?: Record<string, string> | null
  personalityAnswers?: Array<{
    question: string
    answer: string
    dichotomy?: string
  }> | null
  personalizedAnswers?: Array<{
    question: string
    answer: string
  }> | null
  // Day 5: problem-solving / culture-fit results (company only)
  problemSolvingScore?: number | null
  cultureFitScore?: number | null
  /** Day 6: the AI's 0-100 view of how the personality type fits the job. */
  personalityFitScore?: number | null
  personalityFitReason?: string | null
  personalityFitPending?: boolean
  problemSolvingAnswers?: GradedAnswer[] | null
  cultureFitAnswers?: GradedAnswer[] | null
  /** Lower-cased link source, e.g. linkedin or whatsapp; null for a direct apply. */
  source?: string | null
  stage?: ProgressStage
  boardColumn?: BoardColumn | null
  interview?: { id: string | null; status: InterviewProgress } | null
  /** Company only, on the single application. */
  nextStep?: NextStep
}

/** The single application as the company reads it: the interview comes in full. */
export type ApplicationDetail = Omit<SingleJobDetails, 'interview'> & {
  interview?: RecruiterInterview | null
}

export type BoardColumn =
  | 'applied'
  | 'cv_matched'
  | 'pre_screened'
  | 'personality_test'
  | 'shortlisted'

export type ProgressStage =
  | 'applied'
  | 'cv_matched'
  | 'pre_screened'
  | 'personality_test'
  | 'interview'

export type InterviewProgress =
  | 'not_started'
  | 'in_progress'
  | 'processing'
  | 'ready'

export type NextStep = 'ai_interview' | 'shortlisted'

export interface InterviewScore {
  score: number
  reason: string
}

export interface RecruiterInterview {
  id: string
  mode: 'audio' | 'audio_video'
  status: InterviewProgress
  invitedAt: string | null
  startedAt: string | null
  scoringStatus: 'pending' | 'completed' | 'failed' | null
  scores: {
    clearSpeaking: InterviewScore
    fitForRole: InterviewScore
    confidence: InterviewScore
  } | null
  summary: string | null
  flags: { text: string; question: number | null }[] | null
  scoredAt: string | null
  questions: {
    id: string
    position: number
    isFollowUp: boolean
    question: string
    recorded: boolean
    recordedAt: string | null
    durationSeconds: number | null
    transcriptStatus: 'pending' | 'completed' | 'failed' | null
    transcript: string | null
  }[]
}

export interface JobSummary {
  applicants: { total: number; thisWeek: number }
  passRate: {
    value: number | null
    passed: number
    preScreened: number
    deltaVsLastPost: number | null
  }
  avgCvMatch: { value: number | null; deltaThisWeek: number | null }
  shortlisted: { count: number; pctOfApplicants: number }
  pipeline: {
    applied: number
    cvMatched: number
    preScreened: number
    personalityTest: number
    interview: number
  }
  topSkills: { skill: string; pct: number }[]
  recentActivity: {
    type:
      | 'posted'
      | 'matched'
      | 'shortlisted'
      | 'rejected'
      | 'interview_invited'
      | 'interview_finished'
    title: string
    at: string
  }[]
  hiringTeam: { userId: string; name: string; role: string; isOwner: boolean }[]
  keyDates: {
    postedAt: string
    postedBy: string | null
    closesAt: string | null
    interviewsStartAt: string | null
  }
}
