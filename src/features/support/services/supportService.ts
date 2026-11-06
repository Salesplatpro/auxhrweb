import { httpClient } from '@/features/auth/services/httpClient'

import {
  MySupportRequest,
  SupportInbox,
  SupportInboxFilters,
  SupportRequestDetail,
  SupportRequestWithUser,
  SupportTopic,
  SupportUserContext,
} from '../types'

interface ApiEnvelope<T> {
  status: boolean
  message: string
  data: T
}

export const sendSupportRequest = (body: {
  message: string
  topic: SupportTopic | null
  clientRequestId: string
}) =>
  httpClient
    .post<ApiEnvelope<{ request: MySupportRequest }>>('/feedback', body)
    .then((response) => response.data.data.request)

export const fetchMySupport = () =>
  httpClient
    .get<ApiEnvelope<{ requests: MySupportRequest[] }>>('/feedback/mine')
    .then((response) => response.data.data.requests)

export const fetchSupportInbox = (filters: SupportInboxFilters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  )
  return httpClient
    .get<ApiEnvelope<SupportInbox>>('/feedback', { params })
    .then((response) => response.data.data)
}

export const fetchSupportRequest = (id: string) =>
  httpClient
    .get<ApiEnvelope<SupportRequestDetail>>(`/feedback/${id}`)
    .then((response) => response.data.data)

export const fetchSupportUserContext = (id: string) =>
  httpClient
    .get<ApiEnvelope<{ context: SupportUserContext }>>(
      `/feedback/${id}/user-context`,
    )
    .then((response) => response.data.data.context)

type RequestEnvelope = ApiEnvelope<{ request: SupportRequestWithUser }>

export const markSupportRead = (id: string) =>
  httpClient
    .patch<RequestEnvelope>(`/feedback/${id}/read`)
    .then((response) => response.data.data.request)

export const markSupportUnread = (id: string) =>
  httpClient
    .patch<RequestEnvelope>(`/feedback/${id}/unread`)
    .then((response) => response.data.data.request)

export const saveSupportDraft = (id: string, draft: string) =>
  httpClient
    .put<
      ApiEnvelope<{ draftReply: string | null; draftUpdatedAt: string | null }>
    >(`/feedback/${id}/draft`, { draft })
    .then((response) => response.data.data)

export const draftSupportReplyWithAi = (id: string) =>
  httpClient
    .post<RequestEnvelope>(`/feedback/${id}/ai-draft`)
    .then((response) => response.data.data.request)

export const sendSupportReply = (id: string, reply: string) =>
  httpClient
    .post<RequestEnvelope>(`/feedback/${id}/reply`, { reply })
    .then((response) => response.data.data.request)

export const retrySupportReplyEmail = (id: string) =>
  httpClient
    .post<RequestEnvelope>(`/feedback/${id}/reply/email`)
    .then((response) => response.data.data.request)
