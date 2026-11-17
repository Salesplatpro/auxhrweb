export interface AppNotification {
  id: string
  userId: string
  title?: string | null
  message: string
  link?: string | null
  type?: string | null
  organizationId?: string | null
  isRead: boolean
  deleted: boolean
  createdAt: string
}

export type NotificationTone = 'violet' | 'amber' | 'success' | 'info'

export const NOTIFICATION_META: Record<
  string,
  { tone: NotificationTone; action?: string }
> = {
  interview_invite: { tone: 'violet', action: 'Start interview' },
  test_sent: { tone: 'amber', action: 'Start test' },
  application_received: { tone: 'success' },
  application_update: { tone: 'violet' },
  profile_viewed: { tone: 'info' },
  staff_invite: { tone: 'violet', action: 'Open My work' },
}
