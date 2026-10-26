import React from 'react'

import { PagePanel } from '@/components/layout/PagePanel'

export type PersonalityFitApplication = {
  personalityFitScore?: number | null
  personalityFitReason?: string | null
}

/**
 * Day 6: the AI's view of how the candidate's personality type fits this job,
 * shown under the personality card. Nothing until the personality check has run.
 */
export const PersonalityFit = ({
  application,
}: {
  application: PersonalityFitApplication
}) => {
  const { personalityFitScore, personalityFitReason } = application
  if (personalityFitScore == null) return null

  return (
    <PagePanel
      title="Personality fit"
      hint={<strong>{Math.round(personalityFitScore)}%</strong>}>
      {personalityFitReason ? <p>{personalityFitReason}</p> : null}
    </PagePanel>
  )
}
