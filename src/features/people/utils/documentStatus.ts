import type {
  DocumentDisplayStatus,
  DocumentTemplate,
  StaffDocument,
} from '../types'

export type DocumentTone = 'positive' | 'caution' | 'danger' | 'neutral'

export const DOCUMENT_STATUS: Record<
  DocumentDisplayStatus,
  { label: string; tone: DocumentTone }
> = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Sent', tone: 'caution' },
  signed: { label: 'Signed', tone: 'positive' },
  declined: { label: 'Declined', tone: 'danger' },
  to_notarize: { label: 'To notarize', tone: 'caution' },
  notarized: { label: 'Notarized', tone: 'positive' },
}

export const TONE_COLOURS: Record<
  DocumentTone,
  { backgroundColor: string; color: string }
> = {
  positive: {
    backgroundColor: 'var(--color-positive-tint)',
    color: 'var(--color-positive)',
  },
  caution: {
    backgroundColor: 'var(--color-caution-tint)',
    color: 'var(--color-caution-text)',
  },
  danger: {
    backgroundColor: 'var(--color-danger-tint)',
    color: 'var(--color-danger)',
  },
  neutral: {
    backgroundColor: 'var(--color-bg-subtle)',
    color: 'var(--color-text-muted)',
  },
}

export const DOCUMENT_TEMPLATES: { value: DocumentTemplate; label: string }[] =
  [
    { value: 'offer_letter', label: 'Offer letter' },
    { value: 'nda', label: 'Non-disclosure agreement' },
    { value: 'work_ownership', label: 'Work-ownership agreement' },
    { value: 'pay_agreement', label: 'Pay agreement' },
  ]

export const TEMPLATES_WITH_PAY: DocumentTemplate[] = [
  'offer_letter',
  'pay_agreement',
]

export type HistoryEvent = {
  key: 'sent' | 'opened' | 'signed' | 'declined'
  label: string
  at: string
  text: string
}

export const documentHistory = (
  document: StaffDocument,
  firstName: string,
  email: string,
): HistoryEvent[] => {
  const events: HistoryEvent[] = []
  if (document.sentAt) {
    events.push({
      key: 'sent',
      label: 'Sent',
      at: document.sentAt,
      text: `${document.sentByName ?? 'HR'} sent it to ${email}`,
    })
  }
  if (document.openedAt) {
    events.push({
      key: 'opened',
      label: 'Opened',
      at: document.openedAt,
      text: `${firstName} opened the link`,
    })
  }
  if (document.signedAt) {
    events.push({
      key: 'signed',
      label: 'Signed',
      at: document.signedAt,
      text: `${firstName} signed. A signed copy was emailed to both of you`,
    })
  }
  if (document.declinedAt) {
    events.push({
      key: 'declined',
      label: 'Declined',
      at: document.declinedAt,
      text: `${firstName} declined to sign`,
    })
  }
  return events.sort((a, b) => a.at.localeCompare(b.at))
}
