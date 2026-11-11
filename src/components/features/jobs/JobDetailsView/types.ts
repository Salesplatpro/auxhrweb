import type { JobOrganization } from '@/components/features/jobs/CompanyTag'

export type JobDetailsAudience = 'public' | 'talent' | 'recruiter' | 'admin'

export interface JobDetailsJob {
  role?: { name: string }
  createdAt?: string
  jobBrief?: string
  requirements?: string
  skills?: string[] | null
  goals?: string[] | null
  workMode?: string[] | null
  locationCountry?: string | null
  locationState?: string | null
  locationCity?: string | null
  experienceLevel?: string
  currency?: string | null
  minSalary?: number | null
  maxSalary?: number | null
  compensationPeriod?: string | null
  department?: string | null
  employmentType?: string | null
  closesAt?: string | null
  shareOptions?: boolean | null
  noOfApplicants?: number
  postedBy?: { firstName?: string; lastName?: string } | null
  organization?: JobOrganization | null
  status?: string
  hasApplied?: boolean
  applicationStage?: string | null
  applicationId?: string | null
  applicationStages?: Record<string, string> | null
  aiConfigId?: string | null
  aiConfig?: { id?: string } | null
}
