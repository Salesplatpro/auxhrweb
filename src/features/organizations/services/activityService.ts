import { httpClient } from '@/features/auth/services/httpClient'

import type { CompanyActivityEntry, CompanyActivityQuery } from '../activityLog'
import { activityKey } from '../activityLog'

export const fetchCompanyActivity = (
  organizationId: string,
  query: CompanyActivityQuery,
) =>
  httpClient
    .get<{ data: { items: CompanyActivityEntry[]; total: number } }>(
      activityKey(organizationId, query),
    )
    .then((response) => response.data.data)
