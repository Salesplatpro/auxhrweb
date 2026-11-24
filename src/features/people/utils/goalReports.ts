import { GoalReportPeriod, ReportFrequency } from '../types'
import { formatDateOnly } from './formatDate'

export const FREQUENCY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Not needed' },
  { value: 'daily', label: 'Daily (Mon–Fri)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const FREQUENCY_WORD: Record<ReportFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

export const frequencyWord = (frequency: ReportFrequency) =>
  FREQUENCY_WORD[frequency]

/** "24 Nov 2026", "Week of 23 Nov 2026" or "Nov 2026". */
export const periodLabel = (
  frequency: ReportFrequency,
  periodStart: string,
) => {
  if (frequency === 'weekly') return `Week of ${formatDateOnly(periodStart)}`
  if (frequency === 'monthly') {
    return formatDateOnly(periodStart).split(' ').slice(1).join(' ')
  }
  return formatDateOnly(periodStart)
}

export const STATE_LABEL: Record<GoalReportPeriod['state'], string> = {
  submitted: 'Sent',
  missed: 'Missed',
  open: 'Open',
}
