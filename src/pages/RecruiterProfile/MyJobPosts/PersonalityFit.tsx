import React, { useState } from 'react'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'

import styles from './PersonalityFit.module.scss'

export type PersonalityFitApplication = {
  mbtiType?: string | null
  personalityFitScore?: number | null
  personalityFitReason?: string | null
  personalityFitPending?: boolean
}

/**
 * Day 6: the AI's view of how the candidate's personality type fits this job,
 * shown under the personality card. Nothing until the personality check has run.
 * If the AI couldn't work it out, the recruiter can ask again.
 */
export const PersonalityFit = ({
  application,
  onRetry,
}: {
  application: PersonalityFitApplication
  onRetry?: () => Promise<void>
}) => {
  const [retrying, setRetrying] = useState(false)
  const {
    mbtiType,
    personalityFitScore,
    personalityFitReason,
    personalityFitPending,
  } = application

  if (personalityFitScore != null) {
    return (
      <PagePanel
        title="Personality fit"
        hint={<strong>{Math.round(personalityFitScore)}%</strong>}>
        {personalityFitReason ? <p>{personalityFitReason}</p> : null}
      </PagePanel>
    )
  }

  if (!mbtiType) return null

  if (personalityFitPending) {
    return (
      <PagePanel title="Personality fit">
        <p className={styles.note}>Working out the fit…</p>
      </PagePanel>
    )
  }

  const handleRetry = async () => {
    if (!onRetry) return
    setRetrying(true)
    try {
      await onRetry()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <PagePanel title="Personality fit">
      <div className={styles.missing}>
        <p className={styles.note}>The fit hasn&apos;t been worked out yet.</p>
        {onRetry ? (
          <Button
            variant="outline"
            size="sm"
            loading={retrying}
            disabled={retrying}
            onClick={() => void handleRetry()}>
            Retry
          </Button>
        ) : null}
      </div>
    </PagePanel>
  )
}
