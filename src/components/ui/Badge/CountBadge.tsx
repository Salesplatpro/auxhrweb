import React from 'react'

import styles from './countBadge.module.scss'

export const COUNT_BADGE_MAX = 99

export const CountBadge = ({ item }: { item: number | undefined }) => {
  if (!item || item < 1) return null

  return (
    <span className={styles.countBadge}>
      {item > COUNT_BADGE_MAX ? `${COUNT_BADGE_MAX}+` : item}
    </span>
  )
}
