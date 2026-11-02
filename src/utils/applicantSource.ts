const MAX_LENGTH = 50
const storageKey = (jobId: string) => `auxhr:applicant-source:${jobId}`

export const readApplicantSource = (search: string): string | null => {
  const params = new URLSearchParams(search)
  const raw = params.get('source') ?? params.get('utm_source') ?? ''
  const value = raw.trim().toLowerCase()
  if (!value || value.length > MAX_LENGTH) return null
  return value
}

export const rememberApplicantSource = (jobId: string, search: string) => {
  const source = readApplicantSource(search)
  if (!source) return
  try {
    localStorage.setItem(storageKey(jobId), source)
  } catch {
    return
  }
}

export const recallApplicantSource = (jobId: string): string | null => {
  try {
    return localStorage.getItem(storageKey(jobId))
  } catch {
    return null
  }
}

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  linkedin: 'LinkedIn',
  x: 'X',
  facebook: 'Facebook',
  indeed: 'Indeed',
}

export const applicantSourceLabel = (source?: string | null): string =>
  source ? SOURCE_LABELS[source] ?? source : '—'

export type ApplicantSourceFilter = 'all' | 'none' | string

export const matchesApplicantSource = (
  source: string | null | undefined,
  filter: ApplicantSourceFilter,
): boolean => {
  if (filter === 'all') return true
  if (filter === 'none') return !source
  return source === filter
}

export const APPLICANT_SOURCE_FILTER_OPTIONS = [
  { label: 'All Sources', value: 'all' },
  ...Object.entries(SOURCE_LABELS).map(([value, label]) => ({ label, value })),
  { label: 'No Source', value: 'none' },
]
