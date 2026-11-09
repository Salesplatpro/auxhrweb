import cn from 'classnames'
import React from 'react'

import {
  SegmentedProgress,
  SegmentedProgressTone,
} from '@/components/ui/SegmentedProgress'
import {
  PASSWORD_SYMBOLS,
  passwordStrength,
  PasswordStrengthLevel,
} from '@/utils/passwordRules'

import styles from './PasswordStrength.module.scss'

const COPY: Record<
  Exclude<PasswordStrengthLevel, 'empty'>,
  { label: string; tone: SegmentedProgressTone }
> = {
  invalid: {
    label: `Use only letters, numbers and ${PASSWORD_SYMBOLS}`,
    tone: 'danger',
  },
  weak: { label: 'Weak password', tone: 'danger' },
  fair: { label: 'Almost there', tone: 'warning' },
  strong: { label: 'Strong password', tone: 'success' },
  veryStrong: { label: 'Very strong password', tone: 'success' },
}

export const PasswordStrength = ({ value }: { value: string }) => {
  const { level, filled } = passwordStrength(value)
  if (level === 'empty') return null
  const { label, tone } = COPY[level]

  return (
    <div className={styles.strength}>
      <SegmentedProgress
        total={4}
        filled={filled}
        tone={tone}
        label="Password strength"
      />
      <span className={cn(styles.label, styles[tone])} aria-live="polite">
        {label}
      </span>
    </div>
  )
}
