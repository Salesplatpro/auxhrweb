import { WorkType } from '@/components/features/jobs/WorkTypeCheckboxes'
import { LocationFormValue } from '@/components/forms/LocationSelect'

export interface FormValues {
  jobBrief: string
  // aiConfig: string
  role: string
  name?: string
  minSalary: string
  maxSalary: string
  compensationPeriod: string
  currency: string
  experienceLevel: string
  workMode: string
  location: LocationFormValue
  requirements: string
  skills: string[]
  goals: string[]
  department: string
  employmentType: string
  /** YYYY-MM-DD, or '' for no closing date. */
  closesAt: string
  shareOptions: boolean
}

export type PostJobFormValues = Omit<FormValues, 'workMode'> & {
  workMode: WorkType[]
}

export interface JobFiltersTypes {
  role?: string
  experienceLevel?: string
  workMode: WorkType[]
  location: LocationFormValue
}
