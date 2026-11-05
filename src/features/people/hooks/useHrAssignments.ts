import useSWR, { useSWRConfig } from 'swr'

import {
  fetchAssignedStaffIds,
  fetchHrAssignees,
  saveHrAssignments,
  staffBase,
} from '../services/peopleService'

const assignedKey = (organizationId: string, assigneeUserId: string) =>
  `${staffBase(organizationId)}/hr-assignments?assigneeUserId=${assigneeUserId}`

export const useAssignedStaffIds = (
  organizationId: string,
  assigneeUserId: string | null,
) => {
  const { data, isLoading, error } = useSWR(
    assigneeUserId ? assignedKey(organizationId, assigneeUserId) : null,
    () => fetchAssignedStaffIds(organizationId, assigneeUserId as string),
  )
  return { assignedStaffIds: data ?? [], isLoading, hasError: !!error }
}

export const useHrAssignees = (organizationId: string, staffId: string) => {
  const { data, isLoading, error } = useSWR(
    `${staffBase(organizationId)}/${staffId}/hr`,
    () => fetchHrAssignees(organizationId, staffId),
  )
  return { assignees: data ?? [], isLoading, hasError: !!error }
}

export const useSaveHrAssignments = (organizationId: string) => {
  const { mutate } = useSWRConfig()
  const base = staffBase(organizationId)

  return async (input: {
    assigneeUserId: string
    add: string[]
    remove: string[]
  }) => {
    await saveHrAssignments(organizationId, input)
    // Staff records stay out of this, because each fetch of one writes an access log line.
    await mutate(
      (key) =>
        typeof key === 'string' &&
        key.startsWith(base) &&
        (key.includes('/hr-assignments') ||
          key.endsWith('/hr') ||
          key.endsWith('/access')),
    )
  }
}
