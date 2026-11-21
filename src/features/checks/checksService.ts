import { httpClient } from '@/features/auth/services/httpClient'

import { CONSENT_VERSION } from './consentRules'
import type {
  CheckHistory,
  CheckResultInput,
  ChecksOverview,
  CheckType,
  Consent,
  Envelope,
  IdKind,
  OpenCheck,
} from './types'

const applicationChecksPath = (applicationId: string) =>
  `/checks/applications/${applicationId}`

export const consentKey = (applicationId: string) =>
  `${applicationChecksPath(applicationId)}/consent/mine`

export const checksKey = (applicationId: string) =>
  applicationChecksPath(applicationId)

export const fetchMyConsent = (applicationId: string) =>
  httpClient
    .get<Envelope<Consent>>(consentKey(applicationId))
    .then((response) => response.data.data)

export const agreeToChecks = (
  applicationId: string,
  idKind: IdKind,
  idNumber: string,
) =>
  httpClient
    .post<Envelope<Consent>>(
      `${applicationChecksPath(applicationId)}/consent`,
      { version: CONSENT_VERSION, idKind, idNumber },
    )
    .then((response) => response.data.data)

export const declineChecks = (applicationId: string) =>
  httpClient
    .post<Envelope<Consent>>(
      `${applicationChecksPath(applicationId)}/consent/decline`,
    )
    .then((response) => response.data.data)

export const requestConsent = (applicationId: string) =>
  httpClient
    .post<Envelope<Consent>>(
      `${applicationChecksPath(applicationId)}/consent/request`,
    )
    .then((response) => response.data.data)

export const fetchChecks = (applicationId: string) =>
  httpClient
    .get<Envelope<ChecksOverview>>(checksKey(applicationId))
    .then((response) => response.data.data)

export const orderCheck = (applicationId: string, type: CheckType) =>
  httpClient
    .post<Envelope<OpenCheck>>(applicationChecksPath(applicationId), { type })
    .then((response) => response.data.data)

export const saveCheckResult = (checkId: string, input: CheckResultInput) =>
  httpClient
    .patch<Envelope<OpenCheck>>(`/checks/${checkId}/result`, input)
    .then((response) => response.data.data)

export const fetchCheckHistory = (checkId: string) =>
  httpClient
    .get<Envelope<CheckHistory>>(`/checks/${checkId}/history`)
    .then((response) => response.data.data)

export const fetchIdNumber = (checkId: string) =>
  httpClient
    .get<Envelope<{ checkId: string; idKind: IdKind; idNumber: string }>>(
      `/checks/${checkId}/id-number`,
    )
    .then((response) => response.data.data)
