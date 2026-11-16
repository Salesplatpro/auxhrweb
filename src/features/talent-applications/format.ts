export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')

const CURRENCY_SYMBOL: Record<string, string> = { NGN: '₦', USD: '$' }

export const currencySymbol = (currency?: string | null) =>
  currency ? CURRENCY_SYMBOL[currency.toUpperCase()] ?? `${currency} ` : ''

const compactAmount = (amount: number) => {
  if (amount >= 1_000_000) return `${+(amount / 1_000_000).toFixed(1)}m`
  if (amount >= 1_000) return `${+(amount / 1_000).toFixed(1)}k`
  return String(amount)
}

const PERIOD: Record<string, string> = { monthly: 'month', yearly: 'year' }

interface PayFields {
  currency?: string | null
  minSalary?: number | null
  maxSalary?: number | null
  compensationPeriod?: string | null
}

const payRange = (
  { currency, minSalary, maxSalary }: PayFields,
  amount: (value: number) => string,
  separator: string,
) => {
  const symbol = currencySymbol(currency)
  const values = [minSalary, maxSalary].filter(
    (value, index, all): value is number =>
      value != null && all.indexOf(value) === index,
  )
  return values.map((value) => `${symbol}${amount(value)}`).join(separator)
}

export const formatPayShort = (job: PayFields): string | null => {
  if (job.minSalary == null && job.maxSalary == null) return null
  const period = job.compensationPeriod ? PERIOD[job.compensationPeriod] : null
  const range = payRange(job, compactAmount, '–')
  return period ? `${range} / ${period}` : range
}

export const formatPayFull = (job: PayFields): string | null =>
  job.minSalary == null && job.maxSalary == null
    ? null
    : payRange(job, (value) => value.toLocaleString('en-NG'), ' – ')

export const periodLabel = (period?: string | null) =>
  period ? PERIOD[period] : null

export const formatAmountShort = (
  currency: string | null | undefined,
  amount: number,
) => `${currencySymbol(currency)}${compactAmount(amount)}`

const EXPERIENCE: Record<string, { label: string; years: string }> = {
  '1-3 years': { label: 'Entry-level', years: '1–3 years' },
  '4-6 years': { label: 'Mid-level', years: '4–6 years' },
  '7-10 years': { label: 'Senior', years: '7–10 years' },
  '11-15 years': { label: 'Lead', years: '11–15 years' },
  '16 years and above': { label: 'Executive', years: '16+ years' },
}

export const MID_LEVEL = '4-6 years'

export const experienceLabel = (level?: string | null) =>
  level ? EXPERIENCE[level]?.label ?? level : null

export const experienceLabelWithYears = (level?: string | null) => {
  if (!level) return null
  const entry = EXPERIENCE[level]
  return entry ? `${entry.label} (${entry.years})` : level
}

const WORK_MODE: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onSite: 'On-site',
}

export const workModeLabel = (modes?: string[] | null) =>
  modes?.length
    ? modes.map((mode) => WORK_MODE[mode] ?? mode).join(' · ')
    : null

export const jobPlace = (job: {
  locationCity?: string | null
  locationState?: string | null
  locationCountry?: string | null
}) => {
  const parts = [job.locationCity, job.locationState].filter(Boolean)
  return parts.length ? parts.join(', ') : job.locationCountry ?? null
}

export const dayMonth = (date: string) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export const weekdayDayMonth = (date: string) =>
  new Date(date)
    .toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    .replace(',', '')
