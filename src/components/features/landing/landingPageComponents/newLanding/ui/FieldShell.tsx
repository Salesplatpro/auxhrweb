import React, { ReactNode } from 'react'

import styles from './FormField.module.scss'

type FieldShellProps = {
  id: string
  label: string
  error?: string
  children: ReactNode
}

export const FieldShell = ({ id, label, error, children }: FieldShellProps) => (
  <div className={styles.field}>
    <label htmlFor={id} className={styles.label}>
      {label}
    </label>
    {children}
    {error && (
      <span id={`${id}-error`} className={styles.error} role="alert">
        {error}
      </span>
    )}
  </div>
)
