import { SupportStatus, SupportTopic } from './types'

export const SUPPORT_TOPICS: Array<{ value: SupportTopic; label: string }> = [
  { value: 'account', label: 'Account & profile' },
  { value: 'billing', label: 'Billing & plans' },
  { value: 'jobs', label: 'Jobs & hiring' },
  { value: 'applications', label: 'Applications' },
  { value: 'bug', label: "Something isn't working" },
  { value: 'idea', label: 'Idea' },
  { value: 'other', label: 'Other' },
]

export const topicLabel = (topic: SupportTopic | null): string =>
  SUPPORT_TOPICS.find((item) => item.value === topic)?.label ?? 'General'

export const SUPPORT_MESSAGE_MAX_LENGTH = 5000

export const SUPPORT_STATUS_STYLE: Record<
  SupportStatus,
  { label: string; backgroundColor: string; color: string; hint: string }
> = {
  unread: {
    label: 'Unread',
    backgroundColor: 'var(--color-info-tint)',
    color: 'var(--color-info)',
    hint: 'Not opened yet',
  },
  read: {
    label: 'Read',
    backgroundColor: 'var(--color-bg-subtle)',
    color: 'var(--color-text-muted)',
    hint: 'Opened, no reply yet',
  },
  unreplied: {
    label: 'Unreplied',
    backgroundColor: 'var(--color-danger-tint)',
    color: 'var(--color-danger)',
    hint: 'No reply for over 48 hours',
  },
  replied: {
    label: 'Replied',
    backgroundColor: 'var(--color-success-tint)',
    color: 'var(--color-success)',
    hint: 'Reply sent',
  },
}

/** Most urgent first, matching the server's status sort. */
export const SUPPORT_STATUS_RANK: Record<SupportStatus, number> = {
  unreplied: 0,
  unread: 1,
  read: 2,
  replied: 3,
}

export const SUPPORT_INBOX_KEY = '/feedback'
