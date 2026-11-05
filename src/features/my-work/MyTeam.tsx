import React, { useState } from 'react'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button, EmptyState } from '@/components/ui'
import { Spinner } from '@/components/ui/Spinner'
import { PerformanceCards } from '@/features/people/components/performance/PerformanceCards'
import { useMyTeam } from '@/features/people/hooks/usePerformance'
import { teamPerformanceBase } from '@/features/people/services/peopleService'
import { TeamMember } from '@/features/people/types'
import { formatDateOnly } from '@/features/people/utils/formatDate'

import styles from './MyWork.module.scss'

export const MyTeam: React.FC<{ managerStaffId: string }> = ({
  managerStaffId,
}) => {
  const { team, isLoading, hasError } = useMyTeam(managerStaffId)
  const [open, setOpen] = useState<TeamMember | null>(null)

  if (isLoading) return <Spinner />
  if (hasError || !team) {
    return (
      <EmptyState
        title="Couldn't load your team"
        description="Something went wrong on our side. Refresh the page to try again."
      />
    )
  }

  if (open) {
    return (
      <div className={styles.stack}>
        <div>
          <Button size="sm" variant="outline" onClick={() => setOpen(null)}>
            ← My team
          </Button>
        </div>
        <h3>{open.fullName}</h3>
        <PerformanceCards
          base={teamPerformanceBase(managerStaffId, open.staffId)}
          readOnly={false}
          showTasks
        />
      </div>
    )
  }

  return (
    <PagePanel
      title="This week"
      hint={`Week of ${formatDateOnly(team.weekStart)}`}>
      {team.members.length === 0 ? (
        <p className={styles.muted}>Nobody reports to you right now.</p>
      ) : (
        <ul className={styles.list}>
          {team.members.map((member) => (
            <li key={member.staffId}>
              <span>
                <strong>{member.fullName}</strong>
                <span className={styles.muted}>
                  {member.jobTitle} ·{' '}
                  {member.reportId ? 'Submitted' : 'Not yet'}
                  {member.goalsWaiting > 0 &&
                    ` · ${member.goalsWaiting} goals waiting for approval`}
                </span>
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpen(member)}>
                Open
              </Button>
            </li>
          ))}
        </ul>
      )}
    </PagePanel>
  )
}
