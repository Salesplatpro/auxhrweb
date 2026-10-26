import { httpClient } from '@/features/auth/services/httpClient'

import {
  AccessLogData,
  AccessLogQuery,
  CreateStaffPayload,
  CreateStaffResult,
  Envelope,
  InviteStaffResult,
  JoinedStaff,
  PeopleAccess,
  StaffActivity,
  StaffInvitePreview,
  StaffListData,
  StaffListQuery,
  StaffMember,
  StaffOption,
  UpdateStaffPayload,
} from '../types'

export const staffBase = (organizationId: string) =>
  `/organizations/${organizationId}/staff`

const unwrap = <T>(promise: Promise<{ data: Envelope<T> }>) =>
  promise.then((response) => response.data.data)

const compact = (params: Record<string, string | number>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== 0),
  )

export const toQueryString = (params: Record<string, string | number>) =>
  new URLSearchParams(
    Object.entries(compact(params)).map(([key, value]) => [key, String(value)]),
  ).toString()

export const fetchPeopleAccess = (organizationId: string) =>
  unwrap<{ access: PeopleAccess }>(
    httpClient.get(`${staffBase(organizationId)}/access`),
  ).then((data) => data.access)

export const fetchStaffList = (organizationId: string, query: StaffListQuery) =>
  unwrap<StaffListData>(
    httpClient.get(staffBase(organizationId), {
      params: compact({ ...query }),
    }),
  )

export const fetchStaffOptions = (
  organizationId: string,
  includeEnded: boolean,
) =>
  unwrap<{ options: StaffOption[] }>(
    httpClient.get(`${staffBase(organizationId)}/options`, {
      params: includeEnded ? { includeEnded: true } : undefined,
    }),
  ).then((data) => data.options)

export const createStaff = (
  organizationId: string,
  payload: CreateStaffPayload,
) =>
  unwrap<CreateStaffResult>(httpClient.post(staffBase(organizationId), payload))

export const fetchStaffMember = (organizationId: string, staffId: string) =>
  unwrap<{ staff: StaffMember }>(
    httpClient.get(`${staffBase(organizationId)}/${staffId}`),
  ).then((data) => data.staff)

export const updateStaff = (
  organizationId: string,
  staffId: string,
  payload: UpdateStaffPayload,
) =>
  unwrap<{ staff: StaffMember }>(
    httpClient.patch(`${staffBase(organizationId)}/${staffId}`, payload),
  ).then((data) => data.staff)

export const endStaff = (
  organizationId: string,
  staffId: string,
  endDate: string,
) =>
  unwrap<{ staff: StaffMember }>(
    httpClient.post(`${staffBase(organizationId)}/${staffId}/end`, {
      endDate,
    }),
  ).then((data) => data.staff)

export const inviteStaff = (organizationId: string, staffId: string) =>
  unwrap<InviteStaffResult>(
    httpClient.post(`${staffBase(organizationId)}/${staffId}/invite`),
  )

export const fetchStaffActivity = (organizationId: string, staffId: string) =>
  unwrap<{ activities: StaffActivity[] }>(
    httpClient.get(`${staffBase(organizationId)}/${staffId}/activity`),
  ).then((data) => data.activities)

export const fetchAccessLog = (organizationId: string, query: AccessLogQuery) =>
  unwrap<AccessLogData>(
    httpClient.get(`${staffBase(organizationId)}/access-log`, {
      params: compact({ ...query }),
    }),
  )

export const fetchStaffInvitePreview = (token: string) =>
  unwrap<{ invite: StaffInvitePreview }>(
    httpClient.get(`/staff-invites/${token}`),
  ).then((data) => data.invite)

export const acceptStaffInvite = (token: string) =>
  unwrap<{ joined: JoinedStaff }>(
    httpClient.post(`/staff-invites/${token}/accept`),
  ).then((data) => data.joined)
