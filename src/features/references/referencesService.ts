import { httpClient } from '@/features/auth/services/httpClient'

import type { RefereeFormValues } from './referenceRules'
import type {
  Envelope,
  Referee,
  RefereeList,
  RefereeRequest,
  ReferenceReview,
} from './types'

const applicationReferencesPath = (applicationId: string) =>
  `/references/applications/${applicationId}`

export const listReferees = (applicationId: string) =>
  httpClient
    .get<Envelope<RefereeList>>(applicationReferencesPath(applicationId))
    .then((response) => response.data.data)

export const addReferee = (applicationId: string, values: RefereeFormValues) =>
  httpClient
    .post<Envelope<Referee>>(applicationReferencesPath(applicationId), {
      name: values.name.trim(),
      email: values.email.trim(),
      relationship: values.relationship.trim(),
    })
    .then((response) => response.data.data)

export const fetchRefereeRequest = (token: string) =>
  httpClient
    .get<Envelope<RefereeRequest>>(`/references/respond/${token}`)
    .then((response) => response.data.data)

export const submitRefereeAnswers = (
  token: string,
  answers: Record<string, string>,
) =>
  httpClient
    .post(`/references/respond/${token}`, { answers })
    .then(() => undefined)

export const readReferences = (applicationId: string) =>
  httpClient
    .get<Envelope<ReferenceReview>>(
      `${applicationReferencesPath(applicationId)}/answers`,
    )
    .then((response) => response.data.data)

export const resendReference = (referenceId: string) =>
  httpClient
    .post<Envelope<Referee>>(`/references/${referenceId}/resend`)
    .then((response) => response.data.data)
