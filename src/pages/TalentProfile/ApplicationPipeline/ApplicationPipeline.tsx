import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import { PageShell } from '@/components/layout/PageShell'
import { ColumnDef, DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterChip } from '@/components/ui/FilterChip'
import { Heading, Text } from '@/components/ui/Typography'
import { dayMonth } from '@/features/talent-applications/format'
import { StatusBadge } from '@/features/talent-applications/StatusBadge/StatusBadge'
import { applicationPath } from '@/features/talent-applications/steps'
import {
  ApplicationGroup,
  TalentApplicationRow,
} from '@/features/talent-applications/types'
import { useAllJobApplicationsQuery } from '@/redux/api/talent'

import styles from './ApplicationPipeline.module.scss'

const GROUPS: { key: ApplicationGroup | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'needs_you', label: 'Needs you' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'closed', label: 'Closed' },
]

const COLUMNS: ColumnDef<TalentApplicationRow>[] = [
  {
    key: 'role',
    header: 'Role',
    render: (row) => {
      const company = row.job.organization?.name
      const title = row.job.role?.name ?? ''
      return (
        <span className={styles.role}>
          <span className={styles.initial} aria-hidden>
            {(company ?? title)[0]?.toUpperCase()}
          </span>
          <span>
            <span className={styles.title}>{title}</span>
            {company && <span className={styles.company}>{company}</span>}
          </span>
        </span>
      )
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.candidateStatus} />,
  },
  {
    key: 'applied',
    header: 'Applied',
    hideBelow: 640,
    render: (row) => (
      <span className={styles.date}>{dayMonth(row.createdAt)}</span>
    ),
  },
  {
    key: 'view',
    header: '',
    align: 'right',
    render: (row) => (
      <Link to={applicationPath(row.id)} className={styles.view}>
        View pipeline
      </Link>
    ),
  },
]

export const ApplicationPipeline = () => {
  const [group, setGroup] = useState<ApplicationGroup | 'all'>('all')
  const { data, isLoading } = useAllJobApplicationsQuery(
    group === 'all' ? undefined : { group },
  )
  const counts = data?.counts

  return (
    <PageShell wide>
      <header className={styles.header}>
        <Heading level={1}>Applications</Heading>
        {counts && (
          <Text as="p" size="fs-md" color="muted">
            {counts.all} application{counts.all === 1 ? '' : 's'} ·{' '}
            {counts.needs_you} need you
          </Text>
        )}
      </header>
      <div className={styles.chips}>
        {GROUPS.map((item) => (
          <FilterChip
            key={item.key}
            active={group === item.key}
            onClick={() => setGroup(item.key)}>
            {item.label} {counts?.[item.key] ?? ''}
          </FilterChip>
        ))}
      </div>
      <div className={styles.card}>
        <DataTable
          variant="plain"
          columns={COLUMNS}
          data={data?.applications ?? []}
          pageSize={10}
          isLoading={isLoading}
          getRowKey={(row) => row.id}
          ariaLabel="Your applications"
          emptyState={
            <EmptyState
              title="No applications here"
              description="Applications you send from Find Jobs show up here."
            />
          }
        />
      </div>
    </PageShell>
  )
}
