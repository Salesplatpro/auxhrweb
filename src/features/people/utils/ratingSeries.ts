import { MonthlyFeedback } from '../types'

export interface RatingPoint {
  month: string
  rating: number | null
  notes: string
}

const nextMonth = (month: string) => {
  const [year, number] = month.split('-').map(Number) as [number, number]
  return number === 12
    ? `${year + 1}-01`
    : `${year}-${String(number + 1).padStart(2, '0')}`
}

/** Fills in skipped months with no rating, so the line shows a gap instead of joining across them. */
export const ratingSeries = (feedback: MonthlyFeedback[]): RatingPoint[] => {
  const first = feedback[0]
  const last = feedback[feedback.length - 1]
  if (!first || !last) return []
  const byMonth = new Map(feedback.map((row) => [row.month, row]))
  const points: RatingPoint[] = []
  for (let month = first.month; month <= last.month; month = nextMonth(month)) {
    const row = byMonth.get(month)
    points.push({
      month,
      rating: row?.rating ?? null,
      notes: row?.notes ?? '',
    })
  }
  return points
}
