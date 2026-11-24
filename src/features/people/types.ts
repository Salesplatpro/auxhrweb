export type StaffStatus = 'invited' | 'active' | 'ended'

export type StaffInviteState = 'none' | 'pending' | 'expired' | 'accepted'

export interface StaffInvite {
  state: StaffInviteState
  invitedByName: string | null
  invitedAt: string | null
  expiresAt: string | null
  joinedAt: string | null
}

export type EndReason =
  | 'resigned'
  | 'dismissed'
  | 'contract_ended'
  | 'redundancy'
  | 'retired'
  | 'mutual_agreement'
  | 'other'

export const END_REASONS: { value: EndReason; label: string }[] = [
  { value: 'resigned', label: 'Resigned' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'contract_ended', label: 'Contract ended' },
  { value: 'redundancy', label: 'Redundancy' },
  { value: 'retired', label: 'Retired' },
  { value: 'mutual_agreement', label: 'Mutual agreement' },
  { value: 'other', label: 'Other' },
]

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
  /** A last working day still ahead; they stay active until it has passed. */
  endingOn: string | null
  endReason: EndReason | null
  status: StaffStatus
  hiredThroughAuxhr: boolean
  isExecutive: boolean
  phone: string | null
  homeAddress: string | null
  hasAccount: boolean
  invite: StaffInvite
  createdAt: string
}

export interface PeopleAccess {
  isOwner: boolean
  canManagePeople: boolean
  /** How many current employees this person has been assigned to track. */
  assignedCount: number
  ownerFirstName: string | null
  /** True for a day after this person asked the owner for access. */
  accessRequested: boolean
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
  hiredThroughAuxhr: number
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
  resource: string
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
  phone: string
  homeAddress: string
  sendInvite: boolean
  applicationId?: string
}

export interface CreateStaffPayload {
  fullName: string
  email: string
  jobTitle: string
  department?: string
  managerId?: string | null
  startDate: string
  isExecutive: boolean
  phone?: string | null
  homeAddress?: string | null
  sendInvite: boolean
}

export interface UpdateStaffPayload {
  fullName?: string
  email?: string
  phone?: string | null
  homeAddress?: string | null
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
  | { status: 'accepted' }
  | {
      status: 'expired'
      organizationName: string
      organizationLogoUrl: string | null
      invitedEmail: string
      invitedAt: string | null
      expiresAt: string | null
      contactEmail: string | null
    }
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

export interface MyStaffInvite {
  id: string
  organizationName: string
  organizationLogoUrl: string | null
  jobTitle: string | null
  invitedByName: string | null
  expiresAt: string | null
}

export interface JoinedStaff {
  organizationName: string
  jobTitle: string
  joinedAt: string
  documentsToSign: number
  openTasks: number
  hasPay: boolean
  hasShareOptions: boolean
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
  givenTo: number
}

export interface BenefitPayload {
  name: string
  description: string | null
}

/** Salary follows the period; bonus and commission target are always per year. */
export interface PayTerms {
  currency: PayCurrency
  period: PayPeriod
  baseSalary: number
  bonus: number
  commissionTarget: number
  startsOn: string
}

export interface PayPackagePayload {
  currency: PayCurrency
  period: PayPeriod
  baseSalary: number
  bonusPerYear: number
  commissionTargetPerYear: number
  startsOn: string
  benefitIds: string[]
  commissionPlanId: string | null
}

export interface PayPackage extends PayTerms {
  id: string
  totalYearly: number
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
  /** Null on grants added before this was recorded. */
  createdByName?: string | null
  createdAt?: string
}

export interface PayData {
  currentPackageId: string | null
  packages: PayPackage[]
  grants: ShareGrant[]
}

export interface CommissionBand {
  fromAmount: number
  toAmount: number | null
  ratePercent: number
}

export type CommissionPaidOn = 'yearly_sales' | 'product_revenue' | 'renewals'

export type CommissionFrequency = 'monthly' | 'quarterly' | 'yearly'

export interface CommissionPlanPayload {
  name: string
  paidOn: CommissionPaidOn
  frequency: CommissionFrequency
  bands: CommissionBand[]
}

export interface CommissionPlan {
  id: string
  name: string
  paidOn: CommissionPaidOn | null
  frequency: CommissionFrequency | null
  bands: CommissionBand[] | null
  /** Plans from before bands existed keep their people but pay nothing until edited. */
  needsBands: boolean
  /** Only the plan list counts people; a freshly saved plan has none yet. */
  peopleCount?: number
  people?: string[]
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

export interface HeadcountPeople {
  count: number
  names: string[]
}

export type HeadcountMonths = 3 | 6 | 12

export interface HeadcountCost {
  totals: HeadcountCostRow[]
  departments: HeadcountCostRow[]
  headcount: number
  invited: HeadcountPeople
  left: HeadcountPeople
  byMonth: { month: string; headcount: number }[]
}

export type DocumentTemplate =
  | 'offer_letter'
  | 'nda'
  | 'work_ownership'
  | 'pay_agreement'

export type DocumentStatus = 'draft' | 'sent' | 'signed' | 'declined'

export type DocumentDisplayStatus = DocumentStatus | 'to_notarize' | 'notarized'

export interface DocumentFields {
  startDate?: string
  jobTitle?: string
  managerName?: string
}

export interface StaffDocument {
  id: string
  template: DocumentTemplate
  title: string
  status: DocumentStatus
  displayStatus: DocumentDisplayStatus
  fields: DocumentFields | null
  createdAt: string
  sentAt: string | null
  openedAt: string | null
  signedAt: string | null
  declinedAt: string | null
  signerName: string | null
  sentByName: string | null
  linkExpiresAt: string | null
  needsNotarization: boolean
  notarizedAt: string | null
  notarizedScanName: string | null
  notarizedByName: string | null
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
  facts: {
    startDate: string
    jobTitle: string
    managerName: string | null
    monthlyPay: string | null
  }
}

export interface DocumentDraft {
  document: StaffDocument
  preview: DocumentPreview
}

export interface SendDocumentResult {
  document: StaffDocument
  emailSent: boolean
}

export interface SigningDocument {
  companyName: string
  companyLogoUrl: string | null
  companyEmail: string | null
  employeeName: string
  title: string
  dateLabel: string
  body: string
  signatory: string | null
}

export interface SignedCopy {
  fileName: string
  pdfBase64: string | null
  copyPending: boolean
}

export type TaskOwner = 'it' | 'new_hire' | 'manager' | 'hr'

export interface ChecklistItem {
  title: string
  dueInDays: number
  description?: string | null
  owner?: TaskOwner | null
}

export type TaskStatus = 'done' | 'late' | 'not_done'

export interface ChecklistTask {
  id: string
  title: string
  description?: string | null
  owner?: TaskOwner | null
  ownerName?: string | null
  status?: TaskStatus
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

export type ReportFrequency = 'daily' | 'weekly' | 'monthly'

export interface GoalPayload {
  title: string
  keyResults: string[]
  target: string | null
  dueOn: string
  /** How often the employee reports on this goal; null means no reports. */
  reportFrequency: ReportFrequency | null
}

export interface GoalReport {
  id: string
  periodStart: string
  frequency: ReportFrequency
  text: string | null
  links: string[]
  files: Array<{ id: string; name: string; mimeType: string; size: number }>
  textVersion: number
  submittedAt: string
  reviewerNote: string | null
  reviewerNoteByName: string | null
  reviewerNoteAt: string | null
  noteVersion: number
}

export interface GoalReportPeriod {
  periodStart: string
  state: 'submitted' | 'missed' | 'open'
  /** A report can still be sent, or changed, for this period. */
  open: boolean
  report: GoalReport | null
}

export interface GoalReportsData {
  goalId: string
  frequency: ReportFrequency | null
  /** Most recent first. */
  periods: GoalReportPeriod[]
  submitted: number
  missed: number
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

export interface ReportWeek {
  weekStart: string
  state: 'submitted' | 'not_yet'
  report: WeeklyReport | null
}

export interface ManagedPerformance extends Performance {
  weeks?: ReportWeek[]
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
  /** Reports to this person, is in a department they head, or both. */
  relation: 'report' | 'department' | 'both'
  departmentName: string | null
  /** Goal reports from the last 30 days that nobody has replied to. */
  goalReportsToRead: number
}

export interface MyTeamData {
  weekStart: string
  members: TeamMember[]
  /** Departments this person heads, including empty ones. */
  departments: Array<{ id: string; name: string }>
}

/** What a department head may see about someone in their department. */
export interface TeamMemberDetails {
  staffId: string
  fullName: string
  jobTitle: string
  department: string | null
  managerName: string | null
  email: string
  phone: string | null
  startDate: string
  status: StaffStatus
  joinedAt: string | null
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
