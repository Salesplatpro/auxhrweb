import React from 'react'
import { HiOutlineExclamationTriangle } from 'react-icons/hi2'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export const CardError = ({ onRetry }: { onRetry: () => void }) => (
  <EmptyState
    icon={<HiOutlineExclamationTriangle size={24} />}
    title="We couldn't load this"
    description="Check your connection and try again."
    action={
      <Button size="sm" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    }
  />
)
