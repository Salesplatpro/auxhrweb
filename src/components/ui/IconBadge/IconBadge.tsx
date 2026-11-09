import cn from 'classnames'
import React, { ReactNode } from 'react'

import styles from './IconBadge.module.scss'

export type IconBadgeTone =
  | 'brand'
  | 'violet'
  | 'warning'
  | 'success'
  | 'danger'

type IconBadgeProps = {
  icon: ReactNode
  tone?: IconBadgeTone
  size?: 'md' | 'lg'
  className?: string
}

export const IconBadge = ({
  icon,
  tone = 'brand',
  size = 'md',
  className,
}: IconBadgeProps) => (
  <span
    className={cn(styles.badge, styles[tone], styles[size], className)}
    aria-hidden>
    {icon}
  </span>
)
