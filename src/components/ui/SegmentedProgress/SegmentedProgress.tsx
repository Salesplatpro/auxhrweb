import cn from 'classnames'
import React from 'react'

import styles from './SegmentedProgress.module.scss'

export type SegmentedProgressTone = 'brand' | 'success' | 'warning' | 'danger'

type SegmentedProgressProps = {
  total: number
  filled: number
  tone?: SegmentedProgressTone
  label: string
  className?: string
}

export const SegmentedProgress = ({
  total,
  filled,
  tone = 'brand',
  label,
  className,
}: SegmentedProgressProps) => (
  <div
    className={cn(styles.track, className)}
    role="progressbar"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={total}
    aria-valuenow={Math.min(filled, total)}>
    {Array.from({ length: total }, (_, index) => (
      <span
        key={index}
        className={cn(styles.segment, index < filled && styles[tone])}
      />
    ))}
  </div>
)
