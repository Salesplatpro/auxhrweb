import cn from 'classnames'
import React, { ReactNode } from 'react'

import { CheckList } from '../CheckList'
import styles from './ChoiceCard.module.scss'

type ChoiceCardProps = {
  name: string
  value: string
  checked: boolean
  onSelect: (value: string) => void
  icon: ReactNode
  title: string
  badge?: ReactNode
  description: string
  features: string[]
}

export const ChoiceCard = ({
  name,
  value,
  checked,
  onSelect,
  icon,
  title,
  badge,
  description,
  features,
}: ChoiceCardProps) => (
  <label className={cn(styles.card, checked && styles.checked)}>
    <input
      type="radio"
      className={styles.input}
      name={name}
      value={value}
      checked={checked}
      onChange={() => onSelect(value)}
    />
    <span className={styles.icon} aria-hidden>
      {icon}
    </span>
    <span className={styles.body}>
      <span className={styles.titleRow}>
        <span className={styles.title}>{title}</span>
        {badge}
      </span>
      <span className={styles.description}>{description}</span>
      <CheckList
        variant="inline"
        items={features.map((label) => ({ label }))}
        className={styles.features}
      />
    </span>
    <span className={styles.radio} aria-hidden />
  </label>
)
