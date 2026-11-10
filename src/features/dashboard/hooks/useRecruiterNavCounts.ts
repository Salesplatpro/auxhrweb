import useSWR from 'swr'

import { useChatSessions } from '@/features/messaging/hooks/useChatSessions'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { useOrganizationUsage } from '@/features/organizations/hooks/useOrganizationUsage'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useStaffList } from '@/features/people/hooks/useStaffData'
import { useProfile } from '@/features/profile/hooks/useProfile'

import {
  fetchRecruiterCounts,
  recruiterCountsKey,
} from '../services/dashboardService'

const STAFF_COUNT_QUERY = {
  search: '',
  status: '',
  limit: 1,
  offset: 0,
} as const

export const useRecruiterNavCounts = () => {
  const { profile } = useProfile()
  const organizationId = profile?.activeOrganizationId ?? null
  const { isOwner, canManagePeople } = usePeopleAccess()
  const showPeople = isOwner || canManagePeople

  const { data: counts } = useSWR(
    organizationId ? recruiterCountsKey(organizationId) : null,
    fetchRecruiterCounts,
    { shouldRetryOnError: false },
  )
  const { usage } = useOrganizationUsage(organizationId)
  const { total: employees } = useStaffList(
    showPeople ? organizationId : null,
    STAFF_COUNT_QUERY,
  )
  const { unReadCount } = useNotifications()
  const { sessions } = useChatSessions()

  const chats = sessions.reduce(
    (sum, session) =>
      sum +
      session.threads.reduce(
        (threadSum, thread) => threadSum + (thread.unreadCount ?? 0),
        0,
      ),
    0,
  )

  return {
    showPeople,
    counts: {
      jobPosts: usage?.meters.find((meter) => meter.key === 'job_listings')
        ?.used,
      applications: counts?.applications,
      shortlist: counts?.shortlisted,
      employees: showPeople ? employees : undefined,
      notifications: unReadCount,
      chats,
    },
  }
}
