import React from 'react'

import { StatusBadge } from '@/components/ui/Badge/StatusBadge'

import { SUPPORT_STATUS_STYLE } from '../constants'
import { SupportStatus } from '../types'
import styles from './SupportStatusBadge.module.scss'

export const SupportStatusBadge = ({ status }: { status: SupportStatus }) => {
  const { label, hint, backgroundColor, color } = SUPPORT_STATUS_STYLE[status]
  return (
    <div className={styles.badge} title={hint}>
      <StatusBadge
        status={label}
        backgroundColor={backgroundColor}
        color={color}
        showDot
      />
    </div>
  )
}
