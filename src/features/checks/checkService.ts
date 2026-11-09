import { httpClient } from '@/features/auth/services/httpClient'

import type { ApplicationChecks, CheckConsent, CheckType } from './types'

export const checksKey = (applicationId: string) =>
  `/checks/applications/${applicationId}`

export const consentKey = (applicationId: string) =>
  `${checksKey(applicationId)}/consent`

export const readCheckConsent = (applicationId: string) =>
  httpClient
    .get(consentKey(applicationId))
    .then((response) => response.data.data as CheckConsent)

export const readApplicationChecks = (applicationId: string) =>
  httpClient
    .get(checksKey(applicationId))
    .then((response) => response.data.data as ApplicationChecks)

export const orderApplicationCheck = (applicationId: string, type: CheckType) =>
  httpClient
    .post(checksKey(applicationId), { type })
    .then((response) => response.data.data)
