import React from 'react'
import { Link } from 'react-router-dom'

import { Text } from '@/components/ui/Typography'

import styles from './SidebarPromoCard.module.scss'

type SidebarPromoCardProps = {
  title: string
  body: string
  actionLabel: string
  actionTo: string
  progress?: number
  onAction?: () => void
}

export const SidebarPromoCard = ({
  title,
  body,
  actionLabel,
  actionTo,
  progress,
  onAction,
}: SidebarPromoCardProps) => (
  <div className={styles.card}>
    <Text as="p" size="fs-lg" weight="bolder" color="white">
      {title}
    </Text>
    <Text as="p" size="fs-sm" color="white" className={styles.body}>
      {body}
    </Text>
    {progress !== undefined && (
      <div
        className={styles.track}
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(Math.max(progress, 0), 100))}>
        <span
          className={styles.fill}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    )}
    <div className={styles.actionRow} onClick={onAction}>
      <Link to={actionTo} className={styles.action}>
        {actionLabel}
      </Link>
    </div>
  </div>
)
