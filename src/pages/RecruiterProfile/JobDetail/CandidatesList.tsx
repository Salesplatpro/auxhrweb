import React, { useMemo } from 'react'
import { LuEllipsis } from 'react-icons/lu'

import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { ColumnDef, DataTable } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { Pill } from '@/components/ui/Pill'
import { humanStatus } from '@/pages/TalentProfile/Job/jobPipeline'
import type { SingleJobDetails } from '@/utils/recruiterJobPostsTypes'

import { getStatusBadge } from '../getJobStatus'
import {
  InterviewPill,
  sourceLabel,
  stageLabel,
  VerificationPill,
} from './candidateLabels'
import styles from './Candidates.module.scss'
import { CvMatch } from './CvMatch'

type CandidatesListProps = {
  applications: SingleJobDetails[]
  emptyState: React.ReactNode
  selected: Set<string | number>
  onSelectedChange: (selected: Set<string | number>) => void
  onOpen: (id: string) => void
  onMessage: (application: SingleJobDetails) => void
}

const appliedOn = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })

export const CandidatesList = ({
  applications,
  emptyState,
  selected,
  onSelectedChange,
  onOpen,
  onMessage,
}: CandidatesListProps) => {
  const columns = useMemo<ColumnDef<SingleJobDetails>[]>(
    () => [
      {
        key: 'candidate',
        header: 'Candidate',
        render: (row) => (
          <button
            type="button"
            className={styles.person}
            onClick={() => onOpen(row.id)}>
            <Avatar
              firstName={row.talent.firstName}
              lastName={row.talent.lastName}
              size="sm"
            />
            <span className={styles.personText}>
              <span className={styles.name}>
                {row.talent.firstName} {row.talent.lastName}
              </span>
              <span className={styles.muted}>{row.talent.email}</span>
            </span>
          </button>
        ),
      },
      {
        key: 'cvMatch',
        header: 'CV match',
        render: (row) => <CvMatch value={row.cvSimilarityScore} />,
      },
      {
        key: 'stage',
        header: 'Stage',
        render: (row) => (
          <span className={styles.muted}>{stageLabel(row.stage)}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <StatusBadge
            status={humanStatus(row.status)}
            {...getStatusBadge(row.status)}
            showDot
          />
        ),
      },
      {
        key: 'interview',
        header: 'Interview',
        render: (row) => (
          <InterviewPill
            status={row.interview?.status}
            failed={row.interview?.failed}
          />
        ),
      },
      {
        key: 'verification',
        header: 'Verification',
        render: (row) => <VerificationPill status={row.verification} />,
      },
      {
        key: 'source',
        header: 'Source',
        hideBelow: 1200,
        render: (row) => (
          <Pill tone="neutral" size="sm">
            {sourceLabel(row.source)}
          </Pill>
        ),
      },
      {
        key: 'applied',
        header: 'Applied',
        hideBelow: 1024,
        render: (row) => (
          <span className={styles.muted}>{appliedOn(row.createdAt)}</span>
        ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (row) => (
          <Dropdown
            trigger={
              <span className={styles.menu} aria-label="Candidate actions">
                <LuEllipsis size={18} />
              </span>
            }
            items={[
              {
                key: 'open',
                label: 'View candidate',
                onClick: () => onOpen(row.id),
              },
              {
                key: 'message',
                label: 'Message',
                onClick: () => onMessage(row),
              },
            ]}
          />
        ),
      },
    ],
    [onOpen, onMessage],
  )

  const toggleRow = (key: string | number) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onSelectedChange(next)
  }

  return (
    <DataTable
      variant="plain"
      columns={columns}
      data={applications}
      getRowKey={(row) => row.id}
      ariaLabel="Candidates"
      showRowNumber={false}
      allowOverflow
      selectedRowKeys={selected}
      onToggleRow={toggleRow}
      onToggleAll={(keys) => onSelectedChange(new Set(keys))}
      emptyState={emptyState}
    />
  )
}
