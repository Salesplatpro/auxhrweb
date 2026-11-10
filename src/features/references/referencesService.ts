import { httpClient } from '@/features/auth/services/httpClient'

import type { RefereeFormValues } from './referenceRules'
import type { Envelope, Referee, RefereeList } from './types'

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
