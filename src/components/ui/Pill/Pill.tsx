import cn from 'classnames'
import React, { ReactNode } from 'react'

import styles from './Pill.module.scss'

export type PillTone = 'brand' | 'neutral' | 'success' | 'warning' | 'violet'

type PillProps = {
  tone?: PillTone
  size?: 'sm' | 'md'
  icon?: ReactNode
  className?: string
  children: ReactNode
}

export const Pill = ({
  tone = 'brand',
  size = 'md',
  icon,
  className,
  children,
}: PillProps) => (
  <span className={cn(styles.pill, styles[tone], styles[size], className)}>
    {icon && (
      <span className={styles.icon} aria-hidden>
        {icon}
      </span>
    )}
    {children}
  </span>
)
