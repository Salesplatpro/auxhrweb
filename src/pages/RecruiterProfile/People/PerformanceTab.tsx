import React from 'react'

import { PerformanceCards } from '@/features/people/components/performance/PerformanceCards'
import { hrPerformanceBase } from '@/features/people/services/peopleService'

import type { EmployeeTabProps } from './employeeTabs'

export const PerformanceTab: React.FC<EmployeeTabProps> = ({
  staff,
  organizationId,
  canEdit,
}) => (
  <PerformanceCards
    base={hrPerformanceBase(organizationId, staff.id)}
    readOnly={!canEdit || staff.status === 'ended'}
    hr={canEdit ? { organizationId, staffId: staff.id } : undefined}
    canReview={staff.status !== 'ended'}
  />
)
