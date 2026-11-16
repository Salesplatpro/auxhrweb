import cn from 'classnames'
import React from 'react'

import styles from './Candidates.module.scss'

const STRONG_MATCH = 80

export const CvMatch = ({ value }: { value?: number | null }) => {
  if (value == null) return <span className={styles.muted}>—</span>
  const score = Math.round(value)
  return (
    <span className={styles.cvMatch}>
      <span className={styles.cvValue}>{score}%</span>
      <span className={styles.cvTrack} aria-hidden>
        <span
          className={cn(
            styles.cvFill,
            score < STRONG_MATCH && styles.cvFillLow,
          )}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </span>
    </span>
  )
}
