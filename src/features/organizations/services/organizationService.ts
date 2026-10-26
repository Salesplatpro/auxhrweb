import { AxiosProgressEvent } from 'axios'

import { httpClient } from '@/features/auth/services/httpClient'

import {
  CreateOrganizationPayload,
  InviteApiResponse,
  InvitePreviewApiResponse,
  InvitesApiResponse,
  JoinOrganizationRequestPayload,
  JoinRequestsApiResponse,
  MembersApiResponse,
  OrganizationApiResponse,
  OrganizationMember,
  OrganizationsApiResponse,
  OrganizationUsageApiResponse,
  SendOrganizationInvitePayload,
  UpdateOrganizationPayload,
} from '../types'

export const MY_ORGANIZATIONS_ENDPOINT = '/organizations/me'

export const fetchMyOrganizations = () =>
  httpClient
    .get<OrganizationsApiResponse>(MY_ORGANIZATIONS_ENDPOINT)
    .then((response) => response.data)

export const createOrganization = (payload: CreateOrganizationPayload) =>
  httpClient
    .post<OrganizationApiResponse>('/organizations', payload)
    .then((response) => response.data)

export const switchOrganization = (organizationId: string) =>
  httpClient
    .patch<OrganizationApiResponse>(`/organizations/${organizationId}/switch`)
    .then((response) => response.data)

export const updateOrganization = (
  organizationId: string,
  payload: UpdateOrganizationPayload,
) =>
  httpClient
    .patch<OrganizationApiResponse>(`/organizations/${organizationId}`, payload)
    .then((response) => response.data)

export const deleteOrganization = (organizationId: string) =>
  httpClient
    .delete(`/organizations/${organizationId}`)
    .then((response) => response.data)

export const uploadLogo = (
  organizationId: string,
  file: File,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) => {
  const formData = new FormData()
  formData.append('logo', file)

  return httpClient
    .patch<OrganizationApiResponse>(
      `/organizations/${organizationId}/logo`,
      formData,
      { onUploadProgress },
    )
    .then((response) => response.data)
}

export const removeLogo = (organizationId: string) =>
  httpClient
    .delete<OrganizationApiResponse>(`/organizations/${organizationId}/logo`)
    .then((response) => response.data)

export const fetchVerifiedOrganizations = (search?: string) =>
  httpClient
    .get<OrganizationsApiResponse>('/organizations/verified', {
      params: search ? { search } : undefined,
    })
    .then((response) => response.data)

export const requestJoinOrganization = (
  organizationId: string,
  payload: JoinOrganizationRequestPayload,
) =>
  httpClient
    .post<{ status: boolean; message: string }>(
      `/organizations/${organizationId}/join-request`,
      payload,
    )
    .then((response) => response.data)

export const fetchOrganizationJoinRequests = (organizationId: string) =>
  httpClient
    .get<JoinRequestsApiResponse>(
      `/organizations/${organizationId}/join-requests`,
    )
    .then((response) => response.data)

export const approveJoinRequest = (requestId: string) =>
  httpClient
    .patch<OrganizationApiResponse>(
      `/organizations/join-requests/${requestId}/approve`,
    )
    .then((response) => response.data)

export const rejectJoinRequest = (requestId: string) =>
  httpClient
    .patch<{ status: boolean; message: string }>(
      `/organizations/join-requests/${requestId}/reject`,
    )
    .then((response) => response.data)

export const sendOrganizationInvite = (
  organizationId: string,
  payload: SendOrganizationInvitePayload,
) =>
  httpClient
    .post<InviteApiResponse>(
      `/organizations/${organizationId}/invites`,
      payload,
    )
    .then((response) => response.data)

export const fetchOrganizationMembers = (organizationId: string) =>
  httpClient
    .get<MembersApiResponse>(`/organizations/${organizationId}/members`)
    .then((response) => response.data)

export const updateMemberCanManagePeople = (
  organizationId: string,
  memberId: string,
  canManagePeople: boolean,
) =>
  httpClient
    .patch<{ data: { member: OrganizationMember } }>(
      `/organizations/${organizationId}/members/${memberId}`,
      { canManagePeople },
    )
    .then((response) => response.data.data.member)

export const fetchOrganizationUsage = (organizationId: string) =>
  httpClient
    .get<OrganizationUsageApiResponse>(`/organizations/${organizationId}/usage`)
    .then((response) => response.data)

export const fetchOrganizationInvites = (organizationId: string) =>
  httpClient
    .get<InvitesApiResponse>(`/organizations/${organizationId}/invites`)
    .then((response) => response.data)

export const revokeOrganizationInvite = (
  organizationId: string,
  inviteId: string,
) =>
  httpClient
    .delete<{ status: boolean; message: string }>(
      `/organizations/${organizationId}/invites/${inviteId}`,
    )
    .then((response) => response.data)

export const fetchOrganizationInvitePreview = (token: string) =>
  httpClient
    .get<InvitePreviewApiResponse>(`/organizations/invites/${token}`)
    .then((response) => response.data)

export const acceptOrganizationInvite = (token: string) =>
  httpClient
    .post<OrganizationApiResponse>(`/organizations/invites/${token}/accept`)
    .then((response) => response.data)
