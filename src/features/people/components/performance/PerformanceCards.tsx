import React from 'react'

import { EmptyState } from '@/components/ui'
import { Spinner } from '@/components/ui/Spinner'

import { usePerformance } from '../../hooks/usePerformance'
import { CompletionRequestsCard } from './CompletionRequestsCard'
import { DevelopmentCard } from './DevelopmentCard'
import { EfficiencyCard } from './EfficiencyCard'
import { FeedbackCard } from './FeedbackCard'
import { GoalsCard } from './GoalsCard'
import { JobDescriptionCard } from './JobDescriptionCard'
import styles from './Performance.module.scss'
import { ReportsCard } from './ReportsCard'
import { TeamTasksCard } from './TeamTasksCard'

interface PerformanceCardsProps {
  base: string
  readOnly: boolean
  hr?: { organizationId: string; staffId: string }
  /** Reviewing completion needs less than editing, so an assigned HR can do it while read-only. */
  canReview?: boolean
  /** A manager has no Checklist tab, so their person's tasks appear here. */
  showTasks?: boolean
}

/** One screen for HR and managers. Which right applies comes from `base`, and the server checks it. */
export const PerformanceCards: React.FC<PerformanceCardsProps> = ({
  base,
  readOnly,
  hr,
  canReview = !readOnly,
  showTasks = false,
}) => {
  const { performance, isLoading, hasError } = usePerformance(base)

  if (isLoading) return <Spinner />
  if (hasError || !performance) {
    return (
      <EmptyState
        title="Couldn't load performance"
        description="This person may no longer be on your team, or something went wrong. Refresh the page to try again."
      />
    )
  }

  const props = { base, performance, readOnly }
  return (
    <div className={styles.stack}>
      {canReview && (
        <CompletionRequestsCard base={base} performance={performance} />
      )}
      <EfficiencyCard {...props} />
      <JobDescriptionCard {...props} hr={hr} />
      <GoalsCard {...props} canReview={canReview} />
      {showTasks && <TeamTasksCard base={base} />}
      <ReportsCard {...props} />
      <DevelopmentCard {...props} />
      <FeedbackCard {...props} />
    </div>
  )
}
