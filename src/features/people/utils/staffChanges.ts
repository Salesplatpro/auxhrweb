import type { StaffFormValues } from '../types'
import { formatDateOnly } from './formatDate'
import { firstNameOf } from './nameParts'

type Compared = Pick<
  StaffFormValues,
  | 'fullName'
  | 'email'
  | 'jobTitle'
  | 'department'
  | 'managerId'
  | 'startDate'
  | 'isExecutive'
  | 'phone'
  | 'homeAddress'
>

const LABELS: Record<Exclude<keyof Compared, 'isExecutive'>, string> = {
  fullName: 'name',
  email: 'work email',
  jobTitle: 'job title',
  department: 'department',
  managerId: 'manager',
  startDate: 'start date',
  phone: 'phone',
  homeAddress: 'home address',
}

/** One sentence for the save toast when exactly one detail changed. */
export const describeStaffChange = (
  before: Compared,
  after: Compared,
  managerName: (id: string) => string | undefined,
): string | undefined => {
  const keys = (Object.keys(LABELS) as (keyof typeof LABELS)[]).filter(
    (key) => before[key].trim() !== after[key].trim(),
  )
  const executiveChanged = before.isExecutive !== after.isExecutive
  if (keys.length + (executiveChanged ? 1 : 0) !== 1) return undefined

  const name = firstNameOf(after.fullName)
  if (executiveChanged) {
    return after.isExecutive
      ? `${name} is now marked as an executive.`
      : `${name} is no longer marked as an executive.`
  }

  const key = keys[0]!
  const raw = after[key].trim()
  if (!raw) return `${name}'s ${LABELS[key]} was removed.`
  const value =
    key === 'managerId'
      ? managerName(raw) ?? 'someone new'
      : key === 'startDate'
      ? formatDateOnly(raw)
      : raw
  return `${name}'s ${LABELS[key]} is now ${value}.`
}
