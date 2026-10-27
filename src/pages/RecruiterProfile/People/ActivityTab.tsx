import React from 'react'
import {
  HiOutlineCheckCircle,
  HiOutlineEnvelope,
  HiOutlineEnvelopeOpen,
  HiOutlineExclamationTriangle,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineXCircle,
} from 'react-icons/hi2'

import { PagePanel } from '@/components/layout/PagePanel'
import { Spinner } from '@/components/ui/Spinner'
import { Timeline, TimelineItem } from '@/components/ui/Timeline'
import { useStaffActivity } from '@/features/people/hooks/useStaffData'
import { StaffActivity } from '@/features/people/types'
import {
  formatDateOnly,
  formatDateTime,
} from '@/features/people/utils/formatDate'

import type { EmployeeTabProps } from './employeeTabs'

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Name',
  jobTitle: 'Job title',
  department: 'Department',
  manager: 'Manager',
  startDate: 'Start date',
  isExecutive: 'Executive',
}

const formatValue = (field: string, value: unknown): string => {
  if (value === null || value === undefined || value === '') return 'none'
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (field === 'startDate') return formatDateOnly(String(value))
  return String(value)
}

const changesDetail = (activity: StaffActivity) => {
  const changes = Object.entries(activity.meta?.changes ?? {})
  if (changes.length === 0) return undefined
  return (
    <ul>
      {changes.map(([field, [from, to]]) => (
        <li key={field}>
          {FIELD_LABELS[field] ?? field}: {formatValue(field, from)} →{' '}
          {formatValue(field, to)}
        </li>
      ))}
    </ul>
  )
}

const toItem = (
  activity: StaffActivity,
  employeeEmail: string,
): TimelineItem => {
  const base = {
    id: activity.id,
    time: formatDateTime(activity.createdAt),
  }
  const who = activity.actorName

  switch (activity.type) {
    case 'created':
      return {
        ...base,
        title: `Added by ${who}`,
        icon: <HiOutlinePlus />,
      }
    case 'invited':
      return {
        ...base,
        title: `Invited by ${who}`,
        detail: `Invite email sent to ${employeeEmail}`,
        icon: <HiOutlineEnvelope />,
      }
    case 'invite_resent':
      return {
        ...base,
        title: `Invite resent by ${who}`,
        detail: `A new link was emailed to ${employeeEmail}. The old link stopped working.`,
        icon: <HiOutlineEnvelope />,
      }
    case 'invite_failed':
      return {
        ...base,
        title: 'Invite email could not be sent',
        detail: 'Resend the invite from the banner at the top of this page.',
        tone: 'warning',
        icon: <HiOutlineExclamationTriangle />,
      }
    case 'invite_opened':
      return {
        ...base,
        title: 'Opened the invite link',
        icon: <HiOutlineEnvelopeOpen />,
      }
    case 'joined':
      return {
        ...base,
        title: 'Joined AuxHR',
        detail:
          'Created their account, completed their profile and was linked to this record.',
        tone: 'success',
        icon: <HiOutlineCheckCircle />,
      }
    case 'updated':
      return {
        ...base,
        title: `Details updated by ${who}`,
        detail: changesDetail(activity),
        icon: <HiOutlinePencilSquare />,
      }
    case 'ended':
      return {
        ...base,
        title: `Employment ended by ${who}`,
        detail: activity.meta?.endDate
          ? `Last day: ${formatDateOnly(activity.meta.endDate)}`
          : undefined,
        tone: 'danger',
        icon: <HiOutlineXCircle />,
      }
  }
}

export const ActivityTab: React.FC<EmployeeTabProps> = ({
  staff,
  organizationId,
}) => {
  const { activities, isLoading, hasError } = useStaffActivity(
    organizationId,
    staff.id,
  )

  return (
    <PagePanel
      title="Activity"
      hint="Everything that has happened to this person, newest first.">
      {isLoading ? (
        <Spinner />
      ) : hasError ? (
        <p>Couldn&apos;t load the activity. Refresh the page to try again.</p>
      ) : (
        <Timeline
          ariaLabel="Employee activity"
          items={activities.map((activity) => toItem(activity, staff.email))}
        />
      )}
    </PagePanel>
  )
}
