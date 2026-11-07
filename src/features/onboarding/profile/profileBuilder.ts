import * as Yup from 'yup'

import { buildProfileFormValues } from '@/features/profile/hooks/useProfileFormValues'
import {
  ProfileFormValues,
  ProfilePatchPayload,
  ProfileUser,
} from '@/features/profile/types'
import { diffProfileValues } from '@/features/profile/utils/diffProfileValues'
import { ProfileCompletionFieldName } from '@/utils/calculateProgress'
import { experienceLevel } from '@/utils/experienceLevel'

export const BIO_MAX_LENGTH = 1000
export const ROLE_LIMIT = 3
export const ROLE_CHANGE_LIMIT = 3
export const SALARY_MAX = 100_000_000
export const CV_MAX_BYTES = 5 * 1024 * 1024
export const CV_EXTENSIONS = ['.pdf', '.docx']

export type ProfileBuilderValues = ProfileFormValues & { fullName: string }

export type ProfileBuilderField = keyof ProfileBuilderValues

export const PROFILE_STEP_FIELDS: ProfileBuilderField[][] = [
  ['fullName', 'bio', 'role', 'experience', 'workType'],
  ['location', 'currency', 'minSalary', 'maxSalary'],
]

const COMPLETION_STEP: Record<ProfileCompletionFieldName, number> = {
  bio: 0,
  role: 0,
  experience: 0,
  workType: 0,
  'location.country.name': 1,
  minSalary: 1,
  maxSalary: 1,
  cv: 1,
}

export const stepForCompletionField = (name: ProfileCompletionFieldName) =>
  COMPLETION_STEP[name]

export const joinName = (user?: ProfileUser | null) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ')

export const splitFullName = (fullName: string) => {
  const [firstName = '', ...rest] = fullName.trim().split(/\s+/)
  return { firstName, lastName: rest.join(' ') }
}

export const buildBuilderBaseline = (
  user?: ProfileUser | null,
): ProfileBuilderValues => ({
  ...buildProfileFormValues(user),
  fullName: joinName(user),
})

export const buildBuilderValues = (
  user?: ProfileUser | null,
): ProfileBuilderValues => {
  const baseline = buildBuilderBaseline(user)
  return {
    ...baseline,
    currency: baseline.currency || 'NGN',
    compensationPeriod: baseline.compensationPeriod || 'yearly',
  }
}

export const buildProfilePatch = (
  baseline: ProfileBuilderValues,
  values: ProfileBuilderValues,
): Partial<ProfilePatchPayload> => {
  const patch: Partial<ProfilePatchPayload> = diffProfileValues(
    baseline,
    values,
  )
  if (values.fullName.trim() !== baseline.fullName.trim()) {
    Object.assign(patch, splitFullName(values.fullName))
  }
  return patch
}

export const roleCapFor = (initialRoleCount: number) =>
  Math.max(ROLE_LIMIT, initialRoleCount)

export const rolesLocked = (user?: ProfileUser | null) =>
  (user?.roleChangeCount ?? 0) >= ROLE_CHANGE_LIMIT

export const cvFileError = (file: File): string | undefined => {
  const name = file.name.toLowerCase()
  if (!CV_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return 'Upload a PDF or DOCX file.'
  }
  if (file.size > CV_MAX_BYTES) return 'Your CV must be 5 MB or smaller.'
  return undefined
}

const salary = (label: string) =>
  Yup.string()
    .required(`Enter your ${label} salary`)
    .test(
      'positive',
      `${label[0].toUpperCase()}${label.slice(
        1,
      )} salary must be a positive number`,
      (value) => !value || Number(value) > 0,
    )
    .test(
      'ceiling',
      'Salary must be 100,000,000 or less',
      (value) => !value || Number(value) <= SALARY_MAX,
    )

export const profileBuilderSchema = Yup.object({
  fullName: Yup.string()
    .trim()
    .required('Enter your full name')
    .test(
      'two-words',
      'Enter your first and last name',
      (value) => (value ?? '').trim().split(/\s+/).length >= 2,
    ),
  bio: Yup.string()
    .trim()
    .required('Add a short bio')
    .max(BIO_MAX_LENGTH, `Bio must be ${BIO_MAX_LENGTH} characters or fewer`),
  role: Yup.array().of(Yup.string()).min(1, 'Pick at least one role'),
  experience: Yup.string().required('Select your experience'),
  workType: Yup.array().of(Yup.string()).min(1, 'Pick at least one work type'),
  location: Yup.object({
    country: Yup.object({
      name: Yup.string().required('Country is required'),
    }),
  }),
  currency: Yup.string()
    .required('Select a currency')
    .oneOf(['NGN', 'USD'], 'Select NGN or USD'),
  minSalary: salary('minimum'),
  maxSalary: salary('maximum').test(
    'above-min',
    'Maximum salary must be more than the minimum',
    function (value) {
      if (!value || !this.parent.minSalary) return true
      return Number(value) > Number(this.parent.minSalary)
    },
  ),
})

const COMPACT = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const CURRENCY_SIGN: Record<string, string> = { NGN: '₦', USD: '$' }

export const formatSalaryRange = (
  currency: string,
  min: string,
  max: string,
  period: string,
) => {
  if (!min || !max) return undefined
  const sign = CURRENCY_SIGN[currency] ?? `${currency} `
  const per = period === 'monthly' ? 'a month' : 'a year'
  return `${sign}${COMPACT.format(Number(min))} to ${sign}${COMPACT.format(
    Number(max),
  )} ${per}`
}

const LEVEL_BY_EXPERIENCE: Record<string, string> = {
  [experienceLevel.oneToThreeYears]: 'Junior',
  [experienceLevel.fourToSixYears]: 'Mid-level',
  [experienceLevel.sevenToTenYears]: 'Senior',
  [experienceLevel.elevenToFifteenYears]: 'Lead',
  [experienceLevel.sixteenYearsAndAbove]: 'Executive',
}

export const levelForExperience = (experience?: string | null) =>
  LEVEL_BY_EXPERIENCE[experience ?? ''] ?? ''

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`

export const describeCvReading = (
  years?: number | null,
  skills?: string[] | null,
): string | null => {
  const parts: string[] = []
  if (years != null) parts.push(`${plural(years, 'year')} of experience`)
  if (skills?.length) parts.push(plural(skills.length, 'skill'))
  return parts.length ? `AI read ${parts.join(' and ')}` : null
}

export const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
