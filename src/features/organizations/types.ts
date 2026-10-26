export type OrganizationStatus = 'pending' | 'verified' | 'rejected'

export type OrganizationJoinRequestStatus = 'pending' | 'approved' | 'rejected'

export type OrganizationBillingStatus = 'active' | 'past_due' | 'cancelled'

export interface Organization {
  id: string
  ownerId: string
  name: string
  domain?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  industry?: string | null
  website?: string | null
  facebook?: string | null
  linkedin?: string | null
  twitter?: string | null
  logoUrl?: string | null
  status: OrganizationStatus
  /** Company-wide plan key — source of truth after org-scoped billing. */
  billingPlan?: string | null
  billingInterval?: 'monthly' | 'annually' | null
  billingStatus?: OrganizationBillingStatus | null
  /** ISO timestamp when the current paid period ends; null on pay_per_use. */
  billingPeriodEnd?: string | null
  verifiedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface UsageMeter {
  key: string
  label: string
  used: number
  limit: number | null
  period: 'concurrent' | 'monthly'
}

/** Live entitlement snapshot for the active company, derived from its current plan. */
export interface OrganizationUsage {
  billingPlan: string
  billingInterval: 'monthly' | 'annually' | null
  billingStatus: OrganizationBillingStatus
  billingPeriodEnd: string | null
  meters: UsageMeter[]
  flags: Array<{ key: string; label: string; included: boolean }>
}

export interface OrganizationUsageApiResponse {
  status: boolean
  message: string
  data: { usage: OrganizationUsage }
}

export interface OrganizationJoinRequest {
  id: string
  userId: string
  organizationId: string
  workEmail: string
  status: OrganizationJoinRequestStatus
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface CreateOrganizationPayload {
  name: string
  domain?: string
  email: string
  phone?: string
  address?: string
  industry?: string
  website?: string
  facebook?: string
  linkedin: string
  twitter?: string
}

/**
 * Email and website are immutable after creation, so they are absent here.
 * logoUrl is also absent — it's read-only, set only via the logo upload/remove
 * endpoints, never as a client-supplied string.
 */
export interface UpdateOrganizationPayload {
  name?: string
  phone?: string
  address?: string
  industry?: string
  facebook?: string
  linkedin?: string
  twitter?: string
}

export interface OrganizationsApiResponse {
  status: boolean
  message: string
  data: { organizations: Organization[] }
}

export interface OrganizationApiResponse {
  status: boolean
  message: string
  data: { organization: Organization }
}

export interface JoinRequestsApiResponse {
  status: boolean
  message: string
  data: { joinRequests: OrganizationJoinRequest[] }
}

export interface JoinOrganizationRequestPayload {
  workEmail: string
}

export type OrganizationInviteStatus =
  | 'pending'
  | 'accepted'
  | 'revoked'
  | 'expired'

export interface OrganizationInvite {
  id: string
  organizationId: string
  email: string
  status: OrganizationInviteStatus
  expiresAt: string
  createdAt: string
}

export interface OrganizationInvitePreview {
  organizationName: string
  invitedEmail: string
  status: OrganizationInviteStatus
  expiresAt: string
  inviteeExists: boolean
}

export interface OrganizationMember {
  id: string
  userId: string
  organizationId: string
  workEmail: string
  role: string
  canManagePeople: boolean
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface MembersApiResponse {
  status: boolean
  message: string
  data: { members: OrganizationMember[] }
}

export interface SendOrganizationInvitePayload {
  email: string
}

export interface InvitesApiResponse {
  status: boolean
  message: string
  data: { invites: OrganizationInvite[] }
}

export interface InviteApiResponse {
  status: boolean
  message: string
  data: { invite: OrganizationInvite }
}

export interface InvitePreviewApiResponse {
  status: boolean
  message: string
  data: { invite: OrganizationInvitePreview }
}
