import React, { useState } from 'react'
import { LuUsers } from 'react-icons/lu'

import { Alert } from '@/components/feedback/Alert'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button, EmptyState } from '@/components/ui'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge/StatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { PerformanceCards } from '@/features/people/components/performance/PerformanceCards'
import {
  useMyTeam,
  useTeamMemberDetails,
} from '@/features/people/hooks/usePerformance'
import { teamPerformanceBase } from '@/features/people/services/peopleService'
import { MyTeamData, TeamMember } from '@/features/people/types'
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

const peopleCount = (count: number) =>
  `${count} ${count === 1 ? 'person' : 'people'}`

const isReport = (member: TeamMember) => member.relation !== 'department'
const inDepartment = (member: TeamMember) => member.relation !== 'report'

const whyLine = (team: MyTeamData, reports: number) => {
  const parts = []
  if (reports > 0) {
    parts.push(
      `${reports} ${reports === 1 ? 'person reports' : 'people report'} to you`,
    )
  }
  if (team.departments.length > 0) {
    parts.push(
      `you head ${team.departments.map((item) => item.name).join(', ')}`,
    )
  }
  return parts.length ? `You see this tab because ${parts.join(' and ')}.` : ''
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

const MemberList: React.FC<{
  members: TeamMember[]
  onOpen: (member: TeamMember) => void
}> = ({ members, onOpen }) => (
  <ul className={styles.list}>
    {members.map((member) => (
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
        <span className={styles.muted}>{goalsLine(member.goalsWaiting)}</span>
        <Button size="sm" variant="outline" onClick={() => onOpen(member)}>
          Open
        </Button>
      </li>
    ))}
  </ul>
)

const MemberDetails: React.FC<{ managerStaffId: string; staffId: string }> = ({
  managerStaffId,
  staffId,
}) => {
  const { details, isLoading, hasError } = useTeamMemberDetails(
    managerStaffId,
    staffId,
  )
  return (
    <PagePanel title="Details">
      {isLoading ? (
        <Spinner />
      ) : hasError || !details ? (
        <p className={styles.muted}>Couldn&apos;t load these details.</p>
      ) : (
        <dl className={styles.facts}>
          <div>
            <dt>Department</dt>
            <dd>{details.department ?? '—'}</dd>
          </div>
          <div>
            <dt>Manager</dt>
            <dd>{details.managerName ?? '—'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{details.email}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{details.phone ?? '—'}</dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd>{formatDateOnly(details.startDate)}</dd>
          </div>
          <div>
            <dt>On AuxHR</dt>
            <dd>{details.joinedAt ? 'Joined' : 'Not joined yet'}</dd>
          </div>
        </dl>
      )}
    </PagePanel>
  )
}

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
        {inDepartment(member) && (
          <MemberDetails
            managerStaffId={managerStaffId}
            staffId={member.staffId}
          />
        )}
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

  const reports = team.members.filter(isReport)
  const why = whyLine(team, reports.length)

  return (
    <div className={styles.stack}>
      {why && (
        <Alert variant="info" icon={<LuUsers aria-hidden />}>
          {why}
        </Alert>
      )}
      {(reports.length > 0 || team.departments.length === 0) && (
        <PagePanel
          title="Your direct reports"
          hint={`${peopleCount(reports.length)} · week of ${formatDateOnly(
            team.weekStart,
          )}`}>
          {reports.length === 0 ? (
            <p className={styles.muted}>Nobody reports to you right now.</p>
          ) : (
            <MemberList members={reports} onOpen={setOpen} />
          )}
        </PagePanel>
      )}
      {team.departments.map((department) => {
        const members = team.members.filter(
          (member) =>
            inDepartment(member) && member.departmentName === department.name,
        )
        return (
          <PagePanel
            key={department.id}
            title={department.name}
            hint={`${peopleCount(members.length)} · you head this department`}>
            {members.length === 0 ? (
              <p className={styles.muted}>
                No one is in {department.name} yet.
              </p>
            ) : (
              <MemberList members={members} onOpen={setOpen} />
            )}
          </PagePanel>
        )
      })}
    </div>
  )
}
