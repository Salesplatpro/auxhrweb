import cn from 'classnames'
import React, { ReactNode } from 'react'

import styles from './Timeline.module.scss'

export type TimelineTone = 'default' | 'success' | 'danger' | 'warning'

export type TimelineItem = {
  id: string
  title: ReactNode
  detail?: ReactNode
  time: string
  tone?: TimelineTone
  icon?: ReactNode
}

type TimelineProps = {
  items: TimelineItem[]
  ariaLabel?: string
}

export const Timeline = ({ items, ariaLabel = 'Timeline' }: TimelineProps) => (
  <ol className={styles.timeline} aria-label={ariaLabel}>
    {items.map((item) => (
      <li key={item.id} className={styles.item}>
        <span
          className={cn(styles.marker, styles[item.tone ?? 'default'])}
          aria-hidden>
          {item.icon}
        </span>
        <div className={styles.content}>
          <p className={styles.title}>{item.title}</p>
          {item.detail && <div className={styles.detail}>{item.detail}</div>}
          <time className={styles.time}>{item.time}</time>
        </div>
      </li>
    ))}
  </ol>
)
