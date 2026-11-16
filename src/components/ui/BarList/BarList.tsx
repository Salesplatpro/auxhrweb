import React from 'react'
import { Link } from 'react-router-dom'

import styles from './BarList.module.scss'

export interface BarListItem {
  key: string
  label: string
  value: number
  href?: string
}

type BarListProps = {
  items: BarListItem[]
  ariaLabel: string
  emptyLabel?: string
  /** What each bar is a share of, when it isn't the sum of the items (e.g. a funnel). */
  of?: number
  /** `share`: show only the percentage, for items that are already percentages. */
  valueDisplay?: 'count' | 'share'
}

export const BarList = ({
  items,
  ariaLabel,
  emptyLabel = 'No data yet',
  of,
  valueDisplay = 'count',
}: BarListProps) => {
  const max = Math.max(0, ...items.map((item) => item.value))
  const sum = items.reduce((total, item) => total + item.value, 0)
  const total = of ?? sum
  const scale = of ?? max

  if (sum === 0 || total === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>
  }

  return (
    <ul className={styles.list} aria-label={ariaLabel}>
      {items.map((item) => {
        const width = scale > 0 ? Math.max((item.value / scale) * 100, 0) : 0
        const share = Math.round((item.value / total) * 100)
        const row = (
          <>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.value}>
              {valueDisplay === 'share' ? (
                `${share}%`
              ) : (
                <>
                  {item.value.toLocaleString('en-US')}
                  <span className={styles.share}>{share}%</span>
                </>
              )}
            </span>
            <span className={styles.track} aria-hidden>
              <span className={styles.fill} style={{ width: `${width}%` }} />
            </span>
          </>
        )
        return (
          <li key={item.key}>
            {item.href ? (
              <Link to={item.href} className={styles.row}>
                {row}
              </Link>
            ) : (
              <div className={styles.row}>{row}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
