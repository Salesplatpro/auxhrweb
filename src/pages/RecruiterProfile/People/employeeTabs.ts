import type { ComponentType } from 'react'

import type { StaffMember } from '@/features/people/types'

import { ActivityTab } from './ActivityTab'
import { DetailsTab } from './DetailsTab'
import { PayTab } from './PayTab'

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
  { key: 'pay', label: 'Pay', Component: PayTab },
  { key: 'activity', label: 'Activity', Component: ActivityTab },
]
