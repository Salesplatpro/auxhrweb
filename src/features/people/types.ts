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

export interface StaffActivity {
  id: string
  type: StaffActivityType
  actorId: string | null
  actorName: string
  meta: {
    changes?: Record<string, [unknown, unknown]>
    endDate?: string
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
