import cn from 'classnames'
import React from 'react'

import { CandidateStatus } from '../types'
import styles from './StatusBadge.module.scss'

export const CANDIDATE_STATUS_LABEL: Record<CandidateStatus, string> = {
  interview_to_do: 'Interview to do',
  test_to_take: 'Test to take',
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  applied: 'Applied',
  not_proceeding: 'Not proceeding',
}

export const StatusBadge = ({
  status,
  label,
}: {
  status: CandidateStatus
  label?: string
}) => (
  <span className={cn(styles.badge, styles[status])}>
    {label ?? CANDIDATE_STATUS_LABEL[status]}
  </span>
)
