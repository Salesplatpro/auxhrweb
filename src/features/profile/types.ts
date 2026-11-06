import { WorkType } from '@/components/features/jobs/WorkTypeCheckboxes'
import { LocationFormValue } from '@/components/forms/LocationSelect'
import { Organization } from '@/features/organizations/types'

export interface ProfileRole {
  id: string
  name?: string
}

export interface ProfileCompletion {
  percentage: number
  isProfileComplete: boolean
  canProceedToPlatform: boolean
}

export interface ProfileUser {
  id?: string
  email?: string
  firstName?: string
  lastName?: string
  middleName?: string | null
  userRole?: string
  country?: string | null
  activeOrganizationId?: string | null
  emailVerifiedAt?: string | null
  active?: boolean
  bio?: string
  profileImageUrl?: string | null
  cvFileName?: string | null
  cvUrl?: string | null
  cvUploadedAt?: string | null
  workType?: WorkType[] | null
  locationCity?: string | null
  locationState?: string | null
  locationCountry?: string | null
  experience?: string
  currency?: string
  maxSalary?: number | string
  minSalary?: number | string
  compensationPeriod?: string
  prescreeningScore?: number | null
  assessmentRetryDate?: string | null
  roleChangeCount?: number
  activePreScreeningId?: string | null
  createdAt?: string
  updatedAt?: string
  userRoles?: ProfileRole[]
  activeOrganization?: Organization | null
  profileCompletion?: ProfileCompletion
}

export type OnboardingStage =
  | 'verify_email'
  | 'complete_profile'
  | 'take_assessment'
  | 'apply_to_job'
  | 'create_company'
  | 'post_job'
  | 'set_up_screening'
  | 'publish_job'
  | 'active'

export interface OnboardingApiResponse {
  data: { onboarding: { role: string; stage: OnboardingStage } }
}

export interface ProfileApiResponse {
  status?: boolean
  message?: string
  data: { user: ProfileUser }
}

export interface ProfilePatchPayload {
  firstName?: string
  lastName?: string
  bio?: string
  roleIds?: string[]
  locationCity?: string
  locationState?: string
  locationCountry?: string
  experience?: string
  minSalary?: number
  maxSalary?: number
  currency?: string
  compensationPeriod?: string
  workType?: WorkType[]
}

export interface ProfileFormValues {
  bio: string
  role: string[]
  location: LocationFormValue
  experience: string
  minSalary: string
  maxSalary: string
  currency: string
  compensationPeriod: string
  workType: WorkType[]
}
