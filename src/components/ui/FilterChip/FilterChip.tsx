import cn from 'classnames'
import React, { ReactNode } from 'react'

import styles from './FilterChip.module.scss'

type FilterChipProps = {
  active: boolean
  onClick: () => void
  children: ReactNode
}

export const FilterChip = ({ active, onClick, children }: FilterChipProps) => (
  <button
    type="button"
    aria-pressed={active}
    className={cn(styles.chip, active && styles.active)}
    onClick={onClick}>
    {children}
  </button>
)
