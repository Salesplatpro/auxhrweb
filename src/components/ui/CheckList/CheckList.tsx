import cn from 'classnames'
import React, { ReactNode } from 'react'
import { LuCheck } from 'react-icons/lu'

import styles from './CheckList.module.scss'

export type CheckListItem = {
  label: ReactNode
  value?: ReactNode
  done?: boolean
}

type CheckListProps = {
  items: CheckListItem[]
  variant?: 'rules' | 'summary' | 'inline'
  className?: string
}

export const CheckList = ({
  items,
  variant = 'rules',
  className,
}: CheckListProps) => (
  <ul className={cn(styles.list, styles[variant], className)}>
    {items.map((item, index) => {
      const done = item.done ?? true
      return (
        <li key={index} className={cn(styles.item, done && styles.done)}>
          <span className={styles.mark} aria-hidden>
            <LuCheck />
          </span>
          <span className={styles.label}>{item.label}</span>
          {item.value !== undefined && (
            <span className={styles.value}>{item.value}</span>
          )}
          {variant === 'rules' && (
            <span className={styles.srOnly}>{done ? 'met' : 'not met'}</span>
          )}
        </li>
      )
    })}
  </ul>
)
