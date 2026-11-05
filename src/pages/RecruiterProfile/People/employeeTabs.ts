import type { ComponentType } from 'react'

import type { StaffMember } from '@/features/people/types'

import { ActivityTab } from './ActivityTab'
import { ChecklistTab } from './ChecklistTab'
import { DetailsTab } from './DetailsTab'
import { DocumentsTab } from './DocumentsTab'
import { PayTab } from './PayTab'
import { PerformanceTab } from './PerformanceTab'

export interface EmployeeTabProps {
  staff: StaffMember
  organizationId: string
  /** Left out or false means read-only, so a tab can't offer a change the server would refuse. */
  canEdit?: boolean
  isOwner?: boolean
}

interface EmployeeTab {
  key: string
  label: string
  creatorOnly?: boolean
  Component: ComponentType<EmployeeTabProps>
}

const EMPLOYEE_TABS: EmployeeTab[] = [
  { key: 'details', label: 'Details', Component: DetailsTab },
  { key: 'pay', label: 'Pay', creatorOnly: true, Component: PayTab },
  {
    key: 'documents',
    label: 'Documents',
    creatorOnly: true,
    Component: DocumentsTab,
  },
  { key: 'checklist', label: 'Checklist', Component: ChecklistTab },
  { key: 'performance', label: 'Performance', Component: PerformanceTab },
  { key: 'activity', label: 'Activity', Component: ActivityTab },
]

export const employeeTabsFor = (isOwner: boolean): EmployeeTab[] =>
  EMPLOYEE_TABS.filter((tab) => isOwner || !tab.creatorOnly)
