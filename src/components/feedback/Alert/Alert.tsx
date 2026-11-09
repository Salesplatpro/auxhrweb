import cn from 'classnames'
import React, { ReactNode } from 'react'

import styles from './Alert.module.scss'

type AlertVariant = 'success' | 'error' | 'info' | 'warning'

type AlertProps = {
  variant?: AlertVariant
  title?: ReactNode
  icon?: ReactNode
  children?: ReactNode
  className?: string
}

export const Alert = ({
  variant = 'info',
  title,
  icon,
  children,
  className,
}: AlertProps) => (
  <div role="alert" className={cn(styles.alert, styles[variant], className)}>
    {icon && (
      <span className={styles.icon} aria-hidden>
        {icon}
      </span>
    )}
    {title ? (
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        {children && <div>{children}</div>}
      </div>
    ) : (
      children
    )}
  </div>
)
