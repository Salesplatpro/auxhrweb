import type { GradedAnswer } from '@/pages/RecruiterProfile/MyJobPosts/CompanyTestResults'
type JobLocation = {
  city: string
  state: string
  country: string
}

type JobRole = {
  id: string
  name: string
  description: string
}

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

export type recruiterJobPostsTypes = {
  location: JobLocation
  id: string
  role: JobRole
  postedBy: JobPostedBy
  organization?: JobOrganizationSummary | null
  description: string
  maxSalary?: number | null
  minSalary: number
  compensationPeriod?: string
  experienceLevel: string
  address: string
  remote: boolean
  responsibilities: string[]
  skills: string[]
  goals: string[]
  noOfApplicants: number
  createdAt: string
  updatedAt: string
  __v: number
  aiConfig: string
  aiConfigId?: string | null
  status?: string
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
  problemSolvingAnswers?: GradedAnswer[] | null
  cultureFitAnswers?: GradedAnswer[] | null
}

export interface JobProfileProps {
  id?: string
  role?: {
    id: string
    name: string
  }
  title?: string
  postedBy?: {
    firstName?: string
    lastName?: string
  }
  requirements?: string
  jobBrief?: string
  workMode?: string[]
  skills?: string[]
  goals?: string[]
  locationCountry?: string
  locationState?: string | null
  locationCity?: string | null
  experienceLevel?: string
  currency?: string
  noOfApplicants?: number
}

export interface EditJobType extends JobProfileProps {
  aiConfig: string
  maxSalary?: number | null
  minSalary?: number
  compensationPeriod?: string
  status?: JobStatus
}

export type JobStatus = 'draft' | 'active' | 'suspended' | 'closed'

export interface JobAiConfig {
  name: string
  recruiter: string
  cvSimilarity: boolean
  minCvSimilarityScore: number
  minPrescreeningScore: number
  noPersonalizedQuestions: number
  personalityEvaluation: boolean
  noOfEIQuestions: number
  noOfSNQuestions: number
  noOfTFQuestions: number
  noOfJPQuestions: number
  personalizedAssessment: boolean
  prescreeningAssessment: boolean
  uploadedQuestions: string[]
  recruiterGuide?: string
  stages: {
    cv_similarity: string
    personality: string
    personalized: string
    prescreening: string
  }
}
