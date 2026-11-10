import React from 'react'

import { Text } from '@/components/ui/Typography'

import { shareOf } from '../../utils/recruiterDashboard'
import styles from './FunnelList.module.scss'

type FunnelStep = { key: string; label: string; value: number }

export const FunnelList = ({ steps }: { steps: FunnelStep[] }) => {
  const base = steps[0]?.value ?? 0

  return (
    <ul className={styles.list} aria-label="Hiring funnel">
      {steps.map((step) => {
        const share = shareOf(step.value, base)
        return (
          <li key={step.key} className={styles.row}>
            <Text as="span" size="fs-md" className={styles.label}>
              {step.label}
            </Text>
            <span className={styles.track} aria-hidden>
              <span className={styles.fill} style={{ width: `${share}%` }} />
            </span>
            <Text
              as="span"
              size="fs-md"
              weight="bolder"
              className={styles.value}>
              {step.value.toLocaleString('en-US')}
            </Text>
            <Text as="span" size="fs-sm" color="muted" className={styles.value}>
              {share}%
            </Text>
          </li>
        )
      })}
    </ul>
  )
}
