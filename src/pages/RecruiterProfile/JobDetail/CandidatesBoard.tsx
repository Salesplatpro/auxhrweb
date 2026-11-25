import React, { useState } from 'react'
import { LuClock3, LuEllipsis, LuPlus } from 'react-icons/lu'

import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { Spinner } from '@/components/ui/Spinner'
import { useJobApplications } from '@/features/applications/hooks/useJobApplications'
import type { JobApplicationsQuery } from '@/features/applications/services/applicationService'
import { formatTimeAgo } from '@/utils'
import type {
  BoardColumn,
  SingleJobDetails,
} from '@/utils/recruiterJobPostsTypes'

import { BelowCvMinimum, BOARD_COLUMNS } from './candidateLabels'
import styles from './Candidates.module.scss'

const COLUMN_PAGE = 10

type CandidatesBoardProps = {
  jobId: string
  query: JobApplicationsQuery
  onOpen: (id: string) => void
  onMessage: (application: SingleJobDetails) => void
}

const yearsOf = (experience?: string | null) =>
  experience ? experience.replace(/\s*years?/i, ' yrs') : null

const BoardCard = ({
  application,
  onOpen,
  onMessage,
}: {
  application: SingleJobDetails
  onOpen: (id: string) => void
  onMessage: (application: SingleJobDetails) => void
}) => {
  const { talent } = application
  const place = talent.locationCity || talent.locationState || 'Remote'
  const screening = talent.prescreeningScore
  return (
    <li className={styles.card}>
      <button
        type="button"
        className={styles.person}
        onClick={() => onOpen(application.id)}>
        <Avatar
          firstName={talent.firstName}
          lastName={talent.lastName}
          size="sm"
        />
        <span className={styles.personText}>
          <span className={styles.name}>
            {talent.firstName} {talent.lastName}
          </span>
          <span className={styles.muted}>
            {[place, yearsOf(talent.experience)].filter(Boolean).join(' · ')}
          </span>
        </span>
      </button>
      <dl className={styles.scores}>
        <div>
          <dt>CV match</dt>
          <dd>
            {application.cvSimilarityScore == null
              ? 'Pending'
              : `${Math.round(application.cvSimilarityScore)}%`}
            {application.belowCvMinimum && (
              <>
                {' '}
                <BelowCvMinimum />
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>Screening</dt>
          <dd>
            {screening == null ? 'Pending' : `${Math.round(screening)} / 100`}
          </dd>
        </div>
      </dl>
      <div className={styles.cardFoot}>
        <span className={styles.muted}>
          <LuClock3 aria-hidden /> {formatTimeAgo(application.createdAt)}
        </span>
        <Dropdown
          trigger={
            <span className={styles.menu} aria-label="Candidate actions">
              <LuEllipsis size={16} />
            </span>
          }
          items={[
            {
              key: 'open',
              label: 'View candidate',
              onClick: () => onOpen(application.id),
            },
            {
              key: 'message',
              label: 'Message',
              onClick: () => onMessage(application),
            },
          ]}
        />
      </div>
    </li>
  )
}

const BoardColumnList = ({
  jobId,
  column,
  label,
  query,
  onOpen,
  onMessage,
}: CandidatesBoardProps & { column: BoardColumn; label: string }) => {
  const [limit, setLimit] = useState(COLUMN_PAGE)
  const { data, isLoading } = useJobApplications(jobId, {
    ...query,
    boardColumn: column,
    limit,
    offset: 0,
  })
  const applications = data?.data?.applications ?? []
  const total = data?.data?.total ?? 0

  return (
    <section className={styles.column} aria-label={label}>
      <header className={styles.columnHead}>
        <span className={styles.name}>{label}</span>
        <span className={styles.count}>{total}</span>
        {total > applications.length && (
          <button
            type="button"
            className={styles.more}
            aria-label={`Show more in ${label}`}
            onClick={() => setLimit((current) => current + COLUMN_PAGE)}>
            <LuPlus />
          </button>
        )}
      </header>
      {isLoading ? (
        <Spinner />
      ) : (
        <ul className={styles.cards}>
          {applications.map((application) => (
            <BoardCard
              key={application.id}
              application={application}
              onOpen={onOpen}
              onMessage={onMessage}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export const CandidatesBoard = (props: CandidatesBoardProps) => (
  <div className={styles.board}>
    {BOARD_COLUMNS.map((column) => (
      <BoardColumnList
        key={column.key}
        column={column.key}
        label={column.label}
        {...props}
      />
    ))}
  </div>
)
