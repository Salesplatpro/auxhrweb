import cn from 'classnames'
import React, { useId } from 'react'

import styles from './Switch.module.scss'

type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  /** Hides the visible label but keeps it for screen readers. */
  hideLabel?: boolean
  disabled?: boolean
  className?: string
}

export const Switch = ({
  checked,
  onChange,
  label,
  hideLabel = false,
  disabled = false,
  className,
}: SwitchProps) => {
  const labelId = useId()

  return (
    <div className={cn(styles.row, className)}>
      <span id={labelId} className={hideLabel ? styles.srOnly : styles.label}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        className={cn(styles.track, checked && styles.on)}
        onClick={() => onChange(!checked)}>
        <span className={styles.thumb} />
      </button>
    </div>
  )
}
