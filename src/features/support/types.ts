export type SupportTopic =
  | 'account'
  | 'billing'
  | 'jobs'
  | 'applications'
  | 'bug'
  | 'idea'
  | 'other'

export type SupportStatus = 'unread' | 'read' | 'unreplied' | 'replied'

export type AiDraftStatus = 'pending' | 'drafted' | 'complex' | 'failed'

export type ReplyEmailStatus = 'pending' | 'sent' | 'failed'

/** One request as the person who sent it sees it. */
export interface MySupportRequest {
  id: string
  topic: SupportTopic | null
  subject: string | null
  message: string
  createdAt: string
  seen: boolean
  reply: string | null
  repliedAt: string | null
}

export interface SupportUserSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  userRole: 'talent' | 'recruiter' | 'admin'
  profileImageUrl: string | null
}

export interface SupportInboxRow {
  id: string
  topic: SupportTopic | null
  subject: string | null
  preview: string
  status: SupportStatus
  isRead: boolean
  hasDraft: boolean
  aiDraftStatus: AiDraftStatus | null
  replyEmailStatus: ReplyEmailStatus | null
  createdAt: string
  repliedAt: string | null
  user: SupportUserSummary
}

export type SupportCounts = Record<SupportStatus, number>

export interface SupportInbox {
  feedback: SupportInboxRow[]
  total: number
  counts: SupportCounts
}

export interface SupportInboxFilters {
  status?: SupportStatus
  topic?: SupportTopic
  search?: string
  sortBy?: 'status' | 'createdAt'
  sort?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface SupportRequest {
  id: string
  userId: string
  topic: SupportTopic | null
  subject: string | null
  message: string
  status: SupportStatus
  isRead: boolean
  createdAt: string
  reply: string | null
  repliedAt: string | null
  replyEmailStatus: ReplyEmailStatus | null
  replyEmailError: string | null
  draftReply: string | null
  draftUpdatedAt: string | null
  aiDraft: string | null
  aiNote: string | null
  aiDraftStatus: AiDraftStatus | null
  aiDraftAttempts: number
  aiDraftLastError: string | null
  aiDraftBusy: boolean
}

export type SupportRequestWithUser = SupportRequest & {
  user: SupportUserSummary
}

export interface SupportRequestDetail {
  request: SupportRequestWithUser
  history: SupportRequest[]
}

export interface SupportUserContext {
  account: {
    firstName: string
    lastName: string
    email: string
    role: 'talent' | 'recruiter' | 'admin'
    country: string | null
    signedUpAt: string
    daysSinceSignup: number
    emailVerified: boolean
    active: boolean
  }
  onboarding: {
    stage: string
    steps: Array<{ label: string; done: boolean }>
    nextSteps: string[]
  } | null
  talent: {
    profileCompletion: number
    roles: string[]
    cvUploaded: boolean
    cvUploadedAt: string | null
    prescreeningScore: number | null
    assessmentRetryDate: string | null
    applicationsByStatus: Record<string, number>
    stuckApplications: Array<{
      job: string
      company: string | null
      stage: string
      daysStuck: number
    }>
  } | null
  recruiter: {
    organization: {
      id: string
      name: string
      status: string
      memberRole: string | null
      teamSize: number
      pendingInvites: number
    } | null
    plan: {
      billingPlan: string
      billingStatus: string
      billingPeriodEnd: string | null
      meters: Array<{
        label: string
        used: number
        limit: number | null
        period: string
      }>
    } | null
    jobsByStatus: Record<string, number>
    totalApplicants: number
  } | null
  recentErrors: Array<{
    at: string
    errorType: string
    method: string | null
    endpoint: string | null
    message: string
  }> | null
}
