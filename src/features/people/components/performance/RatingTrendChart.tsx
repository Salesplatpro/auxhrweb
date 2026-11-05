import React from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'

import { MonthlyFeedback } from '../../types'
import { RatingPoint, ratingSeries } from '../../utils/ratingSeries'
import styles from './Performance.module.scss'

const MAX_TOOLTIP_NOTES = 200

const shorten = (notes: string) =>
  notes.length > MAX_TOOLTIP_NOTES
    ? `${notes.slice(0, MAX_TOOLTIP_NOTES)}…`
    : notes

const renderTooltip = ({ active, payload }: TooltipContentProps) => {
  const point = payload?.[0]?.payload as RatingPoint | undefined
  if (!active || !point || point.rating === null) return null
  return (
    <div className={styles.tooltip}>
      <strong>
        {point.month}: {point.rating} / 5
      </strong>
      {point.notes && <p className={styles.body}>{shorten(point.notes)}</p>}
    </div>
  )
}

export const RatingTrendChart: React.FC<{ feedback: MonthlyFeedback[] }> = ({
  feedback,
}) => (
  <div
    className={styles.chart}
    role="img"
    aria-label={`Monthly ratings: ${feedback
      .map((row) => `${row.month} ${row.rating} out of 5`)
      .join(', ')}`}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={ratingSeries(feedback)}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
        />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          allowDecimals={false}
          width={24}
          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
        />
        <Tooltip content={renderTooltip} />
        <Line
          dataKey="rating"
          stroke="var(--color-brand-500)"
          strokeWidth={2}
          connectNulls={false}
          dot={{ r: 4 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
)
