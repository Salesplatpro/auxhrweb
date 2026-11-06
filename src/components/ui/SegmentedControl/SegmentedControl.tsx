import cn from 'classnames'
import React, { ReactNode } from 'react'

import styles from './SegmentedControl.module.scss'

export type SegmentedOption = {
  value: string
  label: string
  icon?: ReactNode
}

type SegmentedControlProps = {
  label: string
  options: SegmentedOption[]
  value: string[]
  onChange: (value: string[]) => void
  multiple?: boolean
  disabled?: boolean
}

export const SegmentedControl = ({
  label,
  options,
  value,
  onChange,
  multiple = false,
  disabled = false,
}: SegmentedControlProps) => {
  const toggle = (optionValue: string) => {
    if (!multiple) {
      onChange([optionValue])
      return
    }
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    )
  }

  return (
    <div className={styles.group} role="group" aria-label={label}>
      {options.map((option) => {
        const active = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            className={cn(styles.option, active && styles.active)}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => toggle(option.value)}>
            {option.icon && (
              <span className={styles.icon} aria-hidden>
                {option.icon}
              </span>
            )}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
