import { httpClient } from '@/features/auth/services/httpClient'

import type { RefereeFormValues } from './referenceRules'
import type { Envelope, RefereeList, RefereeRequest } from './types'

const applicationReferencesPath = (applicationId: string) =>
  `/references/applications/${applicationId}`

export const listReferees = (applicationId: string) =>
  httpClient
    .get<Envelope<RefereeList>>(applicationReferencesPath(applicationId))
    .then((response) => response.data.data)

export const addReferees = (
  applicationId: string,
  referees: RefereeFormValues[],
) =>
  httpClient
    .post<Envelope<RefereeList>>(applicationReferencesPath(applicationId), {
      referees: referees.map((referee) => ({
        name: referee.name.trim(),
        email: referee.email.trim(),
        relationship: referee.relationship,
      })),
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
