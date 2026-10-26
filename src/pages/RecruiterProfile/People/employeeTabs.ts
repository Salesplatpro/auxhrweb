import type { ComponentType } from 'react'

import type { StaffMember } from '@/features/people/types'

import { ActivityTab } from './ActivityTab'
import { DetailsTab } from './DetailsTab'

export interface EmployeeTabProps {
  staff: StaffMember
  organizationId: string
}

interface EmployeeTab {
  key: string
  label: string
  Component: ComponentType<EmployeeTabProps>
}

export const EMPLOYEE_TABS: EmployeeTab[] = [
  { key: 'details', label: 'Details', Component: DetailsTab },
  { key: 'activity', label: 'Activity', Component: ActivityTab },
]
