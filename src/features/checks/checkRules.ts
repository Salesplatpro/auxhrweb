import type {
  ApplicationCheck,
  CheckConsent,
  CheckStatus,
  CheckType,
  OverallCheckStatus,
} from './types'

export const CHECK_TYPE_LABELS: Record<CheckType, string> = {
  identity: 'Identity',
  employment: 'Employment',
  education: 'Education',
  criminal: 'Criminal record',
}

const CHECK_TYPE_ORDER: CheckType[] = [
  'identity',
  'employment',
  'education',
  'criminal',
]

const CHECK_STATUS_LABELS: Record<CheckStatus, string> = {
  pending: 'Pending',
  passed: 'Passed',
  flagged: 'Flagged',
  failed: 'Failed',
}

export type OverallTone = 'success' | 'warning' | 'danger' | 'neutral'

const OVERALL_VIEWS: Record<
  OverallCheckStatus,
  { label: string; tone: OverallTone }
> = {
  failed: { label: 'Failed', tone: 'danger' },
  flagged: { label: 'Flagged', tone: 'warning' },
  pending: { label: 'Pending', tone: 'neutral' },
  verified: { label: 'Verified', tone: 'success' },
  none: { label: 'No checks yet', tone: 'neutral' },
}

const formatAgreedDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export const consentView = (consent: CheckConsent | null | undefined) =>
  consent?.consented && consent.agreedAt
    ? { given: true, label: `Agreed ${formatAgreedDay(consent.agreedAt)}` }
    : { given: false, label: 'Not agreed yet' }

export const orderBlockReason = (consent: CheckConsent | null | undefined) =>
  consent?.consented
    ? null
    : 'Ordering opens once the candidate agrees to background checks.'

export const checkStatusLabel = (status: CheckStatus | null) =>
  status ? CHECK_STATUS_LABELS[status] : 'Not ordered'

export const checkRows = (checks: ApplicationCheck[]) =>
  CHECK_TYPE_ORDER.map((type) => {
    const latest = checks
      .filter((check) => check.type === type)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    return { type, label: CHECK_TYPE_LABELS[type], check: latest ?? null }
  })

export const overallView = (status: OverallCheckStatus) => OVERALL_VIEWS[status]
