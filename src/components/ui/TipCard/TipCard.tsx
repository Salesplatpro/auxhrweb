import cn from 'classnames'
import React, { ReactNode } from 'react'

import styles from './TipCard.module.scss'

type TipCardProps = {
  icon?: ReactNode
  title?: string
  variant?: 'solid' | 'glass'
  className?: string
  children: ReactNode
}

export const TipCard = ({
  icon,
  title,
  variant = 'solid',
  className,
  children,
}: TipCardProps) => (
  <aside className={cn(styles.card, styles[variant], className)}>
    {icon && (
      <span className={styles.icon} aria-hidden>
        {icon}
      </span>
    )}
    <div className={styles.body}>
      {title && <p className={styles.title}>{title}</p>}
      <div className={styles.content}>{children}</div>
    </div>
  </aside>
)
