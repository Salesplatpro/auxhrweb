import * as Yup from 'yup'

import type {
  ApplicationCheck,
  CheckEventKind,
  CheckStatus,
  CheckType,
  ConsentState,
  OpenCheck,
  OverallStatus,
} from './types'

export const CHECK_ROWS: {
  type: CheckType
  title: string
  description: string
}[] = [
  {
    type: 'identity',
    title: 'Identity',
    description: 'Name on ID against the name given',
  },
  {
    type: 'employment',
    title: 'Employment',
    description: 'Past jobs on the CV',
  },
  {
    type: 'education',
    title: 'Education',
    description: 'Degrees on the CV',
  },
  {
    type: 'criminal',
    title: 'Criminal',
    description: 'Criminal record check',
  },
]

export type BadgeTone = 'positive' | 'caution' | 'danger' | 'neutral'

export const STATUS_LABEL: Record<CheckStatus, string> = {
  pending: 'Pending',
  passed: 'Verified',
  flagged: 'Flagged',
  failed: 'Failed',
}

export const STATUS_TONE: Record<CheckStatus, BadgeTone> = {
  pending: 'caution',
  passed: 'positive',
  flagged: 'caution',
  failed: 'danger',
}

export const OVERALL_LABEL: Record<OverallStatus, string> = {
  none: 'Not ordered',
  pending: 'Pending',
  flagged: 'Flagged',
  failed: 'Failed',
  verified: 'Verified',
}

export const OVERALL_TONE: Record<OverallStatus, BadgeTone> = {
  none: 'neutral',
  pending: 'caution',
  flagged: 'caution',
  failed: 'danger',
  verified: 'positive',
}

export const OVERALL_MEANING: Record<OverallStatus, string> = {
  none: 'No check has been ordered yet.',
  pending: 'Some checks are still waiting for a result.',
  flagged: 'At least one check needs a closer look.',
  failed: 'At least one check failed.',
  verified: 'Every ordered check passed.',
}

export const TONE_COLOURS: Record<
  BadgeTone,
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

export const canOrder = (consent: ConsentState) => consent === 'agreed'

export const isOpen = (check: ApplicationCheck): check is OpenCheck =>
  !check.restricted

export const allRestricted = (checks: ApplicationCheck[]) =>
  checks.length > 0 && checks.every((check) => check.restricted)

export const RESULT_OPTIONS = [
  { value: 'verified', label: 'Verified' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'failed', label: 'Failed' },
]

export type ResultFormValues = {
  confirmedBy: string
  confirmedOn: string
  result: string
  nameOnId: string
  note: string
}

export const todayIso = () => new Date().toISOString().slice(0, 10)

export const emptyResult = (): ResultFormValues => ({
  confirmedBy: '',
  confirmedOn: todayIso(),
  result: '',
  nameOnId: '',
  note: '',
})

export const resultSchema = (type: CheckType) =>
  Yup.object({
    confirmedOn: Yup.string()
      .required('Choose the date')
      .test(
        'not-future',
        'The date cannot be in the future',
        (value) => !value || value <= todayIso(),
      ),
    note: Yup.string().max(2000, 'Keep the note under 2000 characters'),
    ...(type === 'identity'
      ? { nameOnId: Yup.string().trim().required('Enter the name on the ID') }
      : {
          confirmedBy: Yup.string().trim().required('Say who confirmed it'),
          result: Yup.string()
            .oneOf(['verified', 'flagged', 'failed'], 'Choose a result')
            .required('Choose a result'),
        }),
  })

export const resultPayload = (type: CheckType, values: ResultFormValues) => ({
  confirmedOn: values.confirmedOn,
  ...(values.note.trim() ? { note: values.note.trim() } : {}),
  ...(type === 'identity'
    ? { nameOnId: values.nameOnId.trim() }
    : {
        confirmedBy: values.confirmedBy.trim(),
        result: values.result as 'verified' | 'flagged' | 'failed',
      }),
})

export const EVENT_LABEL: Record<CheckEventKind, string> = {
  ordered: 'Ordered',
  result_saved: 'Result saved',
  viewed: 'Viewed',
  id_number_viewed: 'Viewed the ID number',
}

export const eventTitle = (kind: CheckEventKind, detail: string | null) => {
  if (kind === 'result_saved' && detail) {
    const label = STATUS_LABEL[detail as CheckStatus]
    return label ? `Result saved: ${label}` : EVENT_LABEL[kind]
  }
  return EVENT_LABEL[kind]
}
