import React from 'react'

import { StatusBadge } from '@/components/ui/Badge/StatusBadge'

import { StaffStatus } from '../types'

const STATUS_STYLE: Record<
  StaffStatus,
  { label: string; backgroundColor: string; color: string }
> = {
  active: {
    label: 'Active',
    backgroundColor: 'var(--color-success-tint)',
    color: 'var(--color-success)',
  },
  invited: {
    label: 'Invited',
    backgroundColor: 'var(--color-info-tint)',
    color: 'var(--color-info)',
  },
  ended: {
    label: 'Ended',
    backgroundColor: 'var(--color-bg-subtle)',
    color: 'var(--color-text-muted)',
  },
}

export const StaffStatusBadge = ({ status }: { status: StaffStatus }) => {
  const { label, backgroundColor, color } = STATUS_STYLE[status]
  return (
    <StatusBadge
      status={label}
      backgroundColor={backgroundColor}
      color={color}
      showDot
    />
  )
}
