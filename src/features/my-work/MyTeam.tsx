import React, { useState } from 'react'
import { LuUsers } from 'react-icons/lu'

import { Alert } from '@/components/feedback/Alert'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button, EmptyState } from '@/components/ui'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge/StatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { PerformanceCards } from '@/features/people/components/performance/PerformanceCards'
import { useMyTeam } from '@/features/people/hooks/usePerformance'
import { teamPerformanceBase } from '@/features/people/services/peopleService'
import { TeamMember } from '@/features/people/types'
import { formatDateOnly } from '@/features/people/utils/formatDate'

import styles from './MyWork.module.scss'

const goalsLine = (waiting: number) =>
  waiting === 0
    ? 'Goals approved'
    : `${waiting} goal${waiting === 1 ? '' : 's'} waiting for approval`

const nameParts = (fullName: string) => {
  const [firstName = '', lastName = ''] = fullName.trim().split(/\s+/)
  return { firstName, lastName }
}

const ReportBadge: React.FC<{ submitted: boolean }> = ({ submitted }) => (
  <StatusBadge
    status={submitted ? 'Submitted' : 'Not yet'}
    backgroundColor={
      submitted ? 'var(--color-positive-tint)' : 'var(--color-caution-tint)'
    }
    color={submitted ? 'var(--color-positive)' : 'var(--color-caution-text)'}
  />
)

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
    const member =
      team.members.find((item) => item.staffId === open.staffId) ?? open
    return (
      <div className={styles.stack}>
        <PagePanel
          title={`${member.fullName} · ${goalsLine(member.goalsWaiting)}`}
          hint="Read each goal. Change anything you want, then approve."
          action={
            <Button size="sm" variant="outline" onClick={() => setOpen(null)}>
              Back to team
            </Button>
          }>
          <p className={styles.muted}>
            {member.jobTitle} · week of {formatDateOnly(team.weekStart)}
          </p>
        </PagePanel>
        <PerformanceCards
          base={teamPerformanceBase(managerStaffId, member.staffId)}
          firstName={member.fullName.split(' ')[0]}
          readOnly={false}
          showTasks
        />
        <div>
          <Button variant="outline" onClick={() => setOpen(null)}>
            Back to team
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.stack}>
      {team.members.length > 0 && (
        <Alert variant="info" icon={<LuUsers aria-hidden />}>
          You see this tab because {team.members.length}{' '}
          {team.members.length === 1 ? 'person reports' : 'people report'} to
          you.
        </Alert>
      )}
      <PagePanel
        title="Direct reports"
        hint={`${team.members.length} ${
          team.members.length === 1 ? 'person' : 'people'
        } · week of ${formatDateOnly(team.weekStart)}`}>
        {team.members.length === 0 ? (
          <p className={styles.muted}>Nobody reports to you right now.</p>
        ) : (
          <ul className={styles.list}>
            {team.members.map((member) => (
              <li key={member.staffId}>
                <span className={styles.person}>
                  <Avatar {...nameParts(member.fullName)} size="md" />
                  <span>
                    <strong>{member.fullName}</strong>
                    <span className={styles.muted}>{member.jobTitle}</span>
                  </span>
                </span>
                <span className={styles.teamStatus}>
                  <span className={styles.muted}>This week&apos;s report</span>
                  <ReportBadge submitted={!!member.reportId} />
                </span>
                <span className={styles.muted}>
                  {goalsLine(member.goalsWaiting)}
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
    </div>
  )
}
