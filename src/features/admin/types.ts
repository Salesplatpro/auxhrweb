export interface CandidateRole {
  id: string
  name: string
}

export interface AdminRole {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminRolePayload {
  name: string
  description?: string
}

export type OnboardingStage =
  | 'verify_email'
  | 'complete_profile'
  | 'take_assessment'
  | 'apply_to_job'
  | 'create_company'
  | 'post_job'
  | 'set_up_screening'
  | 'publish_job'
  | 'active'

export type FollowUpStatus = 'none' | 'emailed' | 'progressed'

export interface OnboardingSummary {
  stage: OnboardingStage
  emailsSent: number
  lastEmailAt: string | null
  followUp: FollowUpStatus
}

export interface OnboardingEmailRecord {
  id: string
  userId: string
  sentById: string | null
  stage: OnboardingStage
  subject: string
  body: string
  status: 'sent' | 'failed'
  error: string | null
  source?: 'admin' | 'auto'
  createdAt: string
}

export interface UserOnboarding {
  userId: string
  role: 'talent' | 'recruiter'
  stage: OnboardingStage
  steps: { key: string; label: string; done: boolean }[]
  nextSteps: { steps: string[]; ctaLabel: string; ctaPath: string } | null
  followUp: FollowUpStatus
  emails: OnboardingEmailRecord[]
}

export interface OnboardingFilters {
  onboardingStage?: OnboardingStage | ''
  followUp?: FollowUpStatus | ''
}

export interface AdminTalent {
  id: string
  firstName: string
  lastName: string
  email: string
  experience: string | null
  prescreeningScore: number | null
  cvFileName?: string | null
  cvUrl?: string | null
  cvUploadedAt?: string | null
  locationCountry?: string | null
  createdAt: string
  userRoles: CandidateRole[]
  onboarding?: OnboardingSummary | null
}

export interface AdminTalentProfile extends AdminTalent {
  bio?: string | null
  locationCity?: string | null
  locationState?: string | null
  hasEmbedding: boolean
}

export interface AdminTalentFilters extends OnboardingFilters {
  search?: string
  experience?: string
  roleId?: string
  limit?: number
  offset?: number
  sort?: 'asc' | 'desc'
}

export interface AdminJob {
  id: string
  jobBrief: string
  status: string
  experienceLevel: string
  locationCountry: string
  minSalary: number
  maxSalary: number | null
  createdAt: string
  role?: { id: string; name: string } | null
  organization?: {
    id: string
    name: string
    logoUrl?: string | null
  } | null
  postedBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

export interface AdminJobFilters {
  search?: string
  status?: string
  roleId?: string
  organizationId?: string
  limit?: number
  offset?: number
  sort?: 'asc' | 'desc'
}

export interface AdminRecruiter {
  id: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
  onboarding?: OnboardingSummary | null
}

export interface AdminRecruiterFilters extends OnboardingFilters {
  search?: string
  limit?: number
  offset?: number
  sort?: 'asc' | 'desc'
}

export interface AdminOrganization {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  industry?: string | null
  website?: string | null
  facebook?: string | null
  linkedin?: string | null
  twitter?: string | null
  status: 'pending' | 'verified' | 'rejected'
  verifiedAt?: string | null
  createdAt: string
  owner?: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  ownershipTransfers?: {
    id: string
    fromName: string
    toName: string
    reason: string
    createdAt: string
  }[]
  activeSubscription?: {
    planName: string | null
    nextPaymentDate: string | null
  } | null
  members?: {
    id: string
    userId: string
    organizationId: string
    workEmail: string
    role: string
    createdAt: string
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }[]
}

export interface AdminOrganizationFilters {
  search?: string
  status?: string
  limit?: number
  offset?: number
  sort?: 'asc' | 'desc'
}

export type ScreeningStage =
  | 'personality'
  | 'personalized'
  | 'prescreening'
  | 'cv_similarity'
  | 'completed'

export type ApplicationFollowUpStatus = 'none' | 'emailed' | 'progressed'

export interface StuckApplicationSummary {
  applicationId: string
  talent: { id: string; firstName: string; lastName: string; email: string }
  job: { id: string; title: string }
  company: { id: string; name: string } | null
  stage: ScreeningStage
  daysStuck: number
  emailsSent: number
  lastEmailAt: string | null
  followUp: ApplicationFollowUpStatus
}

export interface ApplicationFollowUpEmailRecord {
  id: string
  applicationId: string
  sentById: string | null
  step: number
  stage: ScreeningStage
  subject: string
  body: string
  status: 'sent' | 'failed'
  error: string | null
  source?: 'admin' | 'auto'
  createdAt: string
}

export interface ApplicationFollowUpStep {
  key: ScreeningStage
  label: string
  done: boolean
  current: boolean
}

export interface ApplicationFollowUp {
  applicationId: string
  talentName: string
  jobTitle: string
  companyName: string | null
  stage: ScreeningStage
  stuck: boolean
  daysStuck: number
  steps: ApplicationFollowUpStep[]
  nextSteps: { steps: string[]; ctaLabel: string } | null
  followUp: ApplicationFollowUpStatus
  emails: ApplicationFollowUpEmailRecord[]
}

export interface ApplicationFollowUpFilters {
  stuckStage?: ScreeningStage | ''
  followUp?: ApplicationFollowUpStatus | ''
}

export interface StuckApplicationsQuery extends ApplicationFollowUpFilters {
  search?: string
  limit?: number
  offset?: number
  sort?: 'asc' | 'desc'
}

export interface AdminFeedback {
  id: string
  subject: string | null
  message: string
  isRead: boolean
  createdAt: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

export interface AdminFeedbackFilters {
  isRead?: boolean
  limit?: number
  skip?: number
}

export type OverviewRange = 7 | 30 | 90

export interface OverviewPeriodTotals {
  total: number
  new: number
  previous: number
}

export interface OverviewBucket {
  key: string
  count: number
}

export interface AdminOverview {
  range: { days: OverviewRange; from: string; to: string }
  kpis: {
    talents: OverviewPeriodTotals
    recruiters: OverviewPeriodTotals
    organizations: {
      total: number
      pending: number
      verified: number
      rejected: number
    }
    jobs: { total: number; active: number }
    applications: OverviewPeriodTotals
    stuckApplications: number
    unreadFeedback: number
    unresolvedErrors: number
    revenue: { total: number; inRange: number; previous: number }
  }
  series: {
    signups: Array<{ date: string; talents: number; recruiters: number }>
    applications: Array<{ date: string; count: number }>
    revenue: Array<{ date: string; amount: number }>
  }
  breakdowns: {
    applicationsByStatus: OverviewBucket[]
    jobsByStatus: OverviewBucket[]
    organizationsByPlan: OverviewBucket[]
    talentOnboarding: OverviewBucket[]
    recruiterOnboarding: OverviewBucket[]
    stuckByStage: OverviewBucket[]
    scoutRunsByStatus: OverviewBucket[]
  }
}

export interface AiChoice {
  provider: string
  model: string
}

export interface AiModelOption {
  provider: string
  model: string
  label: string
  retiresOn: string | null
  replacement: string | null
}

export interface AiFeature {
  key: string
  name: string
  description: string
  group: string
  lockedReason: string | null
  current: AiChoice
  usingDefault: boolean
  notice: string | null
  updatedAt: string | null
  updatedByName: string | null
  options: AiModelOption[]
  promptParts: number
  editedPromptParts: number
}

export interface AiProviderSummary {
  key: string
  name: string
  envKey: string
  configured: boolean
  docsUrl: string
}

export interface AiModelsOverview {
  verifiedOn: string
  providers: AiProviderSummary[]
  features: AiFeature[]
}

export interface AiPromptPart {
  key: string
  label: string
  text: string
  defaultText: string
  edited: boolean
  problem: string | null
  variables: Array<{ name: string; description: string }>
}
