export type CompanyActivityEntry = {
  id: string
  createdAt: string
  actorId: string | null
  actorName: string
  action: string
  targetType: string | null
  targetId: string | null
  targetLabel: string | null
  changedFields: string[]
  ip: string | null
}

export type CompanyActivityQuery = {
  actorId: string
  search: string
  from: string
  to: string
  limit: number
  offset: number
}

const TARGET_LABELS: Record<string, string> = {
  application: 'Candidate',
  referee: 'Referee',
  staff: 'Employee',
  member: 'Team member',
  job: 'Job',
  invite: 'Invite',
  company: 'Company',
}

export const fieldLabel = (field: string) =>
  field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()

export const actionLabel = (action: string) =>
  action ? action[0]!.toUpperCase() + action.slice(1) : action

export const targetText = (entry: CompanyActivityEntry) => {
  if (entry.targetLabel) {
    const kind = entry.targetType ? TARGET_LABELS[entry.targetType] : null
    return kind ? `${kind}: ${entry.targetLabel}` : entry.targetLabel
  }
  return entry.targetType ? TARGET_LABELS[entry.targetType] ?? '—' : '—'
}

export const changedText = (fields: string[]) =>
  fields.length ? fields.map(fieldLabel).join(', ') : '—'

export const activityKey = (
  organizationId: string,
  query: CompanyActivityQuery,
) => {
  const params = new URLSearchParams(
    Object.entries(query)
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [key, String(value)]),
  )
  return `/organizations/${organizationId}/activity?${params.toString()}`
}
