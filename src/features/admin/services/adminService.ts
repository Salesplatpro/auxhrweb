import { httpClient } from '@/features/auth/services/httpClient'

import {
  AdminFeedback,
  AdminFeedbackFilters,
  AdminJob,
  AdminJobFilters,
  AdminOrganization,
  AdminOrganizationFilters,
  AdminOverview,
  AdminRecruiter,
  AdminRecruiterFilters,
  AdminRole,
  AdminRolePayload,
  AdminTalent,
  AdminTalentFilters,
  AdminTalentProfile,
  AiChoice,
  AiFeature,
  AiModelsOverview,
  AiPromptPart,
  ApplicationFollowUp,
  ApplicationFollowUpEmailRecord,
  OnboardingEmailRecord,
  OverviewRange,
  StuckApplicationsQuery,
  StuckApplicationSummary,
  UserOnboarding,
} from '../types'

interface ApiEnvelope<T> {
  status: boolean
  message: string
  data: T
}

export const fetchAdminOverview = (days: OverviewRange) =>
  httpClient
    .get<ApiEnvelope<AdminOverview>>('/admin/overview', { params: { days } })
    .then((response) => response.data.data)

export const fetchRoles = () =>
  httpClient
    .get<ApiEnvelope<{ roles: AdminRole[] }>>('/roles', {
      params: { limit: 1000 },
    })
    .then((response) => response.data.data.roles)

export const createRole = (payload: AdminRolePayload) =>
  httpClient
    .post<ApiEnvelope<{ role: AdminRole }>>('/roles', payload)
    .then((response) => response.data.data.role)

export const updateRole = (id: string, payload: AdminRolePayload) =>
  httpClient
    .patch<ApiEnvelope<{ role: AdminRole }>>(`/roles/${id}`, payload)
    .then((response) => response.data.data.role)

export const deleteRole = (id: string) =>
  httpClient
    .delete<ApiEnvelope<null>>(`/roles/${id}`)
    .then((response) => response.data)

export const fetchAdminTalents = (filters: AdminTalentFilters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  )
  return httpClient
    .get<ApiEnvelope<{ users: AdminTalent[]; total: number }>>(
      '/admin/talents',
      {
        params,
      },
    )
    .then((response) => response.data.data)
}

export const fetchAdminTalentProfile = (id: string) =>
  httpClient
    .get<ApiEnvelope<{ user: AdminTalentProfile }>>(`/user/profile/${id}`)
    .then((response) => response.data.data.user)

export const deleteAdminTalent = (id: string) =>
  httpClient
    .delete<ApiEnvelope<null>>(`/admin/talents/${id}`)
    .then((response) => response.data)

export const fetchAdminRecruiters = (filters: AdminRecruiterFilters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  )
  return httpClient
    .get<ApiEnvelope<{ users: AdminRecruiter[]; total: number }>>(
      '/admin/recruiters',
      {
        params,
      },
    )
    .then((response) => response.data.data)
}

export const deleteAdminRecruiter = (id: string) =>
  httpClient
    .delete<ApiEnvelope<null>>(`/admin/recruiters/${id}`)
    .then((response) => response.data)

export const fetchUserOnboarding = (userId: string) =>
  httpClient
    .get<ApiEnvelope<{ onboarding: UserOnboarding }>>(
      `/admin/users/${userId}/onboarding`,
    )
    .then((response) => response.data.data.onboarding)

export const draftOnboardingEmail = (userId: string) =>
  httpClient
    .post<ApiEnvelope<{ draft: { subject: string; body: string } }>>(
      `/admin/users/${userId}/onboarding/draft`,
    )
    .then((response) => response.data.data.draft)

export const sendOnboardingEmail = (
  userId: string,
  payload: { subject: string; body: string; confirm?: boolean },
) =>
  httpClient
    .post<ApiEnvelope<{ email: OnboardingEmailRecord }>>(
      `/admin/users/${userId}/onboarding/emails`,
      payload,
    )
    .then((response) => response.data.data.email)

export const fetchStuckApplications = (
  filters: StuckApplicationsQuery = {},
) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  )
  return httpClient
    .get<
      ApiEnvelope<{ applications: StuckApplicationSummary[]; total: number }>
    >('/admin/applications', { params })
    .then((response) => response.data.data)
}

export const fetchTalentStuckApplications = (talentId: string) =>
  httpClient
    .get<ApiEnvelope<{ applications: StuckApplicationSummary[] }>>(
      `/admin/users/${talentId}/stuck-applications`,
    )
    .then((response) => response.data.data.applications)

export const fetchApplicationFollowUp = (applicationId: string) =>
  httpClient
    .get<ApiEnvelope<{ followUp: ApplicationFollowUp }>>(
      `/admin/applications/${applicationId}/follow-up`,
    )
    .then((response) => response.data.data.followUp)

export const draftApplicationFollowUpEmail = (applicationId: string) =>
  httpClient
    .post<ApiEnvelope<{ draft: { subject: string; body: string } }>>(
      `/admin/applications/${applicationId}/follow-up/draft`,
    )
    .then((response) => response.data.data.draft)

export const sendApplicationFollowUpEmail = (
  applicationId: string,
  payload: { subject: string; body: string; confirm?: boolean },
) =>
  httpClient
    .post<ApiEnvelope<{ email: ApplicationFollowUpEmailRecord }>>(
      `/admin/applications/${applicationId}/follow-up/emails`,
      payload,
    )
    .then((response) => response.data.data.email)

export const fetchAdminJobs = (filters: AdminJobFilters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  )
  return httpClient
    .get<ApiEnvelope<{ jobs: AdminJob[]; total: number }>>('/admin/jobs', {
      params,
    })
    .then((response) => response.data.data)
}

export const deleteAdminJob = (id: string) =>
  httpClient
    .delete<ApiEnvelope<null>>(`/admin/jobs/${id}`)
    .then((response) => response.data)

export const fetchAdminOrganizations = (
  filters: AdminOrganizationFilters = {},
) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  )
  return httpClient
    .get<ApiEnvelope<{ organizations: AdminOrganization[]; total: number }>>(
      '/admin/organizations',
      {
        params,
      },
    )
    .then((response) => response.data.data)
}

export const fetchAdminOrganization = (id: string) =>
  httpClient
    .get<ApiEnvelope<{ organization: AdminOrganization }>>(
      `/admin/organizations/${id}`,
    )
    .then((response) => response.data.data.organization)

export const verifyAdminOrganization = (id: string) =>
  httpClient
    .patch<ApiEnvelope<{ organization: AdminOrganization }>>(
      `/admin/organizations/${id}/verify`,
    )
    .then((response) => response.data)

export const rejectAdminOrganization = (id: string) =>
  httpClient
    .patch<ApiEnvelope<{ organization: AdminOrganization }>>(
      `/admin/organizations/${id}/reject`,
    )
    .then((response) => response.data)

export const changeAdminOrganizationOwner = (
  id: string,
  input: { newOwnerUserId: string; reason: string },
) =>
  httpClient
    .patch<ApiEnvelope<unknown>>(`/admin/organizations/${id}/owner`, input)
    .then((response) => response.data)

export const deleteAdminOrganization = (id: string) =>
  httpClient
    .delete<ApiEnvelope<null>>(`/admin/organizations/${id}`)
    .then((response) => response.data)

export const fetchAdminFeedback = (filters: AdminFeedbackFilters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  )
  return httpClient
    .get<ApiEnvelope<{ feedback: AdminFeedback[]; total: number }>>(
      '/feedback',
      { params },
    )
    .then((response) => response.data.data)
}

export const markFeedbackRead = (id: string) =>
  httpClient
    .patch<ApiEnvelope<{ feedback: AdminFeedback }>>(`/feedback/${id}/read`)
    .then((response) => response.data)

export const markFeedbackUnread = (id: string) =>
  httpClient
    .patch<ApiEnvelope<{ feedback: AdminFeedback }>>(`/feedback/${id}/unread`)
    .then((response) => response.data)

export const fetchAiModels = () =>
  httpClient
    .get<ApiEnvelope<AiModelsOverview>>('/admin/ai-models')
    .then((response) => response.data.data)

export const saveAiFeatureModel = (key: string, choice: AiChoice) =>
  httpClient
    .patch<ApiEnvelope<{ feature: AiFeature }>>(
      `/admin/ai-models/features/${key}`,
      choice,
    )
    .then((response) => response.data.data.feature)

export const fetchAiFeaturePrompts = (key: string) =>
  httpClient
    .get<ApiEnvelope<{ prompts: AiPromptPart[] }>>(
      `/admin/ai-models/features/${key}/prompts`,
    )
    .then((response) => response.data.data.prompts)

export const saveAiFeaturePrompts = (
  key: string,
  prompts: Record<string, string>,
) =>
  httpClient
    .put<ApiEnvelope<{ prompts: AiPromptPart[] }>>(
      `/admin/ai-models/features/${key}/prompts`,
      { prompts },
    )
    .then((response) => response.data.data.prompts)
