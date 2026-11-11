const CURRENCY_SIGN: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
}

const sign = (currency?: string | null) =>
  currency ? CURRENCY_SIGN[currency] ?? `${currency} ` : ''

export const formatAmount = (
  currency: string | null | undefined,
  amount: number,
) => `${sign(currency)}${Math.round(amount).toLocaleString('en-NG')}`

/** ₦300k, ₦1.3M */
export const formatShortAmount = (
  currency: string | null | undefined,
  amount: number,
) => {
  const abs = Math.abs(amount)
  const [value, suffix] =
    abs >= 1_000_000
      ? [amount / 1_000_000, 'M']
      : abs >= 1_000
      ? [amount / 1_000, 'k']
      : [amount, '']
  return `${sign(currency)}${Number(value.toFixed(1)).toLocaleString(
    'en-NG',
  )}${suffix}`
}

type SalaryFields = {
  currency?: string | null
  minSalary?: number | string | null
  maxSalary?: number | string | null
}

const toNumber = (value: number | string | null | undefined) => {
  if (value === '' || value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const salaryBounds = ({ minSalary, maxSalary }: SalaryFields) => ({
  min: toNumber(minSalary),
  max: toNumber(maxSalary),
})

/** "₦300,000 – ₦380,000", or the short form "₦300k – ₦380k". */
export const formatSalaryRange = (
  job: SalaryFields,
  { short = false, divideBy = 1 }: { short?: boolean; divideBy?: number } = {},
): string | null => {
  const { min, max } = salaryBounds(job)
  const format = short ? formatShortAmount : formatAmount
  const amounts = [min, max]
    .filter((amount): amount is number => amount != null)
    .map((amount) => format(job.currency, amount / divideBy))
  return amounts.length ? amounts.join(' – ') : null
}

/** A yearly salary shown per month is divided by 12. */
export const monthlyDivisor = (period?: string | null) =>
  period === 'yearly' ? 12 : 1

export const PERIOD_WORD: Record<string, string> = {
  monthly: 'month',
  yearly: 'year',
}
