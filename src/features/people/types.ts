export type StaffStatus = 'invited' | 'active' | 'ended'

export type StaffInviteState = 'none' | 'pending' | 'expired' | 'accepted'

export interface StaffInvite {
  state: StaffInviteState
  invitedByName: string | null
  invitedAt: string | null
  expiresAt: string | null
  joinedAt: string | null
}

export interface StaffMember {
  id: string
  fullName: string
  email: string
  jobTitle: string
  department: string | null
  managerId: string | null
  managerName: string | null
  startDate: string
  endDate: string | null
  status: StaffStatus
  hiredThroughAuxhr: boolean
  isExecutive: boolean
  hasAccount: boolean
  invite: StaffInvite
  createdAt: string
}

export interface PeopleAccess {
  isOwner: boolean
  canManagePeople: boolean
  /** How many current employees this person has been assigned to track. */
  assignedCount: number
}

export interface HrAssignee {
  userId: string
  fullName: string
  email: string
}

export interface StaffListQuery {
  search: string
  status: StaffStatus | ''
  assignedToMe?: 'true'
  limit: number
  offset: number
}

export interface StaffListData {
  items: StaffMember[]
  total: number
  counts: Record<StaffStatus, number>
}

export interface StaffOption {
  id: string
  fullName: string
  jobTitle: string
  status: StaffStatus
}

export type StaffActivityType =
  | 'created'
  | 'invited'
  | 'invite_resent'
  | 'invite_failed'
  | 'invite_opened'
  | 'joined'
  | 'updated'
  | 'ended'
  | 'pay_set'
  | 'share_grant_added'
  | 'share_grant_removed'
  | 'document_sent'
  | 'document_email_failed'
  | 'document_viewed'
  | 'document_signed'
  | 'document_copy_failed'
  | 'document_notarized'
  | 'job_description_saved'
  | 'goal_added'
  | 'goals_suggested'
  | 'goal_changed'
  | 'goal_approved'
  | 'goal_removed'
  | 'goal_progress_updated'
  | 'weekly_report_submitted'
  | 'report_note_added'
  | 'development_item_added'
  | 'development_item_removed'
  | 'feedback_saved'
  | 'completion_requested'
  | 'completion_approved'
  | 'completion_returned'
  | 'completion_reopened'
  | 'hr_assigned'
  | 'hr_removed'

export interface StaffActivity {
  id: string
  type: StaffActivityType
  actorId: string | null
  actorName: string
  meta: {
    changes?: Record<string, [unknown, unknown]>
    endDate?: string
    startsOn?: string
    shares?: number
    title?: string
    resent?: boolean
    progress?: number
    weekStart?: string
    hrName?: string
  } | null
  createdAt: string
}

export interface AccessLogEntry {
  id: string
  createdAt: string
  actorId: string | null
  actorName: string
  staffId: string | null
  staffName: string
  resource: string
  description: string
  ip: string | null
}

export interface AccessLogQuery {
  staffId: string
  actorId: string
  from: string
  to: string
  limit: number
  offset: number
}

export interface AccessLogData {
  items: AccessLogEntry[]
  total: number
}

export interface StaffFormValues {
  fullName: string
  email: string
  jobTitle: string
  department: string
  managerId: string
  startDate: string
  isExecutive: boolean
  sendInvite: boolean
}

export interface CreateStaffPayload {
  fullName: string
  email: string
  jobTitle: string
  department?: string
  managerId?: string | null
  startDate: string
  isExecutive: boolean
  sendInvite: boolean
}

export interface UpdateStaffPayload {
  fullName?: string
  jobTitle?: string
  department?: string | null
  managerId?: string | null
  startDate?: string
  isExecutive?: boolean
}

export interface CreateStaffResult {
  staff: StaffMember
  inviteEmailSent: boolean | null
}

export interface InviteStaffResult {
  staff: StaffMember
  inviteEmailSent: boolean
}

export type StaffInvitePreview =
  | { status: 'expired' | 'accepted' }
  | {
      status: 'pending'
      organizationName: string
      organizationLogoUrl: string | null
      jobTitle: string
      invitedEmail: string
      invitedByName: string | null
      expiresAt: string | null
      inviteeExists: boolean
    }

export interface JoinedStaff {
  organizationName: string
  jobTitle: string
  joinedAt: string
}

export interface Envelope<T> {
  status: boolean
  message: string
  data: T
}

export type PayCurrency = 'NGN' | 'USD'

export type PayPeriod = 'monthly' | 'yearly'

export interface Benefit {
  id: string
  name: string
  description: string | null
}

export interface BenefitPayload {
  name: string
  description: string | null
}

export interface PayTerms {
  currency: PayCurrency
  period: PayPeriod
  baseSalary: number
  bonus: number
  commissionTarget: number
  startsOn: string
}

export interface PayPackagePayload extends PayTerms {
  benefitIds: string[]
  commissionPlanId: string | null
}

export interface PayPackage extends PayTerms {
  id: string
  commissionPlanId: string | null
  benefits: { id: string; name: string }[]
  paragraph: string
  createdAt: string
}

export interface ShareGrantPayload {
  shares: number
  grantedOn: string
  cliffMonths: number
  vestingMonths: number
  strikePrice: number
  currency: PayCurrency
}

export interface ShareGrant extends ShareGrantPayload {
  id: string
}

export interface PayData {
  currentPackageId: string | null
  packages: PayPackage[]
  grants: ShareGrant[]
}

export interface CommissionTier {
  fromPercent: number
  toPercent: number | null
  ratePercent: number
  boost: number | null
}

export interface CommissionPlanPayload {
  name: string
  tiers: CommissionTier[]
}

export interface CommissionPlan extends CommissionPlanPayload {
  id: string
}

export interface HeadcountCostRow {
  currency: PayCurrency
  department: string | null
  staffCount: number
  baseSalary: number
  bonus: number
  commissionTarget: number
  total: number
}

export interface HeadcountCost {
  totals: HeadcountCostRow[]
  departments: HeadcountCostRow[]
}

export type DocumentTemplate =
  | 'offer_letter'
  | 'nda'
  | 'work_ownership'
  | 'pay_agreement'

export interface StaffDocument {
  id: string
  template: DocumentTemplate
  title: string
  status: 'sent' | 'signed'
  sentAt: string
  openedAt: string | null
  signedAt: string | null
  signerName: string | null
  linkExpiresAt: string | null
  needsNotarization: boolean
  notarizedAt: string | null
  checkCode: string | null
  copyStatus: 'none' | 'pending' | 'failed' | 'done'
}

export interface DocumentCheck {
  result: 'verified' | 'changed' | 'limited'
  companyName: string
  title: string
  signerName: string | null
  signedAt: string | null
}

export interface DocumentPreview {
  title: string
  body: string
  missing: string[]
}

export interface SendDocumentResult {
  document: StaffDocument
  emailSent: boolean
}

export interface SigningDocument {
  companyName: string
  companyLogoUrl: string | null
  employeeName: string
  title: string
  body: string
}

export interface SignedCopy {
  fileName: string
  pdfBase64: string | null
  copyPending: boolean
}

export interface ChecklistItem {
  title: string
  dueInDays: number
}

export interface ChecklistTask {
  id: string
  title: string
  dueOn: string | null
  doneAt: string | null
  completedByName?: string | null
}

export interface CompletionRequest {
  id: string
  itemType: 'goal' | 'task'
  itemId: string
  itemTitle: string
  summary: string
  links: string[]
  files: Array<{ id: string; name: string; mimeType: string; size: number }>
  status: 'pending' | 'approved' | 'returned' | 'withdrawn'
  reviewNote: string | null
  reviewedByName: string | null
  reviewedAt: string | null
  createdAt: string
}

export interface CompletionReviewResult {
  goal: Goal | null
  task: ChecklistTask | null
  request: CompletionRequest | null
}

export interface MyWorkRecord {
  staffId: string
  companyName: string
  companyLogoUrl: string | null
  jobTitle: string
  managerName: string | null
  startDate: string
  documentsToSign: { id: string; title: string; sentAt: string }[]
  signedDocuments: { id: string; title: string; signedAt: string | null }[]
  hasTeam: boolean
  tasks: ChecklistTask[]
  completionRequests: CompletionRequest[]
}

export interface ImportStaffRow {
  fullName: string
  email: string
  jobTitle: string
  department: string
  managerEmail: string
  startDate: string
}

export interface ImportRowResult {
  row: number
  fullName: string
  email: string
  error: string | null
}

export interface ImportCommitResult {
  added: number
  skipped: ImportRowResult[]
}

export interface StaffExportRow {
  fullName: string
  email: string
  jobTitle: string
  department: string | null
  managerEmail: string | null
  startDate: string
  status: StaffStatus
  hiredThroughAuxhr: boolean
}

export interface CompanyProfile {
  mission: string | null
  vision: string | null
  yearlyGoals: string[]
}

export interface JobDescription {
  body: string
  version: number
  updatedByName: string
  updatedAt: string
}

export interface GoalPayload {
  title: string
  keyResults: string[]
  target: string | null
  dueOn: string
}

export interface Goal extends GoalPayload {
  id: string
  progress: number
  status: 'draft' | 'approved'
  source: 'manual' | 'ai'
  version: number
  approvedByName: string | null
  approvedAt: string | null
  completedAt: string | null
  completedByName: string | null
}

export interface WeeklyReportText {
  did: string
  blocked: string
  nextWeek: string
}

export interface WeeklyReport extends WeeklyReportText {
  id: string
  weekStart: string
  textVersion: number
  submittedAt: string
  managerNote: string | null
  managerNoteByName: string | null
  managerNoteAt: string | null
  noteVersion: number
  advice: string[] | null
  adviceAt: string | null
}

export interface DevelopmentPayload {
  weakArea: string
  action: string
  dueOn: string | null
}

export interface DevelopmentItem extends DevelopmentPayload {
  id: string
  status: 'proposed' | 'open' | 'done'
  source: 'manual' | 'ai' | 'skill_test'
  version: number
}

export interface MonthlyFeedback {
  id: string
  month: string
  rating: number
  notes: string
  byName: string
  version: number
  updatedAt: string
}

export interface Efficiency {
  quarter: string
  score: number | null
  partial: boolean
  parts: {
    key: 'goals' | 'reports' | 'rating'
    weight: number
    value: number | null
  }[]
}

export interface EfficiencyTip {
  tip: string
  current: boolean
}

export interface Performance {
  staffId: string
  isExecutive: boolean
  jobDescription: JobDescription | null
  goals: Goal[]
  reports: { items: WeeklyReport[]; total: number }
  development: DevelopmentItem[]
  feedback: MonthlyFeedback[]
}

export interface ManagedPerformance extends Performance {
  completionRequests: CompletionRequest[]
  efficiency: Efficiency
  efficiencyTip: EfficiencyTip | null
}

export interface MyPerformance extends Performance {
  currentWeek: string
  completionRequests: CompletionRequest[]
}

export interface TeamMember {
  staffId: string
  fullName: string
  jobTitle: string
  reportId: string | null
  goalsWaiting: number
}

export interface MyTeamData {
  weekStart: string
  members: TeamMember[]
}

export interface OrgChartPerson {
  id: string
  fullName: string
  jobTitle: string
  department: string | null
  managerId: string | null
  managerLeft: boolean
}

export interface OrgChartData {
  people: OrgChartPerson[]
  truncated: boolean
}

export type Capacity = 'not_enough_data' | 'low' | 'medium' | 'high'

export interface QuarterGoal {
  quarter: string
  currency: string
  revenueGoal: number
  revenueSoFar: number
  version: number
  updatedByName: string
  updatedAt: string
}

export interface QuarterGoalPayload {
  quarter: string
  currency: string
  revenueGoal: number
  revenueSoFar: number
  version: number | null
}

export interface QuarterlyReviewPerson {
  staffId: string
  fullName: string
  jobTitle: string
  department: string | null
  goalProgress: number | null
  score: number | null
  partial: boolean
  capacity: Capacity
}

export interface QuarterlyReviewData {
  quarter: string
  goal: QuarterGoal | null
  revenuePercent: number | null
  teamProgress: number | null
  people: QuarterlyReviewPerson[]
  truncated: boolean
}
