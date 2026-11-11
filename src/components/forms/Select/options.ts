import { experienceLevel } from '@/utils/experienceLevel'

import { SelectOption } from './types'

export const WORK_MODE_OPTIONS: SelectOption[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'onSite', label: 'On Site' },
  { value: 'hybrid', label: 'Hybrid' },
]

export const EXPERIENCE_LEVEL_OPTIONS: SelectOption[] = Object.values(
  experienceLevel,
).map((label) => ({ value: label, label }))

export const CURRENCY_OPTIONS: SelectOption[] = [
  { value: 'NGN', label: 'NGN · Nigerian naira' },
  { value: 'USD', label: 'USD · US dollar' },
  { value: 'GBP', label: 'GBP · British pound' },
  { value: 'EUR', label: 'EUR · Euro' },
]

/** PATCH /user/me only accepts the backend Currency enum (NGN, USD). */
export const PROFILE_CURRENCY_OPTIONS: SelectOption[] = [
  { value: 'NGN', label: 'NGN' },
  { value: 'USD', label: 'USD' },
]

export const COMPENSATION_PERIOD_OPTIONS: SelectOption[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export const EMPLOYMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]
