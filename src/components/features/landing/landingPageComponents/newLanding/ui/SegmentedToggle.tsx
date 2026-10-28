import React, { ReactNode } from 'react'

import styles from './SegmentedToggle.module.scss'

export type SegmentedOption<T extends string> = { value: T; label: ReactNode }

type SegmentedToggleProps<T extends string> = {
  label: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export const SegmentedToggle = <T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedToggleProps<T>) => (
  <div
    className={[styles.toggle, className ?? ''].join(' ')}
    role="tablist"
    aria-label={label}>
    {options.map((option) => {
      const isActive = option.value === value
      return (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={[styles.option, isActive ? styles.active : ''].join(' ')}
          onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      )
    })}
  </div>
)
