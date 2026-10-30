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
}

export interface StaffListQuery {
  search: string
  status: StaffStatus | ''
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
  pdfBase64: string
}
