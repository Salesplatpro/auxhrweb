import React from 'react'

import { Button } from '@/components/ui/Button'
import { DisplayError } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'

import styles from './OnboardingDoneState.module.scss'

type OnboardingDoneStateProps = {
  isLoading: boolean
  error?: unknown
  onRetry: () => void
}

export const OnboardingDoneState = ({
  isLoading,
  error,
  onRetry,
}: OnboardingDoneStateProps) => {
  if (isLoading) return <Spinner fullPage />
  if (!error) return null
  return (
    <div className={styles.error}>
      <DisplayError message="We couldn't load your account. Check your connection and try again." />
      <Button type="button" variant="ink" pill size="xl" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
